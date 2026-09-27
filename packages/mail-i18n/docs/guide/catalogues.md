# Catalogues

This page is for writing the catalogues: one JSON file of ICU messages per
locale, checked against each other when the config loads.

```json
// locales/en.json
{
	"verify-email": {
		"subject": "Confirm your e-mail address, {name}",
		"title": "Confirm your e-mail address",
		"greeting": "Hello {name},",
		"expires": "The link expires in {minutes, plural, one {# minute} other {# minutes}}.",
		"sent-on": "Sent on {at, date, long}.",
		"action": "Confirm my address"
	},
	"auth": {
		"reset-password": {
			"subject": "Reset your password",
			"body": "Someone asked to reset the password of {email}."
		}
	}
}
```

```json
// locales/fr.json
{
	"verify-email": {
		"subject": "Confirmez votre adresse e-mail, {name}",
		"title": "Confirmez votre adresse e-mail",
		"greeting": "Bonjour {name},",
		"expires": "Le lien expire dans {minutes, plural, one {# minute} other {# minutes}}.",
		"sent-on": "Envoyé le {at, date, long}.",
		"action": "Confirmer mon adresse"
	},
	"auth": {
		"reset-password": {
			"subject": "Réinitialisez votre mot de passe",
			"body": "Quelqu'un a demandé à réinitialiser le mot de passe de {email}."
		}
	}
}
```

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';

export default defineMailConfig({
	plugins: [i18n({ locales: ['en', 'fr'], fallbackLocale: 'en' })],
});
```

A template writes `t('verify-email.expires', { minutes: 15 })`. The English
build shows `The link expires in 15 minutes.` and the French one
`Le lien expire dans 15 minutes.`.

## Where they are read

`i18n()` reads `<dir>/<locale>.json` for every locale in `locales`, where
`dir` defaults to `locales` and is resolved against the directory `maizzle`
runs in. It checks them at once, when `maizzle.config.ts` loads, before any
template is built. A failure stops the build there.

```ts
i18n({ locales: ['en', 'fr', 'pt-BR'], dir: 'i18n' }); // i18n/en.json, i18n/fr.json, i18n/pt-BR.json
```

Every locale needs its file, and the file must be valid JSON:

| Build failure | Cause |
| --- | --- |
| `i18n: locales/fr.json is missing — every locale has a catalogue` | `fr` is in `locales`, and there is no `locales/fr.json` |
| `i18n: locales/fr.json is not valid JSON` | The file is empty, or does not parse |

`maizzle serve` watches `locales/` already. For another `dir`, the plugin adds
that folder to Maizzle's `server.watch`. Either way, saving a catalogue reloads
the config, which checks the catalogues again.

## Catalogues from a package

A package can ship messages its components or your templates share —
`@nxgt/mail-ui`'s `uiCatalogues` holds `common.greeting` and
`common.footer.*` in `en` and `fr`. Give them to the plugin with
`catalogues`, and your `<locale>.json` goes over them, key by key:

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui, uiCatalogues } from '@nxgt/mail-ui';

export default defineMailConfig({
	plugins: [
		ui({ brand: { name: 'Acme' } }),
		i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] }),
	],
});
```

```ts
interface I18nOptions {
	// …
	readonly catalogues?: readonly Catalogues[]; // default []
}
```

A source is a `Catalogues`: catalogues by locale, `{ en: {...}, fr: {...} }`,
as `createTranslator` takes them. A package's own is typed with it:

```ts
import type { Catalogues } from '@nxgt/mail-i18n';

export const shared = {
	en: { common: { greeting: 'Hello {name},' } },
	fr: { common: { greeting: 'Bonjour {name},' } },
} as const satisfies Catalogues;
```

### How they merge

For each locale in `locales`, the plugin layers every source in the order
listed, then your `<dir>/<locale>.json` on top:

- **An object merges** key by key: a key only a lower layer has stays.
- **Anything else replaces**: a message over a message, a message over a
  group, a group over a message.
- **A later source wins over an earlier one**, and your catalogue over all.

With the sources and your file below, the `en` catalogue checked and used is
the last block:

```ts
const ui = { en: { common: { greeting: 'Hello {name},', footer: { why: 'Why' } } } };
const brand = { en: { common: { greeting: 'Hey {name},' } } };

i18n({ locales: ['en'], catalogues: [ui, brand] });
```

```json
// locales/en.json
{ "welcome": { "title": "Welcome" } }
```

