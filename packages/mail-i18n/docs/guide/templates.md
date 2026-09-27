# Templates

This page is for writing a template once for every locale: what `t`, `locale`
and `placeholder` do, how templates a package ships are built with yours,
what fails the build, and what `maizzle serve` and `maizzle build` do with it.

```vue
<!-- emails/verify-email.vue -->
<template>
  <Html :lang="locale">
    <Body>
      <Container>
        <Heading>{{ t('verify-email.title') }}</Heading>
        <Text>{{ t('verify-email.greeting', { name: placeholder('name') }) }}</Text>
        <Text>{{ t('verify-email.expires', { minutes: 15 }) }}</Text>
        <Text>{{ t('verify-email.sent-on', { at: new Date(Date.UTC(2026, 0, 2, 12)) }) }}</Text>
        <Button :href="placeholder('link')">{{ t('verify-email.action') }}</Button>
      </Container>
    </Body>
  </Html>
</template>
```

With the catalogues of [Catalogues](catalogues.md), `maizzle build` writes, in
`dist/fr/verify-email.html`:

```html
<html lang="fr" …>
  <h1>Confirmez votre adresse e-mail</h1>
  <p>Bonjour {{ name }},</p>
  <p>Le lien expire dans 15 minutes.</p>
  <p>Envoyé le 2 janvier 2026.</p>
  <a href="{{ link }}">… Confirmer mon adresse …</a>
```

and the same in English in `dist/en/verify-email.html`, each with its `.txt`.
Plurals and dates are formatted by each locale's rules.

## What a template gets

The plugin sets three global properties before each render. They need no
import:

```ts
// what the package declares for Vue's template checker
declare module 'vue' {
	interface ComponentCustomProperties {
		t<K extends TemplateKey>(key: K, ...args: TemplateArgs<K>): string;
		readonly locale: string;
		placeholder(name: string): string;
	}
}
```

`TemplateKey` is a key of your catalogues, and `TemplateArgs<K>` its
arguments, once the plugin has written their types — see
[Editor and type checking](editor.md). Before that, the template checker does
not know `t` at all; the build is not affected.

A component used by the template sees them too: they are global, and they
hold the locale being built.

### `t(key, args?)`

Formats the message `key` in the locale being built. It checks each call
against the fallback locale's message, which declares every argument:

- the key must exist;
- every argument the message declares must be passed, even one this
  locale's translation leaves out;
