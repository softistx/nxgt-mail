# @nxgt/mail-ui

E-mail components for a normal [Maizzle](https://maizzle.com) 6 project, in
the style of `@nxgt/material-vue`: `<NxLayout>`, `<NxButton>`, `<NxCard>`,
`<NxAlert>`, `<NxTable>`, `<NxTimeline>`, `<NxStatCard>`, `<NxActionCard>`… with its variants,
colours and tokens, rendered with tables and
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

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-ui/previews/components-en.png" width="420" alt="An e-mail using the first Nx components: layout, typography, code, buttons, separator, card with badge, summary data and status, alert, banner, link">

The components from `NxLayout` to `NxCode` in one e-mail, with the brand
`Acme` and the default theme —
[in French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-ui/previews/components-fr.png).

> **1.x.** Semantic versioning: a breaking change waits for the next major,
> and the changelog says what each release changes.

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

Runs on Node `>=20` or Bun; CI tests on Bun only.

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
  <NxLayout :preheader="t('verify-email.title')">
    <NxTypography variant="headline-small">{{ t('verify-email.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('verify-email.action') }}</NxButton>
    <NxSpacer />
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

### The components

Each one mirrors the `@nxgt/material-vue` component of the same name, without
the `Nx` — except `NxSpacer` and `NxCode`, the e-mail's own:

- **Page and text** — `NxLayout`, `NxTypography`, `NxLink`, `NxSeparator`,
  `NxSpacer`, `NxExtendedLabel`, `NxHighlightText`, `NxKbd`, `NxCode`.
- **Buttons** — `NxButton`, `NxLinkButton`, `NxIconButton`, `NxButtonGroup`.
- **Boxes and statuses** — `NxCard` and its parts, `NxActionCard`,
  `NxFigure`, `NxBadge`, `NxCountBadge`, `NxAlert`, `NxBanner`,
  `NxStatusIndicator`, `NxChip`.
- **Data** — `NxSummaryData`, `NxTable` and its parts, `NxDescription`,
  `NxListTile`, `NxAvatar` and `NxAvatarGroup`.
- **Sequences** — `NxProgress`, `NxSteps` and `NxStepsItem`, `NxTimeline`.
- **Summaries** — `NxHero`, `NxEntityHeader`, `NxStatCard`, `NxGoalCard`,
  `NxRatioCard`, `NxCompareCard`, `NxBreakdownCard`, `NxSeeAlso`.
- **Details** — `NxEventChip` (an invitation's date and time),
  `NxAttributes`, `NxPostalAddress`, `NxOpeningHours`, `NxContacts`,
  `NxFileList` (attachments or downloads), `NxRating` (read only, or a row of
  review links).

```vue
<template>
  <NxExtendedLabel>
    Your inbox
    <template #trailing><NxCountBadge :count="3">Unread</NxCountBadge></template>
  </NxExtendedLabel>
  <NxActionCard title="Weekly digest" description="One e-mail each Monday." active />
  <NxButtonGroup>
    <NxButton href="https://acme.example/inbox" data-state="active">Inbox</NxButton>
    <NxIconButton href="https://acme.example/starred" icon="&#9733;" tooltip="Starred" />
  </NxButtonGroup>
  <NxSpacer size="lg" />
  <NxLinkButton to="https://acme.example/preferences">Manage your preferences</NxLinkButton>
</template>
```

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-ui/previews/content-components.png" width="420" alt="An e-mail using the layout and content components: an extended label with a count badge, highlighted text, keys, three action cards, a figure with its caption, a button group with icon buttons, an icon button and two link buttons">

```vue
<template>
  <NxEventChip title="Onboarding call" :time="placeholder('time')" />
  <NxFileList :items="[{ id: 'agenda', name: 'agenda.pdf', size: 1572864, href: placeholder('agendaLink') }]" />
  <NxRating label="How was it?" :href="(star) => `https://acme.example/review?rating=${star}`" />
</template>
```

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-ui/previews/details-components.png" width="420" alt="An e-mail using the details components: event chips, a list of attributes, postal addresses, opening hours, contacts, a file list with a download link and empty ones, a rating of four stars and a row of five review stars">

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
| `brand.logo` | `{ src, width?, alt?, darkSrc? }` | none | The header's image: `src` an absolute `http(s)` URL, `width` in pixels (120), `alt` (the brand's name), `darkSrc` shown instead of `src` under dark mode |
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

### Dark mode

`NxLayout` follows the mail client's dark theme, in the clients that support
one, with `@nxgt/material-vue`'s dark palette. A component that colours by a
token needing a dark value (`bg-card`, `text-foreground`, `border-border`, …)
carries the matching class alongside it:

```vue
<!-- what NxCard writes, roughly -->
<td class="bg-card nx-dark-bg-card text-card-foreground nx-dark-text-card-foreground ...">
```

Override a dark value the same way you override a light one — the same
`theme` option, one more `-dark` token:

```ts
ui({ brand: { name: 'Acme' }, theme: { 'color-background-dark': '#0b1220' } });
```

`color-primary`/`color-primary-foreground` and `color-muted`/
`color-muted-foreground` have no dark value by default — a project that never
sets their `-dark` twins reaches dark mode with the light value unchanged,
exactly as before these tokens existed. Set the primary pair when a near-black
brand primary would otherwise melt into the dark card — its tints
(`bg-primary-15`, `border-primary-50`, …) follow it too — and the muted pair
when a dark card needs its own step above it:

```ts
ui({
	brand: { name: 'Acme' },
	theme: {
		'color-primary': '#27272a',
		'color-primary-dark': '#a1a1aa',
		'color-primary-foreground-dark': '#18181b',
		'color-muted-dark': '#1e293b',
		'color-muted-foreground-dark': '#e2e8f0',
	},
});
```

A dark logo disappears on a dark background: give `brand.logo.darkSrc` (or
`<NxFigure :dark-src>`) a light-background version, and it shows instead
under dark mode.

```ts
ui({
	brand: {
		name: 'Acme',
		logo: {
			src: 'https://acme.example/logo-dark-on-transparent.png',
			darkSrc: 'https://acme.example/logo-light-on-transparent.png',
		},
	},
});
```

Gmail cannot be targeted from CSS and always shows the light styles. See
[Dark mode](docs/guide/dark-mode.md) for the technique, per client, and its
limits.

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-ui/previews/components-en-dark.png" width="420" alt="The first components e-mail under prefers-color-scheme: dark">

The light version is [above](#nxgtmail-ui); [`components-en.png`](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-ui/previews/components-en.png) is the same e-mail without dark mode forced.

### Right-to-left languages

`NxLayout` writes `dir` on `<html>`, the body and the wrapper table, from
`@nxgt/mail-i18n`'s `dir` global (or, without it, a small built-in list of
right-to-left scripts by locale). Seventeen other components mirror their
physical CSS for the direction they build in — an alert's accent bar, a
delta's and a see-also's arrow, a timeline's side, a list tile's trailing
slot, an entity header's actions, a summary row's alignment, and more (see
[Right-to-left languages](docs/guide/right-to-left.md) for the full list):

```ts
i18n({ locales: ['en', 'ar'] }); // dir is 'rtl' for ar, 'ltr' for en
```

```vue
<!-- what NxAlert writes, roughly, for an rtl build -->
<td class="border-0 border-solid p-4 border-r-8 ...">
```

`@nxgt/mail-ui`'s own shared messages ship `en`/`fr` only; add a right-to-left
locale's translation of the `common.*` keys you use, the same way you add its
templates.

### The shared messages — `uiCatalogues`

```ts
i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] });
```

`common.greeting` (`Hello {name},`), `common.footer.why`,
`common.footer.ignore`, `common.avatar-group.more`, `common.timeline.empty`,
`common.metrics.of-target`, `common.metrics.this-period`,
`common.metrics.last-period`, `common.see-also`, `common.count-badge.label`,
and the words of the details components (`common.attributes`,
`common.postal-address`, `common.opening-hours.*`, `common.contacts.*`,
`common.file-list.*`, `common.rating.star`), in `en` and `fr`. Your
`locales/<locale>.json`
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
[`brand` in templates](docs/guide/plugin.md#brand-in-templates), and
[`Property 'brand' does not exist`](docs/troubleshooting.md#the-editor-says-property-brand-does-not-exist-in-a-template)
if the editor does not know `brand`.

### Replacing a component

```vue
<!-- components/nx-badge.vue — replaces the package's <NxBadge> in every template -->
<template>
  <span class="rounded-sm bg-primary px-2 text-xs text-primary-foreground"><slot /></span>
</template>
```

`components/NxBadge.vue` works as well: Maizzle names a component the same
from either case.

A file in your `components/` named as one of our tags wins over ours — in
your templates, in ours, and in a package's. A copy of ours must be renamed:
ours are named without the prefix `ui()` adds, so a copied `badge.vue` is
`<Badge>` and replaces nothing until it is `nx-badge.vue`. See
[The plugin](docs/guide/plugin.md#replacing-a-component) and
[A project's own component does not replace the package's](docs/troubleshooting.md#a-projects-own-component-does-not-replace-the-packages).

## Traps

**List `ui()` in `plugins`.** A component used without it fails the build:
`NxLayout: ui() is not in the plugins of defineMailConfig`.

**A tag that resolves to no component fails the build**, nested or not,
naming the tag and the file:
`ui: <NxButon> in emails/welcome.vue is no component — check its name, or add
the plugin or the components folder that brings it`. Correct the tag, or
bring its component. It fails under `NODE_ENV=production` too.

**With `@nxgt/mail-i18n`, give it the shared messages.** `<NxLayout>` calls
`t('common.footer.why')` once the i18n plugin is listed, and the build fails
with `calls t('common.footer.why'), which is not a key of the catalogues`
unless `catalogues: [uiCatalogues]` is passed, or your catalogues hold the
key.

**Another locale writes the `common` keys itself.** `uiCatalogues` has `en`
and `fr` only: a project in `de` adds its ten keys — `common.greeting`,
`common.footer.why`, `common.footer.ignore`, `common.avatar-group.more`,
`common.timeline.empty`, `common.metrics.of-target`,
`common.metrics.this-period`, `common.metrics.last-period` and
`common.see-also` and `common.count-badge.label` — to `locales/de.json`.

**Icons are slots.** An e-mail has no icon font: pass an `<img>` with an
absolute URL, or a character, to `#icon` — or to `NxIconButton`'s `icon`.

**Dark mode is followed, not opted into.** The layout always declares
`<meta name="color-scheme" content="light dark">`: a component that colours
by a token needing a dark value carries the matching class, and shows it in
every client that reads `prefers-color-scheme` or `[data-ogsc]`/`[data-ogsb]`
— Gmail excepted, which always shows the light styles. See
[Dark mode](docs/guide/dark-mode.md).

**Right-to-left is followed too, not opted into.** `dir` on `<html>`, the
body and the wrapper table, and every component's physical CSS, follow the
locale's direction automatically — nothing to pass. See
[Right-to-left languages](docs/guide/right-to-left.md).

**Use `NxSpacer` for vertical space**: `<NxSpacer size="lg" />`, on
Maizzle's `<Spacer>`, which Outlook keeps.

**A count, a query or an icon is known at build time.** `NxCountBadge`'s
`count`, `NxHighlightText`'s `query` and `NxIconButton`'s `icon`, like
`NxProgress`'s `modelValue`, fail the build when given a placeholder. Write
a count known only at send time in an `NxBadge`, highlight a query known at
build time, and put an icon known only at send time in `NxIconButton`'s
default slot, as an `<img :src="placeholder('iconUrl')">`.
So are `NxRating`'s `modelValue` and `NxEventChip`'s `color` (a colour of
the theme or a hex one): write a rating known only at send time as text.

**Never branch on a placeholder** in a component or a template:
`v-if="link.startsWith('https:')"` is decided on the string `{{ link }}`.

## Type safety, counted

**9 plausible mistakes, 9 refused** at compile time, each measured by a
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
9. A logo `darkSrc` that is not a string.

The same file holds the calls that must keep compiling: a refusal that refuses
the correct call is a bug.

**2 template mistakes, 2 refused** by `.maizzle/nxgt-mail-ui.d.ts`, each
measured by a `@vue-expect-error` in
[`test/fixture/types/refusals.vue`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/test/fixture/types/refusals.vue),
checked by `vue-tsc` after `maizzle prepare` (`bun run typecheck:templates`):

1. A field the brand does not have (`brand.nmae`).
2. `brand.logo.src` without `?.`: the logo is optional.

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
