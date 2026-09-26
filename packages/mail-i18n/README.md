# @nxgt/mail-i18n

i18n for a normal [Maizzle](https://maizzle.com) 6 project of transactional
e-mails: write **one template per e-mail**, its text as keys into
[ICU](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
catalogues, and one `maizzle build` writes it in every locale. The build also
writes a manifest of each e-mail's placeholders and subjects. A catalogue or a
template that cannot be right **fails the build**, and the error names the
locale and the key.

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';

export default defineMailConfig({
	plugins: [i18n({ locales: ['en', 'fr'], fallbackLocale: 'en' })],
});
```

Your project stays a Maizzle project: `emails/`, `components/`, `public/`,
`maizzle serve`, `maizzle build`. The plugin adds `locales/`, and gives each
template `t`, `locale` and `placeholder`.

> **Not published yet.** The package is `private` while the rest of the
> repository — the shared components, the run-time renderer and the
> transports — is written. It is published at `0.1.0` with them; the surface
> below is the one that will ship.

## Install

```sh
bun add @nxgt/mail-i18n @nxgt/mail-config @maizzle/framework @maizzle/tailwindcss
```

Peers:

- `@maizzle/framework` (`^6.1.7`), required — Maizzle itself.
- `@nxgt/mail-config`, required — the i18n plugin is a plugin for its
  `defineMailConfig`. It needs `@maizzle/tailwindcss` (`^1.5.6`) **as a direct
  dependency of your project**; see [Setup](#setup).
- `typescript` (6), required. Bundler resolution
  (`"moduleResolution": "bundler"`) is what is supported and tested; `nodenext`
  is out of contract.
- `vue` (`^3.5`), **optional** — Maizzle already brings it. List it in your
  own `package.json` when you want `t`, `locale` and `placeholder` typed in
  templates ([Typing templates](#typing-templates)).

## Setup

```gitignore
# .gitignore — the official starter already has it
.maizzle/
```

The plugin writes one generated file per template and locale under
`.maizzle/i18n/`. They are rewritten on every run, never edited, and never
committed.

```css
/* in the <style> your layout imports Tailwind from */
@import "@maizzle/tailwindcss";
```

That import is resolved from your project. Under an isolated install (Bun
workspaces, pnpm), it fails **silently** unless `@maizzle/tailwindcss` is in
your own `package.json`, as the `bun add` above makes it: the build succeeds,
and no Tailwind utility is generated.

## Exports

| Export | What it is |
| --- | --- |
| `i18n(options)` | The plugin, for `defineMailConfig({ plugins })` |
| `createTranslator(catalogues, getLanguage)` | `t(key, args?, language?)` outside templates, shaped like `@nxgt/i18n`, but it throws on a missing key |
| `emailKey(email)` | Where an e-mail's messages live: `auth/reset-password` → `auth.resetPassword` |
| `MANIFEST_FILE` | `'mail-manifest.json'`, the manifest's name in the output folder |
| `WRAPPERS_DIR` | `'.maizzle/i18n'`, where the generated files go |
| `I18nOptions`, `Layout` | The plugin's options, and `'nested' \| 'flat'` |
| `Catalogue`, `Catalogues`, `ArgumentKind` | A catalogue as written, catalogues by locale, and `'string' \| 'number' \| 'date'` |
| `Translate`, `LanguageProvider`, `MessageArgs` | What `createTranslator` answers and takes |
| `Manifest`, `ManifestEmail` | The shape of `dist/mail-manifest.json` |

## Usage

### A project in two languages

A catalogue per locale, nested, `camelCase` keys:

```json
// locales/en.json — locales/fr.json has the same keys
{
	"verifyEmail": {
		"subject": "Confirm your e-mail address, {name}",
		"title": "Confirm your e-mail address",
		"greeting": "Hello {name},",
		"expires": "The link expires in {minutes, plural, one {# minute} other {# minutes}}.",
		"action": "Confirm my address"
	}
}
```

One template, every language:

```vue
<!-- emails/verify-email.vue -->
<template>
  <Html :lang="locale">
    <Body>
      <Container>
        <Heading>{{ t('verifyEmail.title') }}</Heading>
        <Text>{{ t('verifyEmail.greeting', { name: placeholder('name') }) }}</Text>
        <Text>{{ t('verifyEmail.expires', { minutes: 15 }) }}</Text>
        <Button :href="placeholder('link')">{{ t('verifyEmail.action') }}</Button>
      </Container>
    </Body>
  </Html>
</template>
```

- `t(key, args?)` formats the message in the locale being built.
- `locale` is that locale, `'en'` or `'fr'`.
- `placeholder('name')` writes `{{ name }}` in the built file, for a value that
  is only known at send time. Write it in text, in an attribute, or pass it as
  an argument.

`maizzle serve` lists the template once per locale. `maizzle build` writes:

```text
dist/
  en/verify-email.html     <p>Hello {{ name }},</p> … <a href="{{ link }}">
  en/verify-email.txt
  fr/verify-email.html     <p>Bonjour {{ name }},</p> … Le lien expire dans 15 minutes.
  fr/verify-email.txt
  mail-manifest.json
```

The `.txt` files come from `@nxgt/mail-config`'s base config. The e-mail is
named after its template's path, without `.vue`: `emails/auth/reset-password.vue`
is `auth/reset-password`, written to `dist/<locale>/auth/reset-password.html`.
See [Templates](docs/guide/templates.md).

### Options

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `locales` | `readonly string[]` | — (required) | Every locale to build, as BCP 47 tags: `['en', 'fr', 'pt-BR']` |
| `fallbackLocale` | `string` | the first of `locales` | The reference catalogue: every other locale must have its keys, and may not add an argument |
| `dir` | `string` | `'locales'` | The folder of `<locale>.json` catalogues, relative to where `maizzle` runs |
| `emails` | `string` | `'emails'` | The folder of templates |
| `layout` | `'nested' \| 'flat'` | `'nested'` | `nested` writes `dist/en/verify-email.html`; `flat` writes `dist/verify-email.en.html` |

```ts
// maizzle.config.ts — every file of one e-mail side by side
export default defineMailConfig({
	plugins: [i18n({ locales: ['en', 'fr'], layout: 'flat' })],
});
```

A wrong option is a bare `TypeError` when the config loads:
`i18n: fallbackLocale must be one of locales`.

### The subject

Every e-mail needs a subject, in every locale: the message
`<emailKey>.subject`. `emailKey` turns the template's path into a key:

```ts
import { emailKey } from '@nxgt/mail-i18n';

emailKey('verify-email'); // 'verifyEmail'         → verifyEmail.subject
emailKey('auth/reset-password'); // 'auth.resetPassword' → auth.resetPassword.subject
```

The template does not write the subject. The build formats it once per locale
into the manifest, and turns each argument into a placeholder:
`"Confirm your e-mail address, {name}"` becomes
`"Confirm your e-mail address, {{ name }}"`. A template with no subject fails
the build: `i18n: welcome has no subject — add welcome.subject to the
catalogues`. See [Catalogues](docs/guide/catalogues.md#the-subject).

### The manifest

`dist/mail-manifest.json` is written by `maizzle build`, for the code that
sends. For each e-mail, it records its placeholders, the ones a link or an
image URL starts with, its subject in each locale, and its files:

```json
{
	"locales": ["en", "fr"],
	"fallbackLocale": "en",
	"emails": {
		"verify-email": {
			"variables": ["link", "name"],
			"urlVariables": ["link"],
			"subject": {
				"en": "Confirm your e-mail address, {{ name }}",
				"fr": "Confirmez votre adresse e-mail, {{ name }}"
			},
			"files": {
				"en": { "html": "en/verify-email.html", "text": "en/verify-email.txt" },
				"fr": { "html": "fr/verify-email.html", "text": "fr/verify-email.txt" }
			}
		}
	}
}
```

See [The manifest](docs/guide/manifest.md).

### Outside templates — `createTranslator`

The same catalogues, from your application's code:

```ts
import { pickLocale } from '@nxgt/mail';
import { createTranslator } from '@nxgt/mail-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';

declare const user: { locale: string | null };

const t = createTranslator({ en, fr }, () => pickLocale(user.locale, ['en', 'fr'], 'en'));

t('verifyEmail.expires', { minutes: 15 }); // in the user's locale
t('verifyEmail.expires', { minutes: 15 }, 'fr'); // 'Le lien expire dans 15 minutes.'
```

`createTranslator(catalogues, getLanguage)` and `t(key, args, language?)`
have the shape of `@nxgt/i18n`, with one difference: this `t` **throws**
where `@nxgt/i18n` would answer the key. It throws on a key the catalogue
does not have, on a language with no catalogue, and on a message that does
not format. An e-mail never goes out with `verifyEmail.title` or `{link}` in
it. See [Translating outside templates](docs/guide/translator.md).

### Typing templates

```ts
// env.d.ts, or any file your tsconfig includes
import type {} from '@nxgt/mail-i18n';
```

The package declares `t`, `locale` and `placeholder` on Vue's
`ComponentCustomProperties`. Vue's language tools (Volar in the editor,
`vue-tsc`) then check them in every template. That declaration loads once
something in your TypeScript program imports the package. A
`maizzle.config.ts` in your tsconfig already does. Whether a key exists is
not a type: the build checks it.

## Traps

**Leave `content` to the plugin.** It points Maizzle at the generated files. A
`content` in your config replaces that, and each template then fails with
`… is not built through the i18n plugin`.

**Run `maizzle` from the project root.** `dir`, `emails` and `.maizzle/i18n`
are resolved against the directory `maizzle` runs in.

**Nest keys; never dot them.** `{ "verifyEmail": { "title": "…" } }`, not
`{ "verifyEmail.title": "…" }`, which fails the build as not camelCase.

**Never write `{{ name }}` by hand in a template.** Vue would evaluate it.
Write `{{ placeholder('name') }}`.

**Never branch on a placeholder.** The template is built before the value
exists: `v-if="link.startsWith('https:')"` would test the string `{{ link }}`.

**Keep `url.base` off for links.** It would prefix `{{ link }}` in every
`href`.

**A subject's arguments are plain `{name}`.** They become placeholders, filled
as strings at send time. `{count, number}` or a `select` in a subject fails
the build.

**Leave the output paths to the plugin.** An `output.path` set in a
template, or a `plaintext.destination`, moves a file out of the plugin's
layout, and the build fails when the manifest is written.

## Type safety, counted

**12 plausible mistakes, 12 refused** at compile time. Each one is measured by
a `@ts-expect-error` in
[`test/types/refusals.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/test/types/refusals.ts),
which fails the typecheck the moment it stops holding:

1. The plugin called without `locales`.
2. `locales` given one locale as a string rather than a list.
3. A `layout` other than `'nested'` or `'flat'`.
4. A catalogue with a leaf that is not a message (`expires: 15`).
5. `createTranslator` given a language that is neither a locale nor a
   function that answers one.
6. An argument that is an object: only a string, a number or a `Date`.
7. `placeholder` given something other than a name.
8. A template that assigns `locale`.
9. A `fallbackLocale` that is not a string.
10. A folder option (`dir`, `emails`) that is not a string.
11. `t` called in a template with a key that is not a string.
12. `createTranslator`'s `t` given a language, for one call, that is neither
    a locale nor a function that answers one.

The same file holds the calls that must keep compiling: a refusal that refuses
the correct call is a bug.

A message key is a `string`. Whether it exists, and whether its arguments are
the right ones, is checked by the build, against the catalogues.

## Documentation

- [The guides](docs/README.md) — one page per area, with every option and error.
- [Troubleshooting](docs/troubleshooting.md) — an error message, its cause and
  its fix.
- [Roadmap](docs/roadmap.md) — what is next, and what is deliberately not
  planned.
- [Vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md)
  — the words these pages use, defined once.

## Licence

MIT
