# The generated module

This page is for using the module `compileMessages` writes — usually
`src/generated/messages.ts`: what it exports, what `t` accepts and answers, and
how it fits with the rest of your code. How to write the catalogues it comes
from is in [Catalogues](catalogues.md).

```ts
import { t } from './generated/messages';

t('fr', 'verifyEmail.body', { name: 'Ada' });
// 'Bonjour Ada, confirmez cette adresse pour terminer votre inscription.'
```

The module is plain TypeScript: **it imports nothing**, and at run time it uses
only `Intl.PluralRules`, `Intl.NumberFormat` and `Intl.DateTimeFormat`. The ICU
parser stayed in the build; nothing of `@nxgt/mail-build` is needed where the
module runs.

## What it exports

For catalogues in `en` and `fr`, with `en` as the fallback locale:

```ts
export const locales: readonly ['en', 'fr'];
export type Locale = 'en' | 'fr';
export const fallbackLocale: Locale; // 'en'

export interface FormatOptions {
	/** The time zone dates are written in, usually the recipient's. Defaults to UTC; an unknown zone throws a RangeError. */
	readonly timeZone?: string;
}

/** The arguments of each message, typed from its ICU. */
export interface MessageArgs {
	'verifyEmail.body': { readonly name: string };
	'verifyEmail.expires': { readonly hours: number };
	'verifyEmail.requestedAt': { readonly at: Date };
	'verifyEmail.subject': { readonly [argument: string]: never }; // takes no argument
	// … one entry per key, sorted
}

export type MessageKey = keyof MessageArgs;

export function t<K extends MessageKey>(
	locale: Locale,
	key: K,
	...rest: MessageArgs[K] extends { readonly [argument: string]: never }
		? [args?: MessageArgs[K], options?: FormatOptions]
		: [args: MessageArgs[K], options?: FormatOptions]
): string;
```

`Locale`, `MessageKey` and `MessageArgs` are literal types written from the
catalogues: adding a key or a locale changes them on the next build.

## `t(locale, key, args, options)`

| Parameter | Type | Effect |
| --- | --- | --- |
| `locale` | `Locale` | One of the build's locales. Any other string is a compile error; pick it with `pickLocale` (below) |
| `key` | `MessageKey` | The dotted key of a message: `'verifyEmail.body'` |
| `args` | `MessageArgs[K]` | Every argument the fallback locale's message declares, typed from its ICU. Required when there are any; optional (and `{}`) when there are none |
| `options` | `FormatOptions` | `timeZone`: the IANA time zone dates and times are written in. Default `'UTC'` |

It answers the message as a `string`, every argument substituted and formatted
for the locale:

```ts
import { t } from './generated/messages';

t('en', 'verifyEmail.subject'); // 'Confirm your e-mail address'
t('en', 'verifyEmail.subject', {}); // the same
t('en', 'verifyEmail.expires', { hours: 24 }); // 'This link expires in 24 hours.'
```

### What the compiler refuses

```ts
import { t } from './generated/messages';

// @ts-expect-error — `name` is required
t('fr', 'verifyEmail.body', {});
// @ts-expect-error — verifyEmail.body takes `{ name }`
t('fr', 'verifyEmail.body');
// @ts-expect-error — `nom` is not an argument of verifyEmail.body
t('fr', 'verifyEmail.body', { nom: 'Ada' });
// @ts-expect-error — `{hours, plural}` is a number
t('fr', 'verifyEmail.expires', { hours: '24' });
// @ts-expect-error — `{at, date}` is a Date
t('en', 'verifyEmail.requestedAt', { at: '2026-09-25' });
// @ts-expect-error — `de` is not a locale of this build
t('de', 'verifyEmail.subject');
// @ts-expect-error — no such message
t('en', 'verifyEmail.subjet');
// @ts-expect-error — verifyEmail.subject takes no argument
t('en', 'verifyEmail.subject', { name: 'Ada' });
```

The last one is the call left behind when a message drops an argument: a
message with none is typed `{ readonly [argument: string]: never }`, so `{}`
passes and any property is refused.

### The time zone

Dates and times are written in **UTC** unless `options.timeZone` says
otherwise. The right zone is the recipient's — a field of the user, like their
locale — not the server's:

```ts
import { t } from './generated/messages';

const at = new Date('2026-09-25T21:30:00Z');

t('en', 'verifyEmail.requestedAt', { at });
// 'Requested on September 25, 2026 at 9:30 PM.'
t('en', 'verifyEmail.requestedAt', { at }, { timeZone: 'Europe/Paris' });
// 'Requested on September 25, 2026 at 11:30 PM.'
```

