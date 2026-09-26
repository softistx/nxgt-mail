# The generated module

This page is for using the module the build writes — `src/generated/mail.ts`
by default: what it exports, what a render function and `t` accept, answer and
throw, and how they fit with the rest of your code. How to write the templates
and catalogues it comes from is in [Templates](templates.md) and
[Catalogues](catalogues.md); how to run the build, in [Building](building.md).

```ts
import { mails, t } from './generated/mail';

mails.verifyEmail({ locale: 'fr', name: 'Ada', link: 'https://example.com/verify?token=abc', hours: 24 });
// { subject: 'Confirmez votre adresse e-mail', html: '<!DOCTYPE html>…', text: 'Plus qu\'une étape Bonjour Ada, …' }

t('fr', 'verifyEmail.body', { name: 'Ada' });
// 'Bonjour Ada, confirmez cette adresse pour terminer votre inscription.'
```

The module is plain TypeScript: **it imports nothing**, and at run time it uses
only `Intl.PluralRules`, `Intl.NumberFormat` and `Intl.DateTimeFormat`. Maizzle,
Vue, Tailwind and the ICU parser stayed in the build; nothing of
`@nxgt/mail-build` is needed where the module runs.

`compileMessages` alone writes the first half of it — everything down to `t`,
without `mails` — for a project that has catalogues and no templates. Every
section of this page about `t` applies to both.

## What it exports

For catalogues in `en` and `fr`, with `en` as the fallback locale, and one
template, `emails/verify-email.vue`:

```ts
// The messages
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

// Distributive: an unknown key widens K to every key, some of which take no
// argument, so tsc reports the key rather than a missing arguments object.
type Rest<K extends MessageKey> = K extends MessageKey
	? MessageArgs[K] extends { readonly [argument: string]: never }
		? [args?: MessageArgs[K], options?: FormatOptions]
		: [args: MessageArgs[K], options?: FormatOptions]
	: never;

export function t<K extends MessageKey>(locale: Locale, key: K, ...rest: Rest<K>): string;

// The e-mails — not written by compileMessages alone
/** A rendered e-mail: `Rendered` in `@nxgt/mail`. */
export interface RenderedMail {
	readonly subject: string;
	readonly html: string;
	readonly text: string;
}

/** The arguments of each e-mail: its locale, a time zone for its dates, and its props, typed. */
export interface MailArgs {
	verifyEmail: {
		readonly locale: Locale;
		readonly timeZone?: string;
		readonly hours: number;
		readonly link: string;
		readonly name: string;
	};
	// … one entry per template, sorted
}

export type MailName = keyof MailArgs;

/** One render function per e-mail: `mails.verifyEmail({ locale, … })`. */
export const mails: { readonly [M in MailName]: (args: MailArgs[M]) => RenderedMail };
```

`Locale`, `MessageKey`, `MessageArgs`, `MailArgs` and `MailName` are literal
types written from the catalogues and the templates: adding a key, a locale, a
prop or a template changes them on the next build.

## `mails.<email>(args)`

One render function per template, named after its file: `verify-email.vue` is
`mails.verifyEmail`. It takes one object:

| Property | Type | Effect |
| --- | --- | --- |
| `locale` | `Locale` | Required. The locale every message is written in, and the `lang` of the HTML. Pick it with `pickLocale` (below) |
| `timeZone` | `string` | Optional. The IANA time zone dates and times are written in. Default `'UTC'` |
| each prop | `string`, `number` or `Date` | Required. Typed from how the template and its messages use it — see [Templates — how props are typed](templates.md#how-props-are-typed) |

It answers a `RenderedMail`, `{ subject, html, text }` — the shape of
`Rendered` in `@nxgt/mail`, so it spreads straight into a `MailMessage`:

```ts
import { createMemoryMailer } from '@nxgt/mail';
import { mails } from './generated/mail';

const mailer = createMemoryMailer();

await mailer.send({
	to: 'ada@example.com',
	...mails.verifyEmail({ locale: 'en', name: 'Ada', link: 'https://example.com/verify?token=abc', hours: 24 }),
});

mailer.sent[0]?.subject; // 'Confirm your e-mail address'
```

- **`html`** is the whole document Maizzle built — CSS inlined — with every
  value HTML-escaped: `&`, `<`, `>`, `"` and `'`.
- **`text`** is the plain-text part, every value as is.
- **`subject`** is the message `<email>.subject`, with every line break
  replaced by a space.

```ts
import { mails } from './generated/mail';

const { html, text } = mails.verifyEmail({
	locale: 'en',
	name: '<script>alert(1)</script>',
	link: 'https://example.com/verify?token=abc',
	hours: 24,
});
html.includes('Hello &lt;script&gt;alert(1)&lt;/script&gt;,'); // true
text.includes('Hello <script>alert(1)</script>,'); // true
```

### What the compiler refuses

```ts
import { type Locale, mails } from './generated/mail';

declare const locale: Locale;
declare const fromRequest: string;
const link = 'https://example.com/verify?token=abc';

// @ts-expect-error — 'de' is not a locale of this build
mails.verifyEmail({ locale: 'de', name: 'Ada', link, hours: 24 });
// @ts-expect-error — a string is not a Locale: pick it with pickLocale
mails.verifyEmail({ locale: fromRequest, name: 'Ada', link, hours: 24 });
// @ts-expect-error — `nom` is not a prop of verifyEmail
mails.verifyEmail({ locale, nom: 'Ada', link, hours: 24 });
// @ts-expect-error — `hours` is required
mails.verifyEmail({ locale, name: 'Ada', link });
// @ts-expect-error — `{hours, plural}` is a number
mails.verifyEmail({ locale, name: 'Ada', link, hours: '24' });
// @ts-expect-error — a link is a string, checked when the e-mail is rendered
mails.verifyEmail({ locale, name: 'Ada', link: new URL(link), hours: 24 });
// @ts-expect-error — there is no emails/welcome.vue
mails.welcome({ locale });
```

### What it throws

A render function checks at run time what the compiler cannot: that a URL is
one a mail client should follow.

| Cause | Error |
| --- | --- |
| A prop bound to an `href` is not an `http:`, `https:` or `mailto:` URL — `javascript:…`, `/verify`, `' https://…'` with a leading space | `TypeError: mails.verifyEmail: link must be an http:, https: or mailto: URL` |
| A prop bound to a `src` is not an `http:` or `https:` URL | `TypeError: mails.orderPlaced: logo must be an http: or https: URL` |
| `timeZone` is not an IANA time zone, in an e-mail that writes a date | `RangeError`, from `Intl.DateTimeFormat` |
| A `Date` prop is invalid (`new Date('nope')`) | `RangeError`, from `format()` |

The URL is checked before anything is rendered, so a refused one never reaches
a mailer.

### `MailArgs` and `MailName` — typing your own helpers

A function that forwards an e-mail's name and its arguments keeps the check
when it is generic over `MailName`:

```ts
import type { Mailer, SentMail } from '@nxgt/mail';
import { type MailArgs, type MailName, mails } from './generated/mail';

export function sendMail<M extends MailName>(
	mailer: Mailer,
	to: string,
	name: M,
	args: MailArgs[M],
): Promise<SentMail> {
	return mailer.send({ to, ...mails[name](args) });
}
```

```ts
import { createMemoryMailer } from '@nxgt/mail';
import { sendMail } from './send-mail';

const mailer = createMemoryMailer();
const link = 'https://example.com/verify?token=abc';

await sendMail(mailer, 'ada@example.com', 'verifyEmail', { locale: 'en', name: 'Ada', link, hours: 24 });
// @ts-expect-error — verifyEmail needs `hours`
await sendMail(mailer, 'ada@example.com', 'verifyEmail', { locale: 'en', name: 'Ada', link });
```

## `t(locale, key, args, options)`

The messages on their own — for a line you write outside a template, or a
project with no templates.

| Parameter | Type | Effect |
| --- | --- | --- |
| `locale` | `Locale` | One of the build's locales. Any other string is a compile error; pick it with `pickLocale` (below) |
| `key` | `MessageKey` | The dotted key of a message: `'verifyEmail.body'` |
| `args` | `MessageArgs[K]` | Every argument the fallback locale's message declares, typed from its ICU. Required when there are any; optional (and `{}`) when there are none |
| `options` | `FormatOptions` | `timeZone`: the IANA time zone dates and times are written in. Default `'UTC'` |

It answers the message as a `string`, every argument substituted and formatted
for the locale:

```ts
import { t } from './generated/mail';

t('en', 'verifyEmail.subject'); // 'Confirm your e-mail address'
t('en', 'verifyEmail.subject', {}); // the same
t('en', 'verifyEmail.expires', { hours: 24 }); // 'This link expires in 24 hours.'
```

### What the compiler refuses

```ts
import { t } from './generated/mail';

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
import { t } from './generated/mail';

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
import { fallbackLocale, locales, t } from './generated/mail';

const locale = pickLocale(['fr-CA', 'en'], locales, fallbackLocale); // 'fr', typed Locale

t(locale, 'verifyEmail.subject'); // 'Confirmez votre adresse e-mail'
```

See [Locales](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/locales.md)
in `@nxgt/mail` for how a wanted locale matches.

## `MessageKey` and `MessageArgs` — typing your own helpers

A function that forwards a key and its arguments keeps the check when it is
generic over `MessageKey`:

```ts
import type { MessageArgs, MessageKey } from './generated/mail';

interface Line<K extends MessageKey = MessageKey> {
	readonly key: K;
	readonly args: MessageArgs[K];
}

export function line<K extends MessageKey>(key: K, args: MessageArgs[K]): Line<K> {
	return { key, args };
}

line('verifyEmail.expires', { hours: 24 }); // checked like t
```

## A realistic case — sending, and testing it

The render function goes where the e-mail is sent; the locale is the
recipient's, picked from the build's own:

```ts
// send-verification.ts
import { type Mailer, pickLocale, type SentMail } from '@nxgt/mail';
import { fallbackLocale, locales, mails } from './generated/mail';

export function sendVerification(
	mailer: Mailer,
	user: { readonly email: string; readonly name: string; readonly locale: string | null },
	link: string,
): Promise<SentMail> {
	const locale = pickLocale(user.locale, locales, fallbackLocale);
	return mailer.send({
		to: user.email,
		...mails.verifyEmail({ locale, name: user.name, link, hours: 24 }),
	});
}
```

And its test, with the memory mailer — the module needs no build tool at run
time, so the test runs in microseconds:

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
	expect(mailer.sent[0]?.html).toContain('href="https://example.com/verify?token=abc"');
});
```

A second example, with a date, a price and an image, is in
[Templates — a realistic case](templates.md#a-realistic-case--an-order-confirmation).

### An e-mail by hand

An e-mail you would rather write yourself — or one from a project that
compiles messages only — is a function answering `Rendered` from
`@nxgt/mail`, filled with `t`. The escaping a render function does is then
yours:

```ts
import type { Rendered } from '@nxgt/mail';
import { type Locale, t } from './generated/mail';