```json
{
	"common": { "greeting": "Hey {name},", "footer": { "why": "Why" } },
	"welcome": { "title": "Welcome" }
}
```

A message replaces a group whole: `{ "common": "Hi" }` in your file would drop
every `common.*` key the sources bring.

### What stays the same

- **Your file is still required** for every locale, even when the sources
  cover everything you need: `{}` is a valid catalogue.
- **A source's locale you do not build is left out.** `uiCatalogues` has
  `fr`; with `locales: ['en']`, it is ignored.
- **A locale no source has** gets nothing from them. With
  `locales: ['en', 'de']` and `uiCatalogues`, `locales/de.json` writes the
  `common` keys itself, or the build fails on the first one missing.
- **The merged catalogues are checked**, as described on this page: the
  format, the fallback locale's keys and arguments, the subjects. An error
  names the locale and the key, not the source it came from.

| Failure | Cause |
| --- | --- |
| `TypeError: i18n: catalogues must be a list of catalogues by locale, as [{ en: {...}, fr: {...} }]` | `catalogues` is not an array (`catalogues: uiCatalogues`, without the brackets), or holds something other than an object of catalogues by locale (`[null]`, `[{ en: 'Hello' }]`) |
| `i18n: de: common.footer.ignore is missing — en, the fallback locale, has it` | A source brings the key in the fallback locale, and nothing brings it in `de` |

The first is a wiring mistake, thrown when the config loads; the second is a
build failure, as any other on this page.

## The format

A catalogue is an object. A leaf is an ICU message (a string), and anything
else is an object of messages. The key of a message is its path, dotted:
`verify-email.title`, `auth.reset-password.body`.

```ts
import type { Catalogue } from '@nxgt/mail-i18n';

const en: Catalogue = { 'verify-email': { subject: 'Confirm, {name}' } };
```

```ts
interface Catalogue {
	readonly [key: string]: string | Catalogue;
}
type Catalogues = Readonly<Record<string, Catalogue>>; // { en, fr }
```

**Every segment of a key is `camelCase` or `kebab-case`**: a lower-case
letter, then letters and digits, optionally cut into `kebab-case` words. Our
own convention for a new key is `kebab-case`; `camelCase` stays accepted so a
project migrates on its own schedule. Keys are **nested, never dotted**: a
dot inside a key is refused the same way as an underscore or a capital first
letter.

```json
{ "verify-email": { "title": "…" } }
```

| Build failure | Cause |
| --- | --- |
| `i18n: en: verify_email is not camelCase or kebab-case — every segment of a key is one or the other, and nested rather than dotted, as verify-email.title` | A key with an underscore, or a capital first letter |
| `i18n: en: verifyEmail.title is not camelCase or kebab-case — …` | A dotted key, `{ "verifyEmail.title": "…" }`: nest it |
| `i18n: en: the catalogue must be an object of messages` | The file holds an array, a string, `null` |
| `i18n: en: verify-email.expires must be a message (a string) or an object of messages` | A leaf that is a number, a boolean, `null`, an array |
| `i18n: en: verify-email.greeting is not a valid ICU message (EXPECT_ARGUMENT_CLOSING_BRACE)` | The message does not parse: here an unclosed `{name`. A `plural` or `select` with no `other` gives `(MISSING_OTHER_CLAUSE)`. The parser's reason is in brackets. The text of the message is not repeated |

HTML-like tags in a message are text: `"<b>{name}</b>"` is a message whose
argument `name` counts, and whose `<b>` is written as it is.

## Arguments

An argument is a named value a message writes. Its **kind** comes from the way
the message uses it:

| In the message | Kind | What `t` accepts for it |
| --- | --- | --- |
| `{name}` | `string` | a string or a number |
| `{gender, select, female {…} other {…}}` | `string` | a string or a number |
| `{total, number}`, `{total, number, ::currency/EUR}` | `number` | a number |
| `{count, plural, one {# item} other {# items}}` | `number` | a number |
| `{at, date, long}`, `{at, time, short}` | `date` | a `Date`, or a timestamp in milliseconds |

```ts
import type { ArgumentKind } from '@nxgt/mail-i18n'; // 'string' | 'number' | 'date'
```

