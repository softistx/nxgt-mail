# @nxgt/mail-ui

E-mail components for a normal [Maizzle](https://maizzle.com) 6 project, in
the style of `@nxgt/material-vue`: `<NxLayout>`, `<NxButton>`, `<NxCard>`,
`<NxAlert>`… with its variants, colours and tokens, rendered with tables and
inlined styles. One plugin gives every template the components, your brand
and the theme; a second export gives `@nxgt/mail-i18n` the messages they share.

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui, uiCatalogues } from '@nxgt/mail-ui';

export default defineMailConfig({
	plugins: [
		ui({ brand: { name: 'Acme', url: 'https://acme.example' } }),
		i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] }),
	],
});
```

Your project stays a Maizzle project: `emails/`, `components/`, `public/`,
`maizzle serve`, `maizzle build`. Maizzle's own components (`<Button>`,
`<Spacer>`) stay available; ours carry the `Nx` prefix and never shadow them.

> **Not published yet.** The package is `private` while the rest of the
> repository — the transports and a starter — is written. It is published at
> `0.1.0` with them; the surface below is the one that will ship.

## Install

```sh
bun add @nxgt/mail-ui @nxgt/mail-config @maizzle/framework @maizzle/tailwindcss vue
```

Peers, all required:

- `@maizzle/framework` (`^6.1.7`) — Maizzle itself.
- `@nxgt/mail-config` — `ui()` is a plugin for its `defineMailConfig`. It
  needs `@maizzle/tailwindcss` (`^1.5.6`) **as a direct dependency of your
  project**; see [Setup](#setup).
- `vue` (`^3.5`) — the components are Vue single-file components, and the
  package types `brand` on Vue's template properties.
- `typescript` (6). Bundler resolution (`"moduleResolution": "bundler"`) is
  what is supported and tested; `nodenext` is out of contract.

`@nxgt/mail-i18n` is not a peer: add it (`bun add @nxgt/mail-i18n`) to
translate your e-mails and to use `uiCatalogues`.

One dependency comes with the package: `unplugin-vue-components`, which
Maizzle already uses. Maizzle resolves no tag in a `.vue` file under
`node_modules`, so `ui()` resolves them itself for the files a package ships —
ours, and a package's templates such as `@nxgt/mail-presets`'. See
[Components from a package](docs/guide/plugin.md#components-from-a-package).

## Setup

```css
/* what <NxLayout> writes in its <style> — you do not write it */
@import "@maizzle/tailwindcss";
```

That import is resolved from your project. Under an isolated install (Bun
workspaces, pnpm) it fails **silently** unless `@maizzle/tailwindcss` is in
your own `package.json`, as the `bun add` above makes it: the build succeeds,
and no style is generated.

```jsonc
// tsconfig.json — the official starter's include; keep .maizzle/*.d.ts in it
{ "include": ["**/*.vue", ".maizzle/*.d.ts"] }
```

```jsonc
// package.json — the starter's postinstall
{ "scripts": { "postinstall": "maizzle prepare" } }
```

Each time the config loads (`maizzle prepare`, `serve`, `build`), `ui()`
writes `.maizzle/nxgt-mail-ui.d.ts`, which loads the type of `brand` for the
templates. The starter's `tsconfig.json` does not include
`maizzle.config.ts`, so this file is how the editor learns it. `.maizzle/` is
in the starter's `.gitignore`. See
[Editor and type checking](#editor-and-type-checking).

## Exports

| Export | What it is |
| --- | --- |
| `ui(options)` | The plugin, for `defineMailConfig({ plugins })`: the `Nx*` components, `brand` in every template, the theme |
| `uiCatalogues` | The shared messages in `en` and `fr`, for `i18n({ catalogues: [uiCatalogues] })` |
| `UI_CONTEXT` | `'nxgt:mail-ui'`, the Vue `provide` key a component reads the brand and the theme's CSS from |
| `COMPONENTS_DIR` | The absolute path of the package's `components/` folder |
| `THEME_FILE` | The absolute path of the package's `theme.css` |
| `Brand`, `UiOptions`, `UiContext` | The brand, the plugin's options, and what `UI_CONTEXT` provides |

| Subpath | What it is |
| --- | --- |
| `@nxgt/mail-ui` | The exports above |
| `@nxgt/mail-ui/theme.css` | The theme: `@theme` tokens for Tailwind 4 |

## Usage

### A template

```vue
<!-- emails/verify-email.vue -->
<template>
  <NxLayout :preheader="t('verifyEmail.title')">
    <NxTypography variant="headline-small">{{ t('verifyEmail.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('verifyEmail.action') }}</NxButton>
    <Spacer height="24px" />
    <NxAlert variant="warning" title="The link expires in 15 minutes." />
    <NxTypography variant="caption">{{ t('common.footer.ignore') }}</NxTypography>
  </NxLayout>
</template>
```

`<NxLayout>` is the page: the brand's logo or name at the top, the content on
a card, and a footer that says why the e-mail came (`common.footer.why`) and
links the brand. Every other component goes inside it. `t` and `placeholder`
come from `@nxgt/mail-i18n`; without it, write the text directly. See
[Components](docs/guide/components.md) for every component, its props and
its slots.

### The plugin — `ui({ brand, theme })`

```ts
import { ui } from '@nxgt/mail-ui';

ui({
	brand: {
		name: 'Acme',
		url: 'https://acme.example',
		logo: { src: 'https://acme.example/logo.png', width: 96, alt: 'Acme' },
	},
	theme: { 'color-primary': '#0f766e', 'radius-xl': '8px' },
});
```

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `brand.name` | `string` | — (required) | Shown in the header without a logo, and in the footer always |
| `brand.url` | `string` | none | An absolute `http(s)` URL the header and the footer link to |
| `brand.logo` | `{ src, width?, alt? }` | none | The header's image: `src` an absolute `http(s)` URL, `width` in pixels (120), `alt` (the brand's name) |
| `theme` | `Record<string, string>` | `{}` | Tokens of `theme.css` to override, named without their `--` |

A wrong option is a bare `TypeError` when the config loads:
`ui: brand.logo.src must be an absolute http(s) URL — a mail client loads
nothing relative`. Every template also gets `brand`: `{{ brand.name }}`. See
[The plugin](docs/guide/plugin.md).

### The theme

`theme.css` holds material-vue's light tokens. Maizzle turns each colour into
a hex value in the built HTML, and material-vue's translucent `bg-primary/15`
is `bg-primary-15` here, a plain colour, because a mail client drops an
alpha. Override a colour, and its tints follow:

```ts
ui({ brand: { name: 'Acme' }, theme: { 'color-primary': '#0f766e' } });
// <NxButton> is #0f766e; <NxButton variant="tonal"> is #dbeae9, 15% of it over white
```

See [The theme](docs/guide/theme.md) for every token.

### The shared messages — `uiCatalogues`

```ts
i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] });
```

`common.greeting` (`Hello {name},`), `common.footer.why` and
`common.footer.ignore`, in `en` and `fr`. Your `locales/<locale>.json`
overrides any of them, key by key:

```json
// locales/en.json
{ "common": { "greeting": "Hi {name}," } }
```

See [Shared messages](docs/guide/messages.md).

### Editor and type checking

With the [Setup](#setup) above, Vue's language tools (the **Vue - Official**
extension in the editor, `vue-tsc` in CI) know `brand` in every template, and
Maizzle's `.maizzle/prefixed-components.d.ts` gives them the `Nx*` components
and their props:

```vue
<!-- emails/welcome.vue -->
<template>
  <NxTypography>Welcome to {{ brand.nam }}</NxTypography>
  <!-- Property 'nam' does not exist on type 'Brand'. Did you mean 'name'? -->
