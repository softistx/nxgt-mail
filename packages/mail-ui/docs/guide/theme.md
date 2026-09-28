# The theme

This page is for changing how the components look: the tokens of
`theme.css`, how a colour reaches the built HTML, and what an override
changes.

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { ui } from '@nxgt/mail-ui';

export default defineMailConfig({
	plugins: [
		ui({
			brand: { name: 'Acme' },
			theme: { 'color-primary': '#0f766e', 'radius-xl': '8px' },
		}),
	],
});
```

Every `<NxButton>` is then `#0f766e`, every tonal button and the page behind
the card are tints of it, and the card's corners are 8px.

## Where the theme comes from

`theme.css` is `@nxgt/material-vue`'s light theme, as Tailwind 4 `@theme`
tokens. `<NxLayout>` writes it in its `<style>`, under
`@import "@maizzle/tailwindcss"`, then an `@theme` block of your overrides,
which wins. So any Tailwind class a template writes — `bg-primary`,
`text-muted-foreground`, `rounded-lg` — uses the theme, in the components and
in your own markup inside `<NxLayout>`.

The colours are material-vue's, in `oklch`. Maizzle writes each as a hex
value in the built HTML, followed by a `lab()` one for the clients that read
it, and leaves no `var()` and no `oklch()` for a client to resolve:

```html
<p style="color: #020918; color: lab(2.35721% .367686 -8.51797)">…</p>
```

## Tokens

Name a token in `theme` without its `--`: `--color-primary` is
`'color-primary'`.

