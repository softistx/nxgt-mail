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

> **0.x.** A minor version may still change the surface; the changelog says how.

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
  templates ([Editor and type checking](#editor-and-type-checking)).

## Setup

```gitignore
# .gitignore — the official starter already has it
.maizzle/
```

The plugin writes one generated file per template and locale under
`.maizzle/emails/`. They are rewritten on every run, never edited, and never
committed.

```css
/* in the <style> your layout imports Tailwind from */
@import "@maizzle/tailwindcss";
```

That import is resolved from your project. Under an isolated install (Bun
workspaces, pnpm), it fails **silently** unless `@maizzle/tailwindcss` is in
your own `package.json`, as the `bun add` above makes it: the build succeeds,
and no Tailwind utility is generated.

```jsonc
// tsconfig.json — the official starter's include; keep .maizzle/*.d.ts in it
{ "include": ["**/*.vue", ".maizzle/*.d.ts"] }
```

```jsonc
// package.json — the starter's postinstall
{ "scripts": { "postinstall": "maizzle prepare" } }
```

Each time the config loads (`maizzle prepare`, `serve`, `build`), the plugin
writes `.maizzle/nxgt-mail-i18n.d.ts`: the types of `t`, from your catalogues.
The starter's `tsconfig.json` does not include `maizzle.config.ts`, so this
file is how the editor learns them. See
[Editor and type checking](#editor-and-type-checking).

## Exports

| Export | What it is |
| --- | --- |
| `i18n(options)` | The plugin, for `defineMailConfig({ plugins })` |
| `createTranslator(catalogues, getLanguage)` | `t(key, args?, language?)` outside templates, shaped like `@nxgt/i18n`, but it throws on a missing key |
| `emailKey(email)` | Where an e-mail's messages live: `auth/reset-password` → `auth.resetPassword` |
| `MANIFEST_FILE` | `'mail-manifest.json'`, the manifest's name in the output folder |
| `WRAPPERS_DIR` | `'.maizzle/emails'`, where the generated files go |
| `I18nOptions`, `Layout`, `TemplateSource` | The plugin's options, `'nested' \| 'flat'`, and a package's folder of templates for `templates` |
| `Catalogue`, `Catalogues`, `ArgumentKind` | A catalogue as written, catalogues by locale, and `'string' \| 'number' \| 'date'` |
| `Translate`, `LanguageProvider`, `MessageArgs` | What `createTranslator` answers and takes |
| `Manifest`, `ManifestEmail` | The shape of `dist/mail-manifest.json` |
| `TemplateMessages`, `TemplateKey`, `TemplateArgs` | The keys of `t` in templates and their arguments, filled from your catalogues by the generated `.maizzle/nxgt-mail-i18n.d.ts` |

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
| `catalogues` | `readonly Catalogues[]` | `[]` | Catalogues a package ships, merged in order **under** your `<locale>.json`, key by key |
| `templates` | `readonly TemplateSource[]` | `[]` | Folders of templates a package ships, built with yours; your template of the same name wins |
| `rendererTypes` | `string \| false` | `'generated/mail.ts'` | The `.ts` module, relative to where `maizzle` runs, that each build writes `MailEmails` to, for `createMailRenderer<MailEmails>`. `false` writes none |

```ts
// maizzle.config.ts — every file of one e-mail side by side
export default defineMailConfig({
	plugins: [i18n({ locales: ['en', 'fr'], layout: 'flat' })],
});
```

A wrong option is a bare `TypeError` when the config loads:
`i18n: fallbackLocale must be one of locales`.

### Catalogues from a package

A package can ship messages your templates share, such as `@nxgt/mail-ui`'s
`common.greeting`. List them in `catalogues`. Your own
`locales/<locale>.json` is still required for every locale, and wins key by
key:

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { uiCatalogues } from '@nxgt/mail-ui';

export default defineMailConfig({
	plugins: [i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] })],
});
```

```json
// locales/en.json — common.footer.why and common.footer.ignore stay the package's
{ "common": { "greeting": "Hi {name}," } }
```

The merged catalogues are checked like your own. A source's locale your
project does not build is left out. See
[Catalogues](docs/guide/catalogues.md#catalogues-from-a-package).

### Templates from a package

A package can ship whole e-mails, such as `@nxgt/mail-presets`. List its
folders in `templates`, and its messages in `catalogues`:

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { presets } from '@nxgt/mail-presets';
import { ui, uiCatalogues } from '@nxgt/mail-ui';

const mails = presets({ only: ['verify-email', 'reset-password'] });
// mails.templates → { dir: '/…/node_modules/@nxgt/mail-presets/emails', emails: ['verify-email', 'reset-password'] }

export default defineMailConfig({
	plugins: [
		ui({ brand: { name: 'Acme' } }),
		i18n({
			locales: ['en', 'fr'],
			catalogues: [uiCatalogues, mails.catalogues],
			templates: [mails.templates],
		}),
	],
});
```

