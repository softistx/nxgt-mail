# Templates

This page is for writing a template once for every locale: what `t`, `locale`
and `placeholder` do, what fails the build, and what `maizzle serve` and
`maizzle build` do with it.

```vue
<!-- emails/verify-email.vue -->
<template>
  <Html :lang="locale">
    <Body>
      <Container>
        <Heading>{{ t('verifyEmail.title') }}</Heading>
        <Text>{{ t('verifyEmail.greeting', { name: placeholder('name') }) }}</Text>
        <Text>{{ t('verifyEmail.expires', { minutes: 15 }) }}</Text>
        <Text>{{ t('verifyEmail.sentOn', { at: new Date(Date.UTC(2026, 0, 2, 12)) }) }}</Text>
        <Button :href="placeholder('link')">{{ t('verifyEmail.action') }}</Button>
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
		t(key: string, args?: MessageArgs): string;
		readonly locale: string;
		placeholder(name: string): string;
	}
}

type MessageArgs = Readonly<Record<string, string | number | Date>>;
```

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
<Text>{{ t('verifyEmail.expires', { minutes: 15 }) }}</Text>
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
<Button :href="placeholder('link')">{{ t('verifyEmail.action') }}</Button>
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
<Text>{{ t('verifyEmail.greeting', { name: placeholder('name') }) }}</Text>
<!-- <p>Bonjour {{ name }},</p> -->
```

A placeholder is a string. It cannot fill a `number` or `date` argument,
because the plural rule or the date format would have to be applied to a
value that does not exist yet. Format those at build time, or write the value
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

The name also gives the key of its subject, `verifyEmail.subject`, through
[`emailKey`](catalogues.md#the-subject).

## What fails the build

A template that cannot be right stops the build. The message names the
locale, the e-mail and the key. Maizzle builds the locales in no set order, so
either locale may be the one reported. Each is a plain `Error`: a mistake in
the template or the catalogues, to fix, not a condition to catch.

| Build failure | Cause |
| --- | --- |
| `i18n: fr: verify-email calls t('verifyEmail.titel'), which is not a key of the catalogues` | A key that does not exist |
| `i18n: en: verify-email calls t('verifyEmail.expires') without {minutes}` | An argument the message declares, not passed |
| `i18n: fr: verify-email passes {minutes} to verifyEmail.expires as a string — the message uses it as a number` | An argument of the wrong kind; here, a placeholder where a plural needs a number |
| `i18n: en: verify-email passes {name} to verifyEmail.title, which does not use it` | An argument the message does not use |
| `i18n: en: verify-email calls t('verifyEmail.title') with arguments that are not an object, as { name: placeholder('name') }` | `t('verifyEmail.greeting', placeholder('name'))`: the arguments go in an object |
| `i18n: fr: verify-email calls placeholder() with a name that is not camelCase — as placeholder('firstName')` | `placeholder('first name')`, `placeholder('first_name')` |
| `i18n: fr: verifyEmail.sentOn could not be formatted` | The formatter refused the value, such as a date that is `NaN`; its error is the `cause` |
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
**wrapper**, under `.maizzle/i18n/`. The wrapper imports the template and
nothing else, and the plugin points Maizzle's `content` at these files. One
`maizzle build` then renders every template once per locale, and `t` knows
which locale each render is for.

```vue
<!-- .maizzle/i18n/fr/verify-email.vue, generated -->
<!-- Generated by @nxgt/mail-i18n: one per template and locale. Never edited, never committed. -->
<script setup>
import Email from '../../../emails/verify-email.vue';
</script>
<template><Email /></template>
```

Wrappers are written when the config loads, only when their text changed, and
only on the main thread: above 50 templates Maizzle builds in parallel, each
worker loads the config again, and the workers do not write. A parallel build
writes the same files and the same manifest, which the package's specs check. A wrapper whose template is gone is removed.
`.maizzle/` belongs in `.gitignore`.

The output follows the wrappers, under Maizzle's `output.path` (`dist` by
default):

| `layout` | Wrapper | Built files |
| --- | --- | --- |
| `'nested'` (default) | `.maizzle/i18n/fr/auth/reset-password.vue` | `dist/fr/auth/reset-password.html`, `.txt` |
| `'flat'` | `.maizzle/i18n/auth/reset-password.fr.vue` | `dist/auth/reset-password.fr.html`, `.txt` |

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
.maizzle/i18n/en/auth/reset-password.vue
.maizzle/i18n/en/verify-email.vue
.maizzle/i18n/fr/auth/reset-password.vue
.maizzle/i18n/fr/verify-email.vue
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

```ts
// env.d.ts, or any file your tsconfig includes
import type {} from '@nxgt/mail-i18n';
```

With that (or a `maizzle.config.ts` in your tsconfig, which imports the
package), Vue's language tools (Volar in the editor, `vue-tsc`) know `t`,
`locale` and `placeholder` in every template:

```vue
<Text>{{ placeholder(1) }}</Text>   <!-- refused: a name is a string -->
<Text>{{ t('any.key', { user: { first: 'Ada' } }) }}</Text>  <!-- refused: an argument is a string, a number or a Date -->
```

A key is a `string`, so an unknown key compiles, and the build refuses it. The
declaration lives in `@nxgt/mail-i18n`'s types, and needs `vue` resolvable
from your project: Maizzle depends on it, and listing it in your own
`package.json` makes that hold under an isolated install.

## See also

- [Catalogues](catalogues.md) — the messages `t` reads, and the kinds of
  argument.
- [The manifest](manifest.md) — what the build records about placeholders.