</template>
```

```sh
bun add -d vue-tsc
bunx vue-tsc --noEmit   # after maizzle prepare, as in CI
```

`t`, `locale` and `placeholder` are typed by `@nxgt/mail-i18n`, which writes
its own file beside this one. See
[`brand` in templates](docs/guide/plugin.md#brand-in-templates).

### Replacing a component

```vue
<!-- components/NxBadge.vue — replaces the package's <NxBadge> in every template -->
<template>
  <span class="rounded-sm bg-primary px-2 text-xs text-primary-foreground"><slot /></span>
</template>
```

A file in your `components/` with the name of one of ours wins over it — in
your templates, in ours, and in a package's. See
[The plugin](docs/guide/plugin.md#replacing-a-component).

## Traps

**List `ui()` in `plugins`.** A component used without it fails the build:
`NxLayout: ui() is not in the plugins of defineMailConfig`.

**With `@nxgt/mail-i18n`, give it the shared messages.** `<NxLayout>` calls
`t('common.footer.why')` once the i18n plugin is listed, and the build fails
with `calls t('common.footer.why'), which is not a key of the catalogues`
unless `catalogues: [uiCatalogues]` is passed, or your catalogues hold the
key.

**Another locale writes the `common` keys itself.** `uiCatalogues` has `en`
and `fr` only: a project in `de` adds `common.greeting`, `common.footer.why`
and `common.footer.ignore` to `locales/de.json`.

**Icons are slots.** An e-mail has no icon font: pass an `<img>` with an
absolute URL, or a character, to `#icon`.

**Light only.** The layout declares `<meta name="color-scheme" content="light">`;
there is no dark theme.

**Use Maizzle's `<Spacer>` for vertical space**: `<Spacer height="24px" />`.

**Never branch on a placeholder** in a component or a template:
`v-if="link.startsWith('https:')"` is decided on the string `{{ link }}`.

## Type safety, counted

**8 plausible mistakes, 8 refused** at compile time, each measured by a
`@ts-expect-error` in
[`test/types/refusals.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/test/types/refusals.ts)
that fails the typecheck the moment it stops holding:

1. `ui()` without a `brand`.
2. A `brand` given as its name alone, rather than `{ name }`.
3. A `logo` given as its URL alone, rather than `{ src }`.
4. A logo `width` that is not a number of pixels (`'96px'`).
5. A `theme` value that is not a CSS string (`{ 'radius-lg': 4 }`).
6. A template that assigns `brand`.
7. A `logo` without its `src`.
8. A `brand.url` that is not a string.

The same file holds the calls that must keep compiling: a refusal that refuses
the correct call is a bug.

A theme token is a `string`: whether `theme.css` declares it is checked when
`ui()` is called. A component's props are not in this count: Maizzle declares
the components in `.maizzle/prefixed-components.d.ts`, and Vue's language
tools check them in the editor.

## Documentation

- [The guides](docs/README.md) — one page per area, with every option,
  component and error.
- [Troubleshooting](docs/troubleshooting.md) — an error message, its cause and
  its fix.
- [Roadmap](docs/roadmap.md) — what is next, and what is deliberately not
  planned.
- [Vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md)
  — the words these pages use, defined once.

## Licence

MIT