const escape = (value: string) =>
	value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function verifyEmail(locale: Locale, name: string, link: string, hours: number): Rendered {
	const body = t(locale, 'verifyEmail.body', { name });
	const expires = t(locale, 'verifyEmail.expires', { hours });
	return {
		subject: t(locale, 'verifyEmail.subject'),
		html: `<p>${escape(body)}</p><p><a href="${escape(link)}">${escape(link)}</a></p><p>${escape(expires)}</p>`,
		text: `${body}\n\n${link}\n\n${expires}`,
	};
}
```

`t` answers text, not HTML: a name, and any `<` or `&` a message holds, must be
escaped before it goes into `html`, and a link checked before it goes into an
`href`.

## What the module needs to run and to compile

- **An `Intl` with data for your locales.** Bun and Node ship full ICU data; a
  runtime built with reduced ICU data may write other locales as English.
- **Nothing from your tsconfig.** Your compiler checks the module like any
  other file, and it compiles under the strictest options: `strict`,
  `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noUnusedLocals`,
  `noUnusedParameters`, `noPropertyAccessFromIndexSignature`,
  `noImplicitReturns`, with `target` and `lib` as low as ES2020. It holds only
  the `Intl` helpers its messages call, and only the escaping and URL helpers
  its templates need.
- **Little room.** For two e-mails in two locales the module is 13.8 KB
  (3.8 KB gzipped), each `html` about 2.5 KB and shared by every locale; a
  render takes about 11 µs.
- **Not edited by hand.** The first line says so; the next build replaces it.
  Exclude `generated/` from your linter and your coverage.