A placeholder is a string, so it can only fill a `string` argument — and not
one a `select` chooses on, which would always choose `other`. See
[Templates](templates.md#placeholdername).

An argument's name is `camelCase`, like a key. A message may use one name
twice, as long as it keeps one kind: a plain `{n}` beside `{n, number}` takes
the kind `number`.

| Build failure | Cause |
| --- | --- |
| `i18n: en: welcome.body uses {first_name}, which is not camelCase — an argument is a camelCase name, as {firstName}` | An argument name that is not `camelCase` |
| `i18n: en: welcome.body uses {n} as number and as date` | One name used as two kinds in one message |

## The fallback locale is the reference

The fallback locale (`fallbackLocale`, the first of `locales` by default)
declares the keys and the arguments. Every other locale is checked against
it:

- **The same keys.** A key the fallback has must be in every locale; a key the
  fallback does not have is refused.
- **No new argument.** A translation may leave an argument out ("Bonjour"
  for "Hello {name}"), but never use one the fallback does not declare.
- **The same kind.** A translation that uses an argument uses it as the kind
  the fallback declares.

```json
// en.json
{ "welcome": { "body": "Hello {name}, you have {count, plural, one {# message} other {# messages}}." } }
```

```json
// fr.json — {name} left out: allowed
{ "welcome": { "body": "Vous avez {count, plural, one {# message} other {# messages}}." } }
```

| Build failure | Cause |
| --- | --- |
| `i18n: fr: verify-email.title is missing — en, the fallback locale, has it` | A key only the fallback has |
| `i18n: fr: welcome.extra is not a key of en, the fallback locale` | A key the fallback does not have: add it there first |
| `i18n: fr: welcome.body uses {name}, which en does not declare` | An argument a translation invents |
| `i18n: fr: welcome.body uses {n} as date, and en declares it as number` | An argument a translation uses as another kind |

The keys are compared in sorted order, so the first one reported is always the
same one.

## The subject

Every e-mail has a subject in every locale: the message `<emailKey>.subject`.
`emailKey` turns a template's path under `emails/` into the key its messages
live under: the same path, its `/` joined with a `.`, since a template's name
is already the kebab-case a catalogue key uses.

```ts
import { emailKey } from '@nxgt/mail-i18n';

emailKey('verify-email'); // 'verify-email'
emailKey('auth/reset-password'); // 'auth.reset-password'
emailKey('auth/reset-password-2'); // 'auth.reset-password-2'
```

```ts
function emailKey(email: string): string;
```

| Template | Its subject |
| --- | --- |
| `emails/verify-email.vue` | `verify-email.subject` |
| `emails/auth/reset-password.vue` | `auth.reset-password.subject` |

The template never writes the subject. After the build, the plugin formats
it in each locale into the [manifest](manifest.md), and **each argument
becomes a placeholder**:

```json
{ "verify-email": { "subject": "Confirm your e-mail address, {name}" } }
```

```json
{ "subject": { "en": "Confirm your e-mail address, {{ name }}" } }
```

`name` is then one of the e-mail's variables, filled at send time like any
other placeholder. A line break in a value filled into a subject is the
sending side's to remove. The vocabulary's *subject* row says how.

A subject's arguments are therefore plain `{name}`: they are strings, and
they are not known when the subject is formatted. A `select` would always
choose `other` on a placeholder, so it is refused too.

| Build failure | Cause |
| --- | --- |
| `i18n: welcome has no subject — add welcome.subject to the catalogues` | `emails/welcome.vue` exists, and `welcome.subject` does not |
| `i18n: en: welcome.subject uses {count} as a number — a subject's arguments are placeholders, filled at send time as strings` | A `number`, `plural` or `date` argument in a subject |
| `i18n: en: welcome.subject chooses on {kind} with a select — a subject's arguments are placeholders, which always choose other` | A `select` in a subject: the placeholder `{{ kind }}` would always pick `other`. Write one subject, or one e-mail per case |

These three fail at the end of `maizzle build`, when the manifest is written.
`maizzle serve` does not write a manifest, so it does not report them.

Keeping the rest of an e-mail's messages under the same key
(`verify-email.title`, `verify-email.action`) is a convention, not a rule. A
template can call any key, such as a shared `common.footer`.

## In CI

The build is the check. To fail a pull request on a catalogue that
cannot be right, build in CI:

```sh
maizzle build
```

A catalogue that fails prints its message (`i18n: fr: … is missing — en, the
fallback locale, has it`) and exits non-zero.

## See also

- [Templates](templates.md) — calling `t` with the right arguments, and what
  fails when a template does not.
- [The manifest](manifest.md) — where the subjects end up.
- [Translating outside templates](translator.md) — the same catalogues in your
  application's code.