- no argument may be passed that the message does not use;
- each argument must be of its kind: a number for `{n, number}` or a plural,
  a `Date` or a timestamp for a date, a string or a number for the rest. See
  [Arguments](catalogues.md#arguments).

```vue
<Text>{{ t('verify-email.expires', { minutes: 15 }) }}</Text>
<!-- 'The link expires in 15 minutes.' / 'Le lien expire dans 15 minutes.' -->
```

The formatted message is text: Vue escapes it where it is written, as it
escapes any `{{ }}`.

### `locale`

The locale this build of the template is in: `'en'`, `'fr'`, `'pt-BR'`.
Read it; never assign it.

```vue
<Html :lang="locale">
```

```vue
<img :src="`/images/banner-${locale}.png`" alt="">
```

### `placeholder(name)`

Answers `{{ name }}`, a mark kept as it is through inlining, minification and
plain text, for the sending side to fill with a value only known then: a
name, a link, a code. `name` is `camelCase`.

**In text:**

```vue
<Text>{{ placeholder('code') }}</Text>
<!-- <p>{{ code }}</p> -->
```

**In an attribute** — bind it, with `:`:

```vue
<Button :href="placeholder('link')">{{ t('verify-email.action') }}</Button>
<!-- <a href="{{ link }}"> -->
```

A placeholder that starts the value of an `href`, a `src`, a `background`, a
`poster` or an `action` is recorded as a URL variable in the
[manifest](manifest.md). The sending side must fill it with a URL. One later
in the value, as `?token={{ token }}`, is an ordinary variable.

**In the text part only**: a placeholder inside Maizzle's `<Plaintext>`
block is in the `.txt` file alone, and is still one of the e-mail's
variables.

<a id="a-placeholder-as-an-argument"></a>
**As an argument** of a message, where the message uses it as a string:

```vue
<Text>{{ t('verify-email.greeting', { name: placeholder('name') }) }}</Text>
<!-- <p>Bonjour {{ name }},</p> -->
```

A placeholder is a string. It cannot fill a `number` or `date` argument,
because the plural rule or the date format would have to be applied to a
value that does not exist yet — nor an argument a `select` chooses on, which
would always choose `other`. Format those at build time, or write the value
outside the message.

**Never write `{{ name }}` yourself.** Vue would evaluate `name` as an
expression, at build time, and the mark would never reach the built file. **Never branch on a placeholder** either:
`v-if="placeholder('link').startsWith('https:')"` is decided on the string
`{{ link }}`, once, at build time.

Keep Maizzle's `url.base` off for links: it would turn `href="{{ link }}"` into
`href="https://cdn.example.com/{{ link }}"`.

## Template names

A template's path under `emails/` names the e-mail: `emails/verify-email.vue`
is `verify-email`, and `emails/auth/reset-password.vue` is
`auth/reset-password`. Every segment is kebab-case: lower-case letters and
digits, joined by single dashes.

The name also gives the key of its subject, `verify-email.subject`, through
[`emailKey`](catalogues.md#the-subject).

## Templates from a package

A package can ship templates as well as messages — `@nxgt/mail-presets`
ships nine ready e-mails. The `templates` option builds a package's folder
with yours, once per locale, into the same output and the same manifest:

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { presets } from '@nxgt/mail-presets';
import { ui, uiCatalogues } from '@nxgt/mail-ui';

const mails = presets({ only: ['verify-email', 'welcome'] });

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

```ts
interface I18nOptions {
	// …
	readonly templates?: readonly TemplateSource[]; // default []
}

interface TemplateSource {
	/** The folder, absolute. */
	readonly dir: string;
	/** The e-mails of the folder to build, as ['verify-email']. Default every one. */
	readonly emails?: readonly [string, ...string[]]; // at least one
}
```

A package answers its `TemplateSource` from a function, as `presets()` does,
so you rarely write one. By hand, `dir` is absolute — a package finds its own
with `fileURLToPath(new URL('../emails', import.meta.url))` — and `emails`
names templates of that folder as the plugin names them, `auth/reset-password`
for `auth/reset-password.vue`:

```ts
import type { TemplateSource } from '@nxgt/mail-i18n';
import { TEMPLATES_DIR } from '@nxgt/mail-presets';

const two: TemplateSource = { dir: TEMPLATES_DIR, emails: ['sign-in-code', 'magic-link'] };
```

### Which template is built

Your `emails/` is read first, then each source as listed:

- **Your template replaces a package's.** With `emails/welcome.vue` in your
  project, `welcome` is built from yours; the package's `welcome.vue` is
  never read.
- **Two sources with the same e-mail are refused.** Neither would be the
  obvious one, so the build stops rather than pick: keep one with `emails`,
  or write your own in `emails/`.
- **`emails` keeps only those.** A source's other templates are not built,
  and are not in the manifest. Leave it out for every one; an empty list does
  not compile, and is refused at run time. Your own `emails/` is always built
  whole.
- **A source must hold templates.** A `dir` that is missing or has no `.vue`
  file is refused — usually a path to the package rather than to its
  e-mails folder.

```ts
import { i18n } from '@nxgt/mail-i18n';

// the e-mails folders of two packages that both ship welcome.vue
declare const accountEmails: string;
declare const otherEmails: string;

// keep the first one's welcome
i18n({
	locales: ['en', 'fr'],
	templates: [
		{ dir: accountEmails, emails: ['welcome', 'verify-email'] },
		{ dir: otherEmails, emails: ['invitation'] },
	],
});
```

The wrapper of a package's template imports it from where it is:

```vue
<!-- .maizzle/emails/fr/verify-email.vue, generated; the path follows your install -->
<script setup>
import Email from '../../../node_modules/@nxgt/mail-presets/emails/verify-email.vue';
</script>
<template><Email /></template>
```

A package's template is built like yours: it calls `t` on the catalogues you
give the plugin, so its package's messages go in `catalogues` — see
[Catalogues from a package](catalogues.md#catalogues-from-a-package) — and
its placeholders are recorded in the manifest. Its names are checked for
kebab-case like yours, reported as `templates[0]/…`. `maizzle serve` watches
your `emails/` for added and removed templates, not a package's folder.

The tags of a template under `node_modules` are not resolved by Maizzle,
which skips that folder. The plugin that ships the components resolves them —
`@nxgt/mail-ui`'s `ui()` does, for its `Nx*` components and Maizzle's
built-ins, so list it in `plugins`. A tag left unresolved renders nothing,
and the build fails on the empty e-mail (see
[What fails the build](#what-fails-the-build)); with `ui()` listed, one
nested anywhere fails it too, naming the tag and the file:
`ui: <NxButon> in emails/welcome.vue is no component — …`.

### Its errors

| Error | When |
| --- | --- |
| `TypeError: i18n: templates must be a list of template folders, as [{ dir: '/abs/path/emails' }] — emails, when given, names at least one, each once` | When the config loads: `templates` not a list (`templates: mails.templates`), a `dir` that is not absolute, or `emails` that is not a list of names, is empty, or names one twice |
| `Error: i18n: templates[0] has no template sign-in.vue — name one of its e-mails` | When the config loads: a name in `emails` the folder does not have. `templates[0]` is the source's place in the list |
| `Error: i18n: templates[0] holds no template — is /…/emails the folder of a package's e-mails?` | When the config loads: a `dir` that does not exist, or holds no `.vue` file |
| `Error: i18n: templates[0] and templates[1] both have welcome.vue — keep one with emails: [...], or write the project's own in its folder` | When the config loads: two sources ship an e-mail of the same name, and your `emails/` does not have it |

```ts
i18n({ locales: ['en'], templates: [{ dir: 'node_modules/@nxgt/mail-presets/emails' }] });
// TypeError: i18n: templates must be a list of template folders, as [{ dir: '/abs/path/emails' }] — emails, when given, names at least one, each once
```

## What fails the build

A template that cannot be right stops the build. The message names the
locale, the e-mail and the key. Maizzle builds the locales in no set order, so
either locale may be the one reported. Each is a plain `Error`: a mistake in
the template or the catalogues, to fix, not a condition to catch.

| Build failure | Cause |
| --- | --- |
| `i18n: fr: verify-email calls t('verify-email.titel'), which is not a key of the catalogues` | A key that does not exist |
| `i18n: en: verify-email calls t('verify-email.expires') without {minutes}` | An argument the message declares, not passed |
| `i18n: fr: verify-email passes {minutes} to verify-email.expires as a string — the message uses it as a number` | An argument of the wrong kind; here, a placeholder where a plural needs a number |
| `i18n: en: verify-email passes {name} to verify-email.title, which does not use it` | An argument the message does not use |
| `i18n: en: verify-email passes a placeholder to {plan}, which verify-email.title chooses on with a select — a placeholder always chooses other` | `placeholder()` passed to an argument the message chooses on with a `select`: it would always choose `other`. Pass a value the build knows |
| `i18n: en: verify-email calls t('verify-email.title') with arguments that are not an object, as { name: placeholder('name') }` | `t('verify-email.greeting', placeholder('name'))`: the arguments go in an object |
| `i18n: fr: verify-email calls placeholder() with a name that is not camelCase — as placeholder('firstName')` | `placeholder('first name')`, `placeholder('first_name')` |
| `i18n: fr: verify-email.sent-on could not be formatted` | The formatter refused the value, such as a date that is `NaN`; its error is the `cause` |
| `i18n: templates[0] has no template sign-in.vue — name one of its e-mails` | A [package's source](#templates-from-a-package) lists, in `emails`, a template its folder does not have; checked when the config loads |
| `i18n: templates[0] holds no template — is /…/emails the folder of a package's e-mails?` | A package's source whose `dir` is missing or has no template; checked when the config loads |
| `i18n: templates[0] and templates[1] both have welcome.vue — keep one with emails: [...], or write the project's own in its folder` | Two package sources ship the same e-mail; checked when the config loads |
| `i18n: fr/welcome.html is empty — a tag of its template resolved to no component; list the plugin that brings it, as ui()` | The e-mail rendered nothing but the doctype: a tag of its template, usually the layout, matched no component, and Vue renders an unknown component as nothing. Typically `ui()` is missing from `plugins`, or a package's template uses a component no plugin brings. Reported when the manifest is written; with `ui()` listed, the build fails earlier on `ui: <Tag> in <file> is no component` |
| `i18n: emails/Welcome.vue is not a kebab-case name — name a template as verify-email.vue` | A template whose path is not kebab-case, checked when the config loads. Under `maizzle serve`, one added while the server runs is printed with `console.error`, and the server keeps running |
| `i18n: welcome has no subject — add welcome.subject to the catalogues` | The e-mail has no subject message; reported when the manifest is written, at the end of the build. The other manifest failures, including an output path set in a template, are in [The manifest](manifest.md#where-it-is-written) |
| `i18n: emails/verify-email.vue is not built through the i18n plugin — leave content to it, and put templates in emails/` | Maizzle rendered a template directly: the project set its own `content` |

The last one comes from replacing the plugin's `content`:

```ts
// maizzle.config.ts — wrong: content replaces the plugin's, which points at the generated files
export default defineMailConfig({
	plugins: [i18n({ locales: ['en', 'fr'] })],
	content: ['emails/**/*.vue'],
});

// right: templates live in `emails` (or the folder named by the `emails` option)
export default defineMailConfig({
	plugins: [i18n({ locales: ['en', 'fr'] })],
});
```

## What the build writes

For each template and locale, the plugin generates a small file, a
**wrapper**, under `.maizzle/emails/`. The wrapper imports the template and
nothing else, and the plugin points Maizzle's `content` at these files. One
`maizzle build` then renders every template once per locale, and `t` knows
which locale each render is for.

```vue
<!-- .maizzle/emails/fr/verify-email.vue, generated -->
<!-- Generated by @nxgt/mail-i18n: one per template and locale. Never edited, never committed. -->
<script setup>
import Email from '../../../emails/verify-email.vue';
</script>
<template><Email /></template>
```

Wrappers are written when the config loads, only when their text changed, and
only on the main thread: above 50 wrappers (templates × locales; Maizzle's
`parallel.threshold`) Maizzle builds in parallel, each worker loads the
config again, and the workers do not write. A parallel build
writes the same files and the same manifest, which the package's specs check. A wrapper whose template is gone is removed.
`.maizzle/` belongs in `.gitignore`.

The output follows the wrappers, under Maizzle's `output.path` (`dist` by
default):

| `layout` | Wrapper | Built files |
| --- | --- | --- |
| `'nested'` (default) | `.maizzle/emails/fr/auth/reset-password.vue` | `dist/fr/auth/reset-password.html`, `.txt` |
| `'flat'` | `.maizzle/emails/auth/reset-password.fr.vue` | `dist/auth/reset-password.fr.html`, `.txt` |

```ts
// maizzle.config.ts — the fixture's flat build, in its own folder
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';

export default defineMailConfig({
	plugins: [i18n({ locales: ['en', 'fr'], layout: 'flat' })],
	output: { path: 'dist-flat' },
});
```

Then the plugin writes `mail-manifest.json` next to them. See
[The manifest](manifest.md).

## `maizzle serve`

The dev UI lists each template once per locale, by its wrapper:

```text
.maizzle/emails/en/auth/reset-password.vue
.maizzle/emails/en/verify-email.vue
.maizzle/emails/fr/auth/reset-password.vue
.maizzle/emails/fr/verify-email.vue
```

Placeholders show as they are, `Bonjour {{ name }},`: the preview is the file
that will be built.

While it runs:

- **Editing a template** refreshes every locale of it: each wrapper imports
  it.
- **Adding or removing a template** under `emails/` writes or removes its
  wrappers, and the list follows. A template added with a name that is not
  kebab-case is reported with `console.error`, and the server keeps
  running; `maizzle build` fails on it.
- **Saving a catalogue** reloads the config, which checks the catalogues
  again. Maizzle watches `locales/`; when `dir` names another folder, the
  plugin adds it to `server.watch`.

A failure in `t` shows in the preview of that template and locale, with the
same message, instead of the e-mail. `maizzle serve` does not write the
manifest, so a missing subject is only reported by `maizzle build`.

## Typing templates

`i18n()` writes `.maizzle/nxgt-mail-i18n.d.ts` each time the config loads, so
Vue's language tools complete a key of `t` and flag an unknown key or a wrong
argument in the editor and in `vue-tsc`:

```vue
<Text>{{ t('verify-email.titel') }}</Text>
<!-- Argument of type '"verify-email.titel"' is not assignable to parameter of type 'keyof TemplateMessages'. -->
```

The setup, what the file holds, and each kind of argument are in
[Editor and type checking](editor.md).

## See also

- [Catalogues](catalogues.md) — the messages `t` reads, and the kinds of
  argument.
- [Editor and type checking](editor.md) — `t`'s keys and arguments, typed
  from the catalogues.
- [The manifest](manifest.md) — what the build records about placeholders.
