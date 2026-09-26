# Troubleshooting `@nxgt/mail-i18n`

Each entry is headed by the message you see. The last section holds the traps
that fail no build — a build that succeeds and is wrong. Search this page for
the words of your message.

How the messages are shaped:

- **A wiring mistake is a `TypeError`**, from the call you wrote: `i18n: …`
  when `maizzle.config.ts` loads, `createTranslator: …` when your server
  creates its translator. Fix the call.
- **A build failure is a plain `Error` starting `i18n:`**, naming what to fix
  (the locale, the template, the key or the file). It has no `code`: it is a
  mistake in the templates or the catalogues, to fix, not a condition to
  catch. The catalogues are checked when `maizzle.config.ts` loads, before
  any template is built; a template is checked while it is rendered; the
  subjects and the files after the build.
- **A run-time failure is a plain `Error` starting `t:`**, from the `t` that
  `createTranslator` answers, and like a build failure it is a mistake to
  fix. It throws where `@nxgt/i18n` would answer the key: an e-mail is not
  sent with a key in it.
- **The error's own message never holds the text of a message.** Its
  `cause` may: a "could not be formatted" error keeps the formatter's error
  as its `cause`, and that error quotes the message, for debugging. A
  catalogue's text is not a secret; the values filled at send time never
  reach these errors.

The samples below use the locales `en` (the fallback locale) and `fr`, the
template `emails/verify-email.vue`, and keys such as `verifyEmail.title`.

## Index

