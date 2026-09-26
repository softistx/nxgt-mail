# Translating outside templates

This page is for using the project's catalogues from your application's own
code, with `createTranslator`. Typical uses are the text of a notification, a
text message, a string a test compares with, or a subject built outside
Maizzle.

```ts
import { pickLocale } from '@nxgt/mail';
import { createTranslator } from '@nxgt/mail-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';

declare const user: { locale: string | null };

const t = createTranslator({ en, fr }, () => pickLocale(user.locale, ['en', 'fr'], 'en'));

t('verifyEmail.expires', { minutes: 15 }); // 'The link expires in 15 minutes.' for an English user
```

`pickLocale`, from `@nxgt/mail`, answers the first of the user's locales that
the catalogues have, or the fallback. It picks `fr` for `fr-CA`, and `en` for
`null` or `de`. Put it in the language provider, and `t` never meets a
language it has no catalogue for.

## The signature

```ts
import type { Catalogues } from '@nxgt/mail-i18n';

type LanguageProvider = string | (() => string);
type MessageArgs = Readonly<Record<string, string | number | Date>>;
type Translate = (key: string, args?: MessageArgs, language?: LanguageProvider) => string;

function createTranslator(catalogues: Catalogues, getLanguage: LanguageProvider): Translate;
```

| Parameter | Type | Effect |
| --- | --- | --- |
| `catalogues` | `Catalogues` | The catalogues by locale, `{ en, fr }`, as written in `locales/`. A JSON import is accepted as it is |
| `getLanguage` | `string \| () => string` | The language of every call that does not name one. A function is called **at each call**, so it can read the current user or request |

`t(key, args?, language?)`:

| Argument | Effect |
| --- | --- |
| `key` | The dotted key, `verifyEmail.title` |
| `args` | The message's arguments: a string, a number or a `Date` each |
| `language` | This call's language, a locale or a function: overrides `getLanguage` |

```ts
const t = createTranslator({ en, fr }, 'fr');

t('verifyEmail.expires', { minutes: 1 }); // 'Le lien expire dans 1 minute.'
t('verifyEmail.expires', { minutes: 1 }, 'en'); // 'The link expires in 1 minute.'
t('verifyEmail.expires', { minutes: 1 }, () => 'en'); // 'The link expires in 1 minute.'
```

Compiled messages are cached per locale and key, so calling `t` in a loop is
cheap.

## How it differs from `@nxgt/i18n`

The shape is the same: `createTranslator(resources, getLanguage)` answers
`t(key, args, language?)`, and a language is a string or a function that
answers one. The difference is what happens when a translation cannot be
right:

| Situation | `@nxgt/i18n` | `@nxgt/mail-i18n` |
| --- | --- | --- |
| A key the language's catalogue does not have | Answers the key, `'verifyEmail.titel'` | **Throws** `t: fr: verifyEmail.titel is not a key`. So does a key that names a group of messages, `verifyEmail` |
| A language with no catalogue | Answers the key | **Throws** `t: the language is not a locale of the catalogues — pick one with pickLocale` |
| A message that does not format (an argument missing) | Logs, and answers the raw message with `{name}` in it | **Throws** `t: en: common.greeting could not be formatted`, the formatter's error as `cause` |

A web page can show a key for a moment and correct it on the next deploy. An
e-mail cannot be corrected once it has gone out, and one with `{link}` in it
is worse than none. So this `t` refuses, and the caller decides what to do.

The error never names the language itself when it is unknown: a language
often comes from a user's profile, and a message reports a shape, never a
value.

## Errors

A `TypeError` when the translator is created with the wrong arguments, a
plain `Error` when `t` refuses. Neither has a `code`: each is a mistake in the
code or the catalogues, to fix, never a condition to `switch` on.

| Thrown | When | Message |
| --- | --- | --- |
| `TypeError` | `createTranslator` is called | `createTranslator: catalogues must be an object of catalogues by locale, as { en, fr }` |
| `TypeError` | `createTranslator` is called | `createTranslator: getLanguage must be a locale or a function that answers one` |
| `Error` | `t` is called | `t: the language is not a locale of the catalogues — pick one with pickLocale` |
| `Error` | `t` is called | `t: fr: common.greting is not a key` |
| `Error` | `t` is called | `t: en: common.greeting could not be formatted` (with `cause`) |

```ts
const t = createTranslator({ en, fr }, () => 'de');

t('verifyEmail.title'); // Error: t: the language is not a locale of the catalogues — pick one with pickLocale
```

## What it does not check

`createTranslator` reads the catalogues it is given. It does not run the
checks of the build: that every locale has the fallback's keys, that the
arguments agree. The build has run them on the same files, so import the
catalogues the project builds from. An argument passed and not used is
ignored. An argument the message needs and did not get is the formatting
failure above.

## A realistic use

A reminder sent as a text message, in the recipient's locale, from the same
catalogues as the e-mails:

```ts
// reminders.ts, in the application
import { pickLocale } from '@nxgt/mail';
import { createTranslator } from '@nxgt/mail-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';

const locales = ['en', 'fr'] as const;
const t = createTranslator({ en, fr }, 'en');

interface User {
	readonly phone: string;
	readonly locale: string | null;
}

export function reminderText(user: User, minutes: number): string {
	const language = pickLocale(user.locale, locales, 'en');
	return t('verifyEmail.expires', { minutes }, language);
}
```

The recipient's locale is a field of the user, not the language of the
request that triggers the send. A language per call keeps one translator for
the whole application.

In a test, `t` gives the string a built e-mail should contain, in the
locale under test:

```ts
import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createTranslator } from '@nxgt/mail-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';

const t = createTranslator({ en, fr }, 'en');

test.each(['en', 'fr'])('the %s verification e-mail says when the link expires', (locale) => {
	const html = readFileSync(`dist/${locale}/verify-email.html`, 'utf8');
	expect(html).toContain(t('verifyEmail.expires', { minutes: 15 }, locale));
});
```

## See also

- [Catalogues](catalogues.md) — the format `createTranslator` reads.
- [Templates](templates.md) — `t` inside a template, which also checks the
  arguments against the fallback locale.