| Token | Default | Used for |
| --- | --- | --- |
| `radius-sm`, `radius-md`, `radius-lg`, `radius-xl` | `6px`, `8px`, `10px`, `14px` | `rounded-*`: `NxBanner` (`md`), `NxCode` (`lg`), the card (`xl`) |
| `color-background` | white | What every tint is mixed over |
| `color-foreground` | near black | Text |
| `color-card`, `color-card-foreground` | white, near black | The layout's card, `NxCard` |
| `color-primary`, `color-primary-foreground` | indigo, near white | The default colour of buttons, badges, alerts |
| `color-secondary`, `color-secondary-foreground` | blue, near white | `color="secondary"` |
| `color-muted`, `color-muted-foreground` | light grey, grey | `NxCode`'s background, a table's footer, an avatar's initials; descriptions, captions, the footer |
| `color-accent`, `color-accent-foreground` | light grey, near black | `bg-accent` in your markup |
| `color-error`, `color-success`, `color-info`, `color-warning` | red, teal, blue, orange | The status colours |
| `color-error-foreground`, … `color-warning-foreground` | near white | Text on a status colour |
| `color-border` | light grey | Card, separator, table and outlined borders |
| `color-paper` | 5% primary over background | The page behind the layout's card |
| `color-<colour>-5`, `-10`, `-15`, `-20`, `-25`, `-40`, `-50` | the colour mixed over background | Tints — see below |
| `color-background-dark`, `color-foreground-dark`, `color-card-dark`, `color-card-foreground-dark`, `color-accent-dark`, `color-accent-foreground-dark`, `color-border-dark`, `color-paper-dark` | `@nxgt/material-vue`'s dark values | Shown under dark mode — see [Dark mode](dark-mode.md) |
| `color-primary-dark`, `color-primary-foreground-dark` | their light value | **Optional.** Shown under dark mode once set, its tints too — see [Dark mode](dark-mode.md#which-tokens-have-a-dark-value) |
| `color-muted-dark`, `color-muted-foreground-dark` | their light value | **Optional.** Shown under dark mode once set — see [Dark mode](dark-mode.md#which-tokens-have-a-dark-value) |

The exact values are in the file itself:

```ts
import { readFileSync } from 'node:fs';
import { THEME_FILE } from '@nxgt/mail-ui';

const css = readFileSync(THEME_FILE, 'utf8'); // @theme { --radius-sm: 6px; … }
```

A layout of your own that does not read [`UI_CONTEXT`](plugin.md#your-own-layout--ui_context)
can import the file by its subpath — without the `theme` overrides, which
only `UI_CONTEXT` carries:

```vue
<template>
  <Html>
    <Head>
      <style>
        @import "@maizzle/tailwindcss";
        @import "@nxgt/mail-ui/theme.css";
      </style>
    </Head>
    <Body><p class="bg-primary-15 text-primary">…</p></Body>
  </Html>
</template>
```

## Tints, where material-vue uses an alpha

material-vue writes a translucent colour: `bg-primary/15`, `border-error/50`.
A mail client cannot be trusted with an alpha, so the theme declares each tint
as a plain colour: `bg-primary-15` is the primary colour mixed at 15% over the
background, in sRGB — the colour a browser shows for the alpha — and written
as hex in the built HTML.

| Tint | Used by |
| --- | --- |
| `-5` | `NxAlert`'s background; `NxListTile`'s; `NxHero`'s; `paper` |
| `-10` | `NxBanner`'s background; a selected `NxListTile size="sm"` |
| `-15` | `NxButton` and `NxChip variant="tonal"`; a selected `NxListTile`; an `NxTimeline` marker's ground; `NxRatioCard`'s track |
| `-20` | `NxProgress`'s track |
| `-25` | `NxStepsItem`'s circle |
| `-40` | `NxBanner`'s border; `NxSummaryData`'s lines; a selected `NxListTile`'s border; an `NxTimeline` marker's border |
| `-50` | `NxButton` and `NxChip variant="outlined"`'s border |

They exist for `primary`, `secondary`, `info`, `success`, `warning`, `error`
and `foreground`, so your own markup can use them too:

```vue
<template>
  <p class="m-0 rounded-md bg-success-10 p-3 text-success">Your payment went through.</p>
</template>
```

## Overriding a token

```ts
ui({ brand: { name: 'Acme' }, theme: { 'color-primary': '#0f766e' } });
```

- **A tint follows its colour.** Each is mixed from the colour's token, so
  `color-primary` above makes the tonal button `#dbeae9` and `paper`
  `#f3f8f8`, with no other token to change.
- **A tint can be overridden alone**: `{ 'color-primary-15': '#e0f2f1' }`.
- **`color-primary` reaches dark mode unchanged unless you also set
  `color-primary-dark`.** The one above shows `#0f766e` in both modes; add
  `'color-primary-dark': '#5eead4'` to show a different one under dark mode —
  see [Dark mode](dark-mode.md#which-tokens-have-a-dark-value).
- **Any CSS colour works**, `oklch()` included: Maizzle turns it into hex,
  as it does the theme's own.
- **The value is trimmed**, and refused if it is empty or holds `;`, `{`,
  `}`, `<`, `>`, a quote, a backslash, a CSS comment (`/*`, `*/`) or a line
  break: it must stay one declaration.
- **Only tokens of `theme.css`.** A name it does not declare is refused, so a
  misspelling fails when the config loads rather than being ignored.

```ts
ui({ brand: { name: 'Acme' }, theme: { 'color-primay': '#0f766e' } });
// TypeError: ui: theme.color-primay is not a token of the theme — name one of theme.css without its --, as color-primary
```

The full list of errors is in [The plugin](plugin.md#errors).

## Light and dark

The layout declares `<meta name="color-scheme" content="light dark">` and
ships `@nxgt/material-vue`'s dark palette, in the clients that read it. The
inlined styles a template shows without a client's own help stay the
light ones; see [Dark mode](dark-mode.md) for the technique, which client
reads it, and how to override a dark token.

## See also

- [Components](components.md) — which tokens each component uses.
- [Dark mode](dark-mode.md) — the technique, per client, and the brand's
  `darkSrc`.
- [The plugin](plugin.md) — `theme` among the other options, and your own
  layout on the same CSS.