A `TemplateSource` is `{ dir, emails? }`: `dir` an absolute folder that holds
templates, `emails` a non-empty list of the ones to build (every one when left
out). Your `emails/` is read first: `emails/verify-email.vue` replaces the
package's `verify-email`. Two packages that ship the same e-mail are refused
when the config loads. See
[Templates](docs/guide/templates.md#templates-from-a-package).

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

`createMailRenderer` from `@nxgt/mail/renderer` reads it at send time:
`createMailRenderer({ dir: 'dist' }).render('verify-email', { name, link })`
answers the subject, HTML and text, every value escaped.

After the manifest, each build writes `generated/mail.ts`, in the project — the manifest's e-mails
and variables as a type, rewritten only when they change. **Git-ignore it**
and build before type-checking — `"typecheck": "maizzle build && tsc
--noEmit"` — as you do for `dist/`: it is output of the build, like the
e-mails it describes.

```ts
// generated/mail.ts — never edited
export interface MailEmails {
	"verify-email": { readonly link: string; readonly name: string | number };
}
```

```ts
// in the code that sends
import { createMailRenderer } from '@nxgt/mail/renderer';
import type { MailEmails } from './generated/mail';

const mails = createMailRenderer<MailEmails>({ dir: 'dist' });
mails.render('verify-email', { name: 'Ada', link: 'https://app.example.com/v' });
// mails.render('verify-emial', …) and a missing `link` no longer compile
```

A URL variable is `string`, any other `string | number`. Set
`rendererTypes` to write it elsewhere, or `false` for none. See
[The manifest](docs/guide/manifest.md) and its
[renderer's types](docs/guide/manifest.md#the-renderers-types--generatedmailts).

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

`pickLocale` comes from `@nxgt/mail` (`bun add @nxgt/mail`); `getLanguage`
can be any function that returns one of the catalogues' locales.

`createTranslator(catalogues, getLanguage)` and `t(key, args, language?)`
have the shape of `@nxgt/i18n`, with one difference: this `t` **throws**
where `@nxgt/i18n` would answer the key. It throws on a key the catalogue
does not have, on a language with no catalogue, and on a message that does
not format. An e-mail never goes out with `verifyEmail.title` or `{link}` in
it. See [Translating outside templates](docs/guide/translator.md).

### Editor and type checking

With the [Setup](#setup) above, Vue's language tools (the **Vue - Official**
extension in the editor, `vue-tsc` in CI) complete the keys of `t` and flag a
call the build would refuse:

```vue
<!-- emails/verify-email.vue, with the catalogue above -->
<template>
  <p>{{ t('verifyEmail.titel') }}</p>
  <!-- Argument of type '"verifyEmail.titel"' is not assignable to parameter of type 'keyof TemplateMessages'. -->
  <p>{{ t('verifyEmail.greeting') }}</p>
  <!-- Expected 2 arguments, but got 1. -->
  <p>{{ t('verifyEmail.expires', { minutes: placeholder('minutes') }) }}</p>
  <!-- Type 'string' is not assignable to type 'number'. -->
</template>
```

```sh
bun add -d vue-tsc vue
bunx vue-tsc --noEmit   # after maizzle prepare, as in CI
```

The types come from the fallback locale's catalogue, merged with the
`catalogues` option, and refresh on the next config load: saving a catalogue
under `maizzle serve`, or running `maizzle prepare` or `maizzle build`.
Without the generated file, the template checker does not know `t`,
`locale` or `placeholder` at all (`Property 't' does not exist`); the build is
not affected. See [Editor and type checking](docs/guide/editor.md).

## Traps

**Leave `content` to the plugin.** It points Maizzle at the generated files. A
`content` in your config replaces that, and each template then fails with
`… is not built through the i18n plugin`.

**Run `maizzle` from the project root.** `dir`, `emails` and `.maizzle/emails`
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

**List the plugin that brings a template's components.** A tag that
resolves to no component renders nothing, and the build fails with
`i18n: fr/welcome.html is empty — a tag of its template resolved to no
component; list the plugin that brings it, as ui()`.

**Leave the output paths to the plugin.** An `output.path` set in a
template, or a `plaintext.destination`, moves a file out of the plugin's
layout, and the build fails when the manifest is written.

## Type safety, counted

**18 plausible mistakes, 18 refused** at compile time. Each one is measured by
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
13. `catalogues` given one catalogue by locale rather than a list of them.
14. `catalogues` holding a locale whose value is a message, not a catalogue.
15. `templates` given one folder rather than a list of them.
16. A template folder's `emails` given as one name rather than a list.
17. A template folder's `emails` given as an empty list.
18. `rendererTypes` given as `true` rather than a path.

The same file holds the calls that must keep compiling: a refusal that refuses
the correct call is a bug.

**7 template mistakes, 7 refused** by the types generated from the
catalogues, each measured by a `@vue-expect-error` in
[`test/fixture/types/refusals.vue`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/test/fixture/types/refusals.vue),
checked by `vue-tsc` after `maizzle prepare` (`bun run typecheck:templates`):

1. A key the catalogues do not have (`t('verifyEmail.titel')`).
2. A message's argument left out.
3. An argument the message does not use.
4. A plural's count given as a placeholder, which is text.
5. A key written in `snake_case` (`t('verify_email.title')`).
6. A key that may be a message without arguments or one with
   (`t(ok ? 'verifyEmail.title' : 'verifyEmail.expires')`).
7. The same, given the arguments of only one of them.

The same file holds the template calls that must keep compiling. The build
still checks every call against every locale's catalogue; the types report
the same mistakes earlier.

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