**Install and types**
- [Which `moduleResolution` is supported](#install-and-types)

**Wiring**
- [`i18n: options must be an object, as { locales: ['en', 'fr'] }`](#i18n-options-must-be-an-object-as--locales-en-fr-)
- [`i18n: locales must hold at least one locale, as ['en', 'fr']`](#i18n-locales-must-hold-at-least-one-locale-as-en-fr)
- [`i18n: locales holds something that is not a locale — write each as a BCP 47 tag, as en or pt-BR`](#i18n-locales-holds-something-that-is-not-a-locale--write-each-as-a-bcp-47-tag-as-en-or-pt-br)
- [`i18n: locales holds the same locale twice`](#i18n-locales-holds-the-same-locale-twice)
- [`i18n: fallbackLocale must be one of locales`](#i18n-fallbacklocale-must-be-one-of-locales)
- [`i18n: dir must be a folder of the project`](#i18n-dir-must-be-a-folder-of-the-project)
- [`i18n: layout must be 'nested' or 'flat'`](#i18n-layout-must-be-nested-or-flat)
- [`i18n: catalogues must be a list of catalogues by locale, as [{ en: {...}, fr: {...} }]`](#i18n-catalogues-must-be-a-list-of-catalogues-by-locale-as--en--fr--)
- [`createTranslator: catalogues must be an object of catalogues by locale, as { en, fr }`](#createtranslator-catalogues-must-be-an-object-of-catalogues-by-locale-as--en-fr-)
- [`createTranslator: getLanguage must be a locale or a function that answers one`](#createtranslator-getlanguage-must-be-a-locale-or-a-function-that-answers-one)

**Catalogues** — when `maizzle.config.ts` loads
- [`i18n: locales/fr.json is missing — every locale has a catalogue`](#i18n-localesfrjson-is-missing--every-locale-has-a-catalogue)
- [`i18n: locales/fr.json is not valid JSON`](#i18n-localesfrjson-is-not-valid-json)
- [`i18n: fr: the catalogue must be an object of messages`](#i18n-fr-the-catalogue-must-be-an-object-of-messages)
- [`i18n: en: verifyEmail.title must be a message (a string) or an object of messages`](#i18n-en-verifyemailtitle-must-be-a-message-a-string-or-an-object-of-messages)
- [`i18n: en: verify-email is not camelCase — every segment of a key is camelCase, and nested rather than dotted, as verifyEmail.title`](#i18n-en-verify-email-is-not-camelcase--every-segment-of-a-key-is-camelcase-and-nested-rather-than-dotted-as-verifyemailtitle)
- [`i18n: en: verifyEmail.greeting is not a valid ICU message (EXPECT_ARGUMENT_CLOSING_BRACE)`](#i18n-en-verifyemailgreeting-is-not-a-valid-icu-message-expect_argument_closing_brace)
- [`i18n: en: verifyEmail.greeting uses {first_name}, which is not camelCase — an argument is a camelCase name, as {firstName}`](#i18n-en-verifyemailgreeting-uses-first_name-which-is-not-camelcase--an-argument-is-a-camelcase-name-as-firstname)
- [`i18n: en: verifyEmail.expires uses {minutes} as number and as date`](#i18n-en-verifyemailexpires-uses-minutes-as-number-and-as-date)
- [`i18n: fr: verifyEmail.title is missing — en, the fallback locale, has it`](#i18n-fr-verifyemailtitle-is-missing--en-the-fallback-locale-has-it)
- [`i18n: fr: verifyEmail.titel is not a key of en, the fallback locale`](#i18n-fr-verifyemailtitel-is-not-a-key-of-en-the-fallback-locale)
- [`i18n: fr: verifyEmail.title uses {name}, which en does not declare`](#i18n-fr-verifyemailtitle-uses-name-which-en-does-not-declare)
- [`i18n: fr: verifyEmail.expires uses {minutes} as date, and en declares it as number`](#i18n-fr-verifyemailexpires-uses-minutes-as-date-and-en-declares-it-as-number)

**Templates** — while `maizzle build` renders
- [`[Vue warn]: Unhandled error during execution of render function`](#vue-warn-unhandled-error-during-execution-of-render-function)
- [`i18n: emails/Welcome.vue is not a kebab-case name — name a template as verify-email.vue`](#i18n-emailswelcomevue-is-not-a-kebab-case-name--name-a-template-as-verify-emailvue)
- [`i18n: emails/verify-email.vue is not built through the i18n plugin — leave content to it, and put templates in emails/`](#i18n-emailsverify-emailvue-is-not-built-through-the-i18n-plugin--leave-content-to-it-and-put-templates-in-emails)
- [`i18n: en: verify-email calls t('verifyEmail.titel'), which is not a key of the catalogues`](#i18n-en-verify-email-calls-tverifyemailtitel-which-is-not-a-key-of-the-catalogues)
- [`i18n: en: verify-email calls t('verifyEmail.expires') without {minutes}`](#i18n-en-verify-email-calls-tverifyemailexpires-without-minutes)
- [`i18n: en: verify-email passes {minutes} to verifyEmail.expires as a string — the message uses it as a number`](#i18n-en-verify-email-passes-minutes-to-verifyemailexpires-as-a-string--the-message-uses-it-as-a-number)
- [`i18n: en: verify-email passes {name} to verifyEmail.title, which does not use it`](#i18n-en-verify-email-passes-name-to-verifyemailtitle-which-does-not-use-it)
- [`i18n: en: verify-email calls t('verifyEmail.title') with arguments that are not an object, as { name: placeholder('name') }`](#i18n-en-verify-email-calls-tverifyemailtitle-with-arguments-that-are-not-an-object-as--name-placeholdername-)
- [`i18n: en: verify-email passes a placeholder to {plan}, which verifyEmail.title chooses on with a select — a placeholder always chooses other`](#i18n-en-verify-email-passes-a-placeholder-to-plan-which-verifyemailtitle-chooses-on-with-a-select--a-placeholder-always-chooses-other)
- [`i18n: en: verify-email calls placeholder() with a name that is not camelCase — as placeholder('firstName')`](#i18n-en-verify-email-calls-placeholder-with-a-name-that-is-not-camelcase--as-placeholderfirstname)
- [`i18n: en: verifyEmail.sentOn could not be formatted`](#i18n-en-verifyemailsenton-could-not-be-formatted)

**Manifest and subject** — after the build
- [`i18n: welcome has no subject — add welcome.subject to the catalogues`](#i18n-welcome-has-no-subject--add-welcomesubject-to-the-catalogues)
- [`i18n: en: verifyEmail.subject uses {minutes} as a number — a subject's arguments are placeholders, filled at send time as strings`](#i18n-en-verifyemailsubject-uses-minutes-as-a-number--a-subjects-arguments-are-placeholders-filled-at-send-time-as-strings)
- [`i18n: en: welcome.subject chooses on {kind} with a select — a subject's arguments are placeholders, which always choose other`](#i18n-en-welcomesubject-chooses-on-kind-with-a-select--a-subjects-arguments-are-placeholders-which-always-choose-other)
- [`i18n: welcome was not built in fr`](#i18n-welcome-was-not-built-in-fr)
- [`i18n: ../text/welcome.en.txt was written outside the output folder — …`](#i18n-textwelcomeentxt-was-written-outside-the-output-folder--the-i18n-plugin-lays-out-every-e-mail-set-no-plaintextdestination-and-no-output-path-in-a-template)
- [`i18n: custom/welcome.html is not where the i18n plugin puts an e-mail — set no output path in a template`](#i18n-customwelcomehtml-is-not-where-the-i18n-plugin-puts-an-e-mail--set-no-output-path-in-a-template)

**Run time** — `createTranslator`'s `t`
- [`t: the language is not a locale of the catalogues — pick one with pickLocale`](#t-the-language-is-not-a-locale-of-the-catalogues--pick-one-with-picklocale)
- [`t: fr: verifyEmail.titel is not a key`](#t-fr-verifyemailtitel-is-not-a-key)
- [`t: en: verifyEmail.expires could not be formatted`](#t-en-verifyemailexpires-could-not-be-formatted)

**Traps: a build that succeeds and is wrong**
- [`[Vue warn]: Property "name" was accessed during render but is not defined on instance.`](#vue-warn-property-name-was-accessed-during-render-but-is-not-defined-on-instance)
- [A link's placeholder is prefixed with a domain](#a-links-placeholder-is-prefixed-with-a-domain)
- [`.maizzle/` shows up in `git status`](#maizzle-shows-up-in-git-status)
- [`No templates found`, or old templates, when Maizzle is built from a worker thread](#no-templates-found-or-old-templates-when-maizzle-is-built-from-a-worker-thread)
- [A bug in `@nxgt/mail-i18n` itself](#a-bug-in-nxgtmail-i18n-itself)

---

## Install and types

Resolve as a bundler does (`"moduleResolution": "bundler"`, as Maizzle's jiti
loader does): that is the supported contract. `nodenext` and `node16` are out
of contract — they may work today, and are not tested.

---

## Wiring

### `i18n: options must be an object, as { locales: ['en', 'fr'] }`

**When:** loading `maizzle.config.ts`, when `i18n` is called with nothing,
`null`, or a string such as `i18n('en')`.
**Why:** `i18n` takes one object of options; `locales` is the one it
requires.
**Fix:**

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';

export default defineMailConfig({
  plugins: [i18n({ locales: ['en', 'fr'] })],   // not i18n('en')
});
```

### `i18n: locales must hold at least one locale, as ['en', 'fr']`

**When:** loading `maizzle.config.ts`, when `locales` is missing, empty, or a
single string — or the locales passed alone, `i18n(['en', 'fr'])`: a list is
an object, and it has no `locales`.
**Why:** the plugin builds each template once per locale; with none there is
nothing to build.
**Fix:**

```ts
i18n({ locales: ['en'] });   // not locales: 'en', not i18n(['en'])
```

### `i18n: locales holds something that is not a locale — write each as a BCP 47 tag, as en or pt-BR`

**When:** loading `maizzle.config.ts`, for a locale such as `'EN'`, `'pt_BR'`,
`'french'` or `''`.
**Why:** a locale names a catalogue (`locales/pt-BR.json`) and an output
folder, and is handed to `Intl` to format numbers and dates. It is a BCP 47
tag: a lowercase language of two or three letters, then `-` and subtags.
**Fix:**

```ts
i18n({ locales: ['en', 'pt-BR'] });   // not 'EN', not 'pt_BR'
```

### `i18n: locales holds the same locale twice`

**When:** loading `maizzle.config.ts`, when a locale is listed twice —
often after joining two lists.
**Why:** each locale is built once, into its own files; a duplicate would
write the same files twice.
**Fix:**

```ts
i18n({ locales: [...new Set([...ours, ...shared])] });
```

### `i18n: fallbackLocale must be one of locales`

**When:** loading `maizzle.config.ts`, when `fallbackLocale` is set to a
locale `locales` does not list.
**Why:** every other catalogue is checked against the fallback locale's; it
must have a catalogue itself.
**Fix:**

```ts
i18n({ locales: ['en', 'fr'], fallbackLocale: 'en' });
```

Leave `fallbackLocale` out to use the first locale of `locales`.

### `i18n: dir must be a folder of the project`

The option named is `dir` or `emails`.

**When:** loading `maizzle.config.ts`, when `dir` (the catalogues' folder) or
`emails` (the templates' folder) is not a string, or is empty.
**Why:** both are paths from the project's root, where `maizzle` runs.
**Fix:**

```ts
i18n({ locales: ['en', 'fr'], dir: 'i18n', emails: 'templates' });
```

Leave them out for the defaults, `locales` and `emails`.

### `i18n: layout must be 'nested' or 'flat'`

**When:** loading `maizzle.config.ts`, for any other `layout`.
**Why:** `nested` writes `dist/en/verify-email.html`; `flat` writes
`dist/verify-email.en.html`. There is no third way.
**Fix:**

```ts
i18n({ locales: ['en', 'fr'], layout: 'flat' });
```

### `i18n: catalogues must be a list of catalogues by locale, as [{ en: {...}, fr: {...} }]`

**When:** loading `maizzle.config.ts`, when `catalogues` is one set of
catalogues rather than a list of them — `catalogues: uiCatalogues` — or the
list holds something else than an object of catalogues keyed by locale:
`null`, or a locale whose catalogue is a string (`[{ en: 'Hello' }]`).
**Why:** `catalogues` is a list, so that several packages can each ship
their messages. Each entry is keyed by locale, like the project's
`locales/<locale>.json`; each is merged key by key under the next, and the
project's own catalogues over all of them.
**Fix:** wrap it in a list, even when there is one:

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui, uiCatalogues } from '@nxgt/mail-ui';

export default defineMailConfig({
  plugins: [
    ui({ brand: { name: 'Acme' } }),
    i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] }),   // not catalogues: uiCatalogues
  ],
});
```

### `createTranslator: catalogues must be an object of catalogues by locale, as { en, fr }`

**When:** calling `createTranslator`, with `null`, `undefined` or no argument
— typically a JSON import that answered nothing.
**Why:** the first argument is the catalogues, keyed by locale.
**Fix:**

```ts
import { createTranslator } from '@nxgt/mail-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';

const t = createTranslator({ en, fr }, 'en');
```

### `createTranslator: getLanguage must be a locale or a function that answers one`

**When:** calling `createTranslator`, with a second argument that is neither a
string nor a function — often the result of calling the function instead of
passing it, when that result is `undefined`.
**Why:** the language is read at each call of `t`, from a locale or from a
function; it is not fixed from a value that may be missing.
**Fix:**

```ts
import { pickLocale } from '@nxgt/mail';
import { createTranslator } from '@nxgt/mail-i18n';

const t = createTranslator({ en, fr }, () =>
  pickLocale(user.locale, ['en', 'fr'], 'en'),
);
```

---

## Catalogues

These fail when `maizzle.config.ts` loads: `maizzle build` and `maizzle serve`
stop before any template is built. The locale in the message is the
catalogue's; fix that file.

### `i18n: locales/fr.json is missing — every locale has a catalogue`

**When:** loading `maizzle.config.ts`, when a locale of `locales` has no
`<dir>/<locale>.json`.
**Why:** every locale is built from its own catalogue; a missing one would
leave every key untranslated.
**Fix:** add the file, with every key of the fallback locale's catalogue —
or remove the locale from `locales`. A catalogue is named by its locale
exactly: `locales/pt-BR.json` for `pt-BR`.

### `i18n: locales/fr.json is not valid JSON`

**When:** loading `maizzle.config.ts`, for an empty file, a trailing comma, a
comment, or single quotes.
**Why:** a catalogue is read with `JSON.parse`; JSON5 and JSONC are not
accepted.
**Fix:** find the mistake with a JSON parser, which points at it:

```sh
bun -e "JSON.parse(await Bun.file('locales/fr.json').text())"
```

### `i18n: fr: the catalogue must be an object of messages`

**When:** loading `maizzle.config.ts`, when a catalogue's JSON is an array, a
string, or `null`.
**Why:** a catalogue is an object: its keys are the first segments of the
message keys.
**Fix:**

```json
{ "verifyEmail": { "title": "Confirmez votre adresse" } }
```

### `i18n: en: verifyEmail.title must be a message (a string) or an object of messages`

**When:** loading `maizzle.config.ts`, for a value that is a number, a
boolean, `null` or an array.
**Why:** a leaf is an ICU message, always a string; a number goes in the
message as an argument, not as its value.
**Fix:**

```json
{ "verifyEmail": { "expires": "The link expires in {minutes, plural, one {# minute} other {# minutes}}." } }
```

### `i18n: en: verify-email is not camelCase — every segment of a key is camelCase, and nested rather than dotted, as verifyEmail.title`

**When:** loading `maizzle.config.ts`, for a key in kebab-case or snake_case,
starting with a capital, or written with a dot (`"verifyEmail.title"` as one
key).
**Why:** a key is camelCase segments, one object per segment, as in
`@nxgt/i18n`. The subject of `emails/verify-email.vue` is looked up as
`verifyEmail.subject`, so the template's kebab-case name is not a key.
**Fix:**

```json
{ "verifyEmail": { "title": "Confirm your e-mail address" } }
```

not `{ "verify-email": { … } }`, and not `{ "verifyEmail.title": "…" }`.

### `i18n: en: verifyEmail.greeting is not a valid ICU message (EXPECT_ARGUMENT_CLOSING_BRACE)`

The reason in brackets is the ICU parser's own code.

**When:** loading `maizzle.config.ts`, for a message the ICU parser refuses:
an unclosed `{`, a `plural` without an `other` case, a literal `{` that is not
quoted.
**Why:** every message is parsed at build time, so none fails later. Only
the parser's code is kept: the error names the key, not the message's text.
**Fix:** close the argument, give each `plural` and `select` an `other` case,
and quote a literal brace with apostrophes:

```json
{
  "verifyEmail": {
    "greeting": "Hello {name},",
    "code": "Your code is '{'{code}'}'."
  }
}
```

### `i18n: en: verifyEmail.greeting uses {first_name}, which is not camelCase — an argument is a camelCase name, as {firstName}`

**When:** loading `maizzle.config.ts`, for an argument in snake_case,
kebab-case, or starting with a capital.
**Why:** an argument is also the name of a placeholder, and every name is
camelCase.
**Fix:**

```json
{ "verifyEmail": { "greeting": "Hello {firstName}," } }
```

### `i18n: en: verifyEmail.expires uses {minutes} as number and as date`

**When:** loading `maizzle.config.ts`, for a message that uses one argument
as two kinds — `{minutes, number}` and `{minutes, date}`, or a `plural` and a
`date`.
**Why:** each argument has one kind, read from the message, and a template's
value is checked against it; one value cannot be both.
**Fix:** use two arguments:

```json
{ "verifyEmail": { "expires": "Expires in {minutes, number} minutes, at {at, time, short}." } }
```

### `i18n: fr: verifyEmail.title is missing — en, the fallback locale, has it`

**When:** loading `maizzle.config.ts`, when a key of the fallback locale's
catalogue is not in another locale's.
**Why:** every locale is built from its own catalogue, with no fallback at
build time: a missing translation fails the build rather than writing the
fallback's text, or the key, into a French e-mail.
**Fix:** add the key to `locales/fr.json`. Keys are sorted in the check, so
the first missing key is reported; there may be others.

### `i18n: fr: verifyEmail.titel is not a key of en, the fallback locale`

**When:** loading `maizzle.config.ts`, when a locale's catalogue has a key the
fallback locale's does not — usually a typo, or a key renamed in one file
only.
**Why:** the fallback locale's catalogue is the reference; a key only a
translation has cannot be used by a template.
**Fix:** rename the key to match, or add it to the fallback locale's
catalogue first.

### `i18n: fr: verifyEmail.title uses {name}, which en does not declare`

**When:** loading `maizzle.config.ts`, when a translation uses an argument the
fallback locale's message does not.
**Why:** the fallback locale's message declares the arguments a template
passes; one only the translation uses would never be given a value. A
translation may leave an argument out.
**Fix:** add the argument to the fallback locale's message, or remove it from
the translation.

### `i18n: fr: verifyEmail.expires uses {minutes} as date, and en declares it as number`

**When:** loading `maizzle.config.ts`, when a translation uses an argument as
another kind than the fallback locale's message does.
**Why:** a template passes one value for every locale; it cannot be a number
in one and a date in the other.
**Fix:** use the same kind in both:

```json
{ "verifyEmail": { "expires": "Le lien expire dans {minutes, plural, one {# minute} other {# minutes}}." } }
```

---

## Templates

These fail while `maizzle build` renders a template. Maizzle builds the
locales in no set order, so the locale in the message is either one — `en`
in one run, `fr` in the next — and it names the first build that failed, not
the only locale concerned.

### `[Vue warn]: Unhandled error during execution of render function`

**When:** `maizzle build` stops with this warning, a stack trace, and the
Node.js version as the last line.
**Why:** a template's `t()` or `placeholder()` threw while Vue rendered it.
Vue prints its own warning, then the file and line of the `throw` in this
package, then the error — the useful line is in the middle.
**Fix:** look for the line starting `Error: i18n:`:

```
[Vue warn]: Unhandled error during execution of render function
  at <VerifyEmail >
…
Error: i18n: en: verify-email calls t('verifyEmail.titel'), which is not a key of the catalogues
    at Proxy.<anonymous> (…)
```

and find that message on this page.

### `i18n: emails/Welcome.vue is not a kebab-case name — name a template as verify-email.vue`

**When:** loading `maizzle.config.ts`, so `maizzle build` stops before any
template is built. For a template or a folder in PascalCase, camelCase,
snake_case, or with a dot in its name. Under `maizzle serve`, a file so named
added while the server runs is printed with `console.error`, and the server
keeps running without it; the next `maizzle build` fails on it.
**Why:** the name becomes the output file (`dist/en/welcome.html`), the key
of its messages (`welcome.subject`) and its name in the manifest; a
kebab-case name gives all three.
**Fix:** rename it, and its folders, in kebab-case:

```
emails/welcome.vue
emails/auth/reset-password.vue   → messages under auth.resetPassword
```

### `i18n: emails/verify-email.vue is not built through the i18n plugin — leave content to it, and put templates in emails/`

**When:** `maizzle build`, on the first template, when the project sets
`content` itself.
**Why:** the plugin builds each template through one generated wrapper per
locale, under `.maizzle/i18n/`, and lists those in `content`. A `content`
set in the project **replaces** the plugin's — arrays are not joined — so
Maizzle builds the templates directly, with no locale.
**Fix:** leave `content` out, and put every template in the `emails` folder
(or the folder the `emails` option names):

```ts
export default defineMailConfig({
  plugins: [i18n({ locales: ['en', 'fr'], emails: 'templates' })],
  // no content: the plugin sets it
});
```

### `i18n: en: verify-email calls t('verifyEmail.titel'), which is not a key of the catalogues`

**When:** `maizzle build`, rendering a template that calls `t()` with a key
no catalogue has — a typo, a key renamed in the catalogues, or a key that is
an object of messages (`t('verifyEmail')`).
**Why:** every locale has the same keys, so a key missing in one is missing
in all; the build fails rather than writing the key into the e-mail.
**Fix:** use a key of the catalogues, down to its message:

```vue
<Heading>{{ t('verifyEmail.title') }}</Heading>
```

### `i18n: en: verify-email calls t('verifyEmail.expires') without {minutes}`

**When:** `maizzle build`, when a template calls `t()` without an argument
the fallback locale's message uses.
**Why:** a message is formatted at build time; an argument it uses must have
a value then. A value only known at send time is a placeholder.
**Fix:**

```vue
<Text>{{ t('verifyEmail.expires', { minutes: 15 }) }}</Text>
<Text>{{ t('verifyEmail.greeting', { name: placeholder('name') }) }}</Text>
```

### `i18n: en: verify-email passes {minutes} to verifyEmail.expires as a string — the message uses it as a number`

The kinds are `string`, `number` and `date`, as the message uses the argument
and as the template passes it.

**When:** `maizzle build`, when a template passes a value of another kind
than the message uses: most often a `placeholder()` — always a string — to a
`plural`, a `number` or a `date`.
**Why:** a plural is chosen, and a number or a date is formatted, at build
time. A placeholder is only filled at send time, when there is no more ICU
to apply. A number is accepted for a string, and for a date (as a
timestamp).
**Fix:** pass the value itself when the build knows it; when only send time
knows it, write the message with a plain argument:

```vue
<Text>{{ t('verifyEmail.expires', { minutes: 15 }) }}</Text>
```

```json
{ "verifyEmail": { "expiresAt": "The link expires at {time}." } }
```

```vue
<Text>{{ t('verifyEmail.expiresAt', { time: placeholder('time') }) }}</Text>
```

### `i18n: en: verify-email passes {name} to verifyEmail.title, which does not use it`

**When:** `maizzle build`, when a template passes an argument the fallback
locale's message does not use.
**Why:** an argument no message uses is a value lost without a word — often
the sign that the message or the argument was renamed.
**Fix:** remove the argument, or add it to the message in every locale:

```vue
<Heading>{{ t('verifyEmail.title') }}</Heading>
```

### `i18n: en: verify-email calls t('verifyEmail.title') with arguments that are not an object, as { name: placeholder('name') }`

**When:** `maizzle build`, when a template passes its arguments as something
other than an object — a placeholder or a value on its own, or `null`.
**Why:** a message's arguments are named; `t` takes them as `{ name: value }`.
**Fix:**

```vue
<Text>{{ t('verifyEmail.greeting', { name: placeholder('name') }) }}</Text>
```

not `t('verifyEmail.greeting', placeholder('name'))`.

### `i18n: en: verify-email passes a placeholder to {plan}, which verifyEmail.title chooses on with a select — a placeholder always chooses other`

**When:** `maizzle build`, when a template passes `placeholder()` to an
argument the message chooses on with a `select`:
`t('verifyEmail.title', { plan: placeholder('plan') })` for
`"{plan, select, pro {Pro} other {Free}}"`.
**Why:** a `select` chooses at build time, and a placeholder is the string
`{{ plan }}` then: it always matches `other`, and the `pro` branch would never
be sent.
**Fix:** choose at build time with a value the build knows, or make one
e-mail (or one message) per case, and choose which to send in your
application:

```vue
<Heading>{{ t('verifyEmail.title', { plan: 'pro' }) }}</Heading>
```

### `i18n: en: verify-email calls placeholder() with a name that is not camelCase — as placeholder('firstName')`

**When:** `maizzle build`, for `placeholder()` called with no name, a name
with a space, in snake_case or kebab-case, or starting with a capital.
**Why:** the name is the variable the renderer fills at send time, and
`{{ first name }}` could not be read back from the built file.
**Fix:**

```vue
<Text>{{ t('verifyEmail.greeting', { name: placeholder('firstName') }) }}</Text>
```

### `i18n: en: verifyEmail.sentOn could not be formatted`

**When:** `maizzle build`, when a message is given a value that passes the
checks and still cannot be formatted — typically an invalid `Date`
(`new Date('')`) for a `date` or `time` argument.
**Why:** the formatter refused the value; its own error is the `cause` of
this one, printed under it. The `cause` may quote the message's text, which
this error's own message never does.
**Fix:** pass a valid date or timestamp:

```vue
<Text>{{ t('verifyEmail.sentOn', { at: new Date(Date.UTC(2026, 0, 2)) }) }}</Text>
```

---

## Manifest and subject

These fail after every template is built, while `dist/mail-manifest.json` is
written.

### `i18n: welcome has no subject — add welcome.subject to the catalogues`

**When:** `maizzle build`, after the templates, for a template whose key has
no `subject` — a new template, or one renamed.
**Why:** the subject is a message like any other, looked up from the
template's name: `emails/welcome.vue` reads `welcome.subject`,
`emails/auth/reset-password.vue` reads `auth.resetPassword.subject`. An
e-mail is not sent without one.
**Fix:** add it to every catalogue:

```json
{ "welcome": { "subject": "Welcome, {name}" } }
```

### `i18n: en: verifyEmail.subject uses {minutes} as a number — a subject's arguments are placeholders, filled at send time as strings`

The kind is `number` or `date`.

**When:** `maizzle build`, after the templates, for a subject with a
`plural`, a `number` or a `date` argument.
**Why:** a subject is not rendered by a template, so its arguments get no
value at build time: each one becomes a placeholder, filled at send time
with a string. No ICU can be applied to it then.
**Fix:** use plain arguments in a subject:

```json
{ "verifyEmail": { "subject": "Confirm your e-mail address, {name}" } }
```

### `i18n: en: welcome.subject chooses on {kind} with a select — a subject's arguments are placeholders, which always choose other`

**When:** `maizzle build`, after the templates, for a subject with a
`select`.
**Why:** each argument of a subject becomes a placeholder, `{{ kind }}`, and a
`select` given that string always chooses `other`: the other branches would
never be sent.
**Fix:** write one subject, with plain arguments. When the subjects really
differ, make one e-mail per case:

```json
{ "welcome": { "subject": "Welcome, {name}" } }
```

### `i18n: welcome was not built in fr`

**When:** `maizzle build`, after the templates, when Maizzle wrote no HTML for
an e-mail in one of `locales`.
**Why:** the manifest lists every e-mail in every locale, and the sending
side relies on that. The build's files for that e-mail and locale hold no
file with the HTML extension (`output.extension`, `html` by default): the
file was not written, or a template changed its own output settings.
**Fix:** leave `content` and the output settings to the plugin and the
project config, and set none in a template.

### `i18n: ../text/welcome.en.txt was written outside the output folder — the i18n plugin lays out every e-mail; set no plaintext.destination and no output path in a template`

The path is relative to the output folder.

**When:** `maizzle build`, after the templates, when a built file is outside
`output.path`.
**Why:** the plugin decides where each e-mail's files go, per locale, and the
manifest points at them inside the output folder. A `plaintext.destination`,
or an output path set in a template, writes elsewhere.
**Fix:** remove `plaintext.destination` from the config and any output path
from the templates. To build somewhere else, set the project's `output.path`:

```ts
export default defineMailConfig({
  plugins: [i18n({ locales: ['en', 'fr'] })],
  output: { path: 'build/mails' },
});
```

### `i18n: custom/welcome.html is not where the i18n plugin puts an e-mail — set no output path in a template`

**When:** `maizzle build`, after the templates, when a file inside the output
folder is not at `<locale>/<email>.html` (or `<email>.<locale>.html` with
`layout: 'flat'`).
**Why:** the manifest reads the locale and the e-mail back from each file's
path. A template that sets its own output path breaks that.
**Fix:** remove the output path from the template, and use `layout` to choose
between the two layouts.

---

## Run time

### `t: the language is not a locale of the catalogues — pick one with pickLocale`

**When:** calling `t`, when the language — the second argument of
`createTranslator`, or the third of `t` — is not a key of the catalogues:
a recipient's `'de'`, a region such as `'fr-CA'`, or `undefined`. The
language is left out of the message.
**Why:** `t` does not choose a locale; given one it has no catalogue for, it
throws rather than answering the key.
**Fix:** choose the locale with `pickLocale`, which answers one of those you
support:

```ts
import { pickLocale } from '@nxgt/mail';
import { createTranslator } from '@nxgt/mail-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';

const t = createTranslator({ en, fr }, () =>
  pickLocale(user.locale, ['en', 'fr'], 'en'),
);
```

### `t: fr: verifyEmail.titel is not a key`

**When:** calling `t` with a key the language's catalogue does not have — a
typo, or a key that is an object of messages (`t('verifyEmail')`).
**Why:** where `@nxgt/i18n` answers the key, this `t` throws: an e-mail is
not sent with a key in it.
**Fix:** use a key of the catalogues, down to its message:

```ts
t('verifyEmail.subject', { name: 'Ada' });
```

### `t: en: verifyEmail.expires could not be formatted`

**When:** calling `t`, when the message cannot be formatted with the
arguments given — most often an argument left out, or an invalid `Date` for a
`date`.
**Why:** the formatter refused; its own error, which names the argument and
may quote the message's text, is the `cause` of this one. `createTranslator` does not check arguments as the
build does.
**Fix:** pass every argument the message uses:

```ts
t('verifyEmail.expires', { minutes: 15 });
```

---

## Traps: a build that succeeds and is wrong

### `[Vue warn]: Property "name" was accessed during render but is not defined on instance.`

**When:** `maizzle build` succeeds, prints this warning once per locale, and
the built e-mail has nothing where `{{ name }}` was written in the template.
**Why:** a template is Vue: `{{ name }}` in its markup is an expression,
evaluated at build time, and `name` has no value then. Nothing is left for
the renderer to fill. When `name` does exist — a prop, a global property — it
is written in, silently.
**Fix:** write the placeholder with `placeholder()`, which puts `{{ name }}`
in the built file:

```vue
<Text>{{ placeholder('name') }}</Text>
<Text>{{ t('verifyEmail.greeting', { name: placeholder('name') }) }}</Text>
<Button :href="placeholder('link')">{{ t('verifyEmail.action') }}</Button>
```

### A link's placeholder is prefixed with a domain

**When:** `maizzle build` succeeds, and a link written as
`:href="placeholder('link')"` comes out as
`href="https://example.com/{{ link }}"`.
**Why:** Maizzle's `url.base` prefixes every relative URL, and a placeholder
looks like one. At send time the link is then the domain followed by the
whole URL filled in.
**Fix:** leave `url.base` off, and write the absolute URL of an image or a
static link in the template:

```ts
export default defineMailConfig({
  plugins: [i18n({ locales: ['en', 'fr'] })],
  // no url.base
});
```

### `.maizzle/` shows up in `git status`

**When:** after the first `maizzle build` or `maizzle serve`, `git status`
lists `.maizzle/i18n/en/verify-email.vue` and one file per template and
locale.
**Why:** those are the wrappers the plugin generates, one per template and
locale, so that one build writes every locale. They are rewritten on every
build, and removed when their template is.
**Fix:** ignore the folder:

```gitignore
# .gitignore
.maizzle/
```

Never edit a wrapper: the change is lost on the next build.

### `No templates found`, or old templates, when Maizzle is built from a worker thread

**When:** Maizzle's `build()` is called from code that runs in a worker
thread, such as a job runner or a Vitest `threads` pool. The build prints
`No templates found`, or builds templates that were since renamed or
removed, without the ones added.
**Why:** the plugin writes the wrappers under `.maizzle/i18n/` only on the
main thread, so that the workers of a parallel build never write the same
file twice. From a worker thread it writes none, and the build finds whatever
wrappers are already there, or none at all.
**Fix:** run the build on the main thread. Spawn the command:

```ts
const child = Bun.spawn(['bunx', 'maizzle', 'build'], { cwd: 'mails', stdout: 'inherit', stderr: 'inherit' });
if ((await child.exited) !== 0) throw new Error('maizzle build failed');
```

or, under Vitest, run those tests in processes rather than threads:

```ts
// vitest.config.ts
export default { test: { pool: 'forks' } };
```

### A bug in `@nxgt/mail-i18n` itself

A refusal of a catalogue or a template this page says is valid, a locale
built with another locale's text, or a manifest that does not list what the
build wrote, is a bug in this package. Open an issue on
[`softistx/nxgt-mail`](https://github.com/softistx/nxgt-mail/issues) with the
message, the package version, the Maizzle version, and the smallest
catalogue and template that reproduce it — never a real address or link.