`timeZone` is ignored by a message with no date or time in it.

### What it throws

`t` does not check its arguments at run time — the compiler did. What is left
is what `Intl` itself refuses, both a `RangeError`, and only in a message that
writes a date or a time:

| Cause | Error |
| --- | --- |
| `timeZone` is not an IANA time zone (`'Mars/Olympus'`) | `RangeError`, from `Intl.DateTimeFormat` |
| `at` is an invalid `Date` (`new Date('nope')`) | `RangeError`, from `format()` |

## `locales`, `Locale` and `fallbackLocale` — choosing the locale

The locale of an e-mail is the recipient's. `pickLocale` from `@nxgt/mail`
takes the build's locales as they are and answers a `Locale`:

```ts
import { pickLocale } from '@nxgt/mail';
import { fallbackLocale, locales, t } from './generated/messages';

const locale = pickLocale(['fr-CA', 'en'], locales, fallbackLocale); // 'fr', typed Locale

t(locale, 'verifyEmail.subject'); // 'Confirmez votre adresse e-mail'
```

See [Locales](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/locales.md)
in `@nxgt/mail` for how a wanted locale matches.

## `MessageKey` and `MessageArgs` — typing your own helpers

A function that forwards a key and its arguments keeps the check when it is
generic over `MessageKey`:

```ts
import type { MessageArgs, MessageKey } from './generated/messages';

interface Line<K extends MessageKey = MessageKey> {
	readonly key: K;
	readonly args: MessageArgs[K];
}

export function line<K extends MessageKey>(key: K, args: MessageArgs[K]): Line<K> {
	return { key, args };
}

line('verifyEmail.expires', { hours: 24 }); // checked like t
```

## A realistic case — an e-mail by hand, until templates are generated

The render functions that answer `{ subject, html, text }` come with the
templates, in the next part of this package. Until then — or for an e-mail you
would rather write yourself — `t` fills a hand-written function that answers
`Rendered` from `@nxgt/mail`, and any mailer sends it:

```ts
import { type Mailer, pickLocale, type Rendered, type SentMail } from '@nxgt/mail';
import { fallbackLocale, type Locale, locales, t } from './generated/messages';

const escape = (value: string) =>
	value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function verifyEmail(locale: Locale, name: string, link: string, hours: number): Rendered {
	const body = t(locale, 'verifyEmail.body', { name });
	const expires = t(locale, 'verifyEmail.expires', { hours });
	return {
		subject: t(locale, 'verifyEmail.subject'),
		html: `<p>${escape(body)}</p><p><a href="${escape(link)}">${escape(link)}</a></p><p>${escape(expires)}</p>`,
		text: `${body}\n\n${link}\n\n${expires}`,
	};
}

export function sendVerification(
	mailer: Mailer,
	user: { readonly email: string; readonly name: string; readonly locale: string | null },
	link: string,
): Promise<SentMail> {
	const locale = pickLocale(user.locale, locales, fallbackLocale);
	return mailer.send({ to: user.email, ...verifyEmail(locale, user.name, link, 24) });
}
```

`t` answers text, not HTML: a name, and any `<` or `&` a message holds, must be
escaped before it goes into `html` — which is what the generated render
functions will do for you.

And its test, with the memory mailer:

```ts
import { expect, it } from 'bun:test';
import { createMemoryMailer } from '@nxgt/mail';
import { sendVerification } from './send-verification';

it('sends the verification e-mail in the locale of the recipient', async () => {
	const mailer = createMemoryMailer();

	await sendVerification(
		mailer,
		{ email: 'ada@example.com', name: 'Ada', locale: 'fr' },
		'https://example.com/verify?token=abc',
	);

	expect(mailer.sent[0]?.subject).toBe('Confirmez votre adresse e-mail');
});
```

## What the module needs to run and to compile

- **An `Intl` with data for your locales.** Bun and Node ship full ICU data; a
  runtime built with reduced ICU data may write other locales as English.
- **Nothing from your tsconfig.** Your compiler checks the module like any
  other file, and it compiles under the strictest options: `strict`,
  `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noUnusedLocals`,
  `noUnusedParameters`, `noPropertyAccessFromIndexSignature`,
  `noImplicitReturns`, with `target` and `lib` as low as ES2020. It holds only
  the `Intl` helpers its messages call.
- **Not edited by hand.** The first line says so; the next build replaces it.
  Exclude `generated/` from your linter and your coverage.
