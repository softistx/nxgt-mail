# Theme

This page is for changing how the preset looks: `nxgtPreset(options)`, the
brand, every theme token with its default and its Tailwind class, and what the
options refuse.

```ts
// mail.config.ts
import { defineMailConfig } from '@nxgt/mail-build';
import { nxgtPreset } from '@nxgt/mail-preset';

export default defineMailConfig({
	locales: ['en', 'fr'],
	fallbackLocale: 'en',
	presets: [
		nxgtPreset({
			brand: { primary: '#4f46e5', logo: 'https://cdn.example.com/logo.png', name: 'Acme' },
		}),
	],
});
```

Every e-mail built with this config has an indigo button and indigo links, and
the Acme logo at the top of the card. Nothing else changes.

## `nxgtPreset(options)`

```ts
function nxgtPreset(options?: NxgtPresetOptions): Preset;

interface NxgtPresetOptions {
	readonly brand?: {
		readonly primary?: string;
		readonly onPrimary?: string;
		readonly logo?: string;
		readonly name?: string;
	};
	readonly theme?: {
		readonly [Namespace in keyof NxgtTheme]?: Partial<NxgtTheme[Namespace]>;
	};
}
```

Every option is optional: `nxgtPreset()` is the neutral default. It answers a
`Preset` — data, which `defineMailConfig({ presets })` takes (the shape is in
[`@nxgt/mail-build`'s Presets guide](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/guide/presets.md)).

### `brand`

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `primary` | `string` | `'#2563eb'` | The token `color.primary`: the button's background, the links |
| `onPrimary` | `string` | `'#ffffff'` | The token `color.onPrimary`: the text on the button. Change it with `primary` when the accent is light |
| `logo` | `string` | none | An `http:` or `https:` URL, drawn 120 pixels wide at the top of the card of every e-mail. Without it, no `<img>` is written |
| `name` | `string` | `''` | The logo's `alt` text — what a client that blocks images shows instead. Only with `logo` |

`brand.primary` and `brand.onPrimary` are shortcuts for two tokens, and win
over `theme.color.primary` and `theme.color.onPrimary` when both are given.

```ts
// A pale accent needs dark text on the button.
nxgtPreset({ brand: { primary: '#facc15', onPrimary: '#18181b' } });
```

The logo and its name are escaped into the layout; the URL is checked when the
preset is created, never when an e-mail is sent. Host it where it will stay:
every e-mail already sent points at it.

### `theme`

Any token, one at a time — the ones you leave out keep their defaults:

```ts
nxgtPreset({
	theme: { color: { canvas: '#ffffff' }, radius: { button: '0' } },
});
// color.canvas is #ffffff, radius.button is 0; color.foreground, radius.card… unchanged
```

A token is a CSS value, written as a string. It becomes a Tailwind CSS 4
variable — `color.onPrimary` is `--color-on-primary` — and so a class:

| Token | Default | Class | Used by |
| --- | --- | --- | --- |
| `color.primary` | `#2563eb` | `bg-primary`, `text-primary` | `MailButton`'s background, `MailLink` |
| `color.onPrimary` | `#ffffff` | `text-on-primary` | `MailButton`'s text |
| `color.canvas` | `#f4f4f5` | `bg-canvas` | Behind the card |
| `color.surface` | `#ffffff` | `bg-surface` | The card |
| `color.foreground` | `#18181b` | `text-foreground` | Body text and headings |
| `color.muted` | `#71717a` | `text-muted` | The footer |
| `color.border` | `#e4e4e7` | `bg-border` | `MailDivider` |
| `color.code` | `#f4f4f5` | `bg-code` | Behind `MailCode` |
| `font.sans` | `-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` | `font-sans` | Everything |
| `font.mono` | `ui-monospace, Menlo, Consolas, 'Courier New', monospace` | `font-mono` | `MailCode` |
| `radius.button` | `6px` | `rounded-button` | `MailButton` |
| `radius.card` | `8px` | `rounded-card` | The card, `MailCode` |

The fonts are ones every client already has, so nothing is downloaded. The
colours are grey and one accent on purpose: an application that changes
nothing sends something plain, not something branded as someone else's.

A template inside `TransactionalLayout` can use the classes too — the layout
compiles them with the rest of Tailwind:

```vue
<template>
  <TransactionalLayout>
    <MailText>{{ t('orderPlaced.body') }}</MailText>
    <p class="text-sm text-muted">{{ t('orderPlaced.note') }}</p>
  </TransactionalLayout>
</template>
```

The tokens are typed as `NxgtTheme`, exported for a helper of your own:

```ts
import type { NxgtTheme } from '@nxgt/mail-preset';

const accent: NxgtTheme['color']['primary'] = '#4f46e5';
```

## What it refuses

A token the preset does not have is a compile error in `mail.config.ts` — 4
mistakes, counted in the [README](../../README.md#type-safety-counted):

```ts
nxgtPreset({ brand: { primry: '#4f46e5' } });
//                    ~~~~~~ 'primry' does not exist in type …
nxgtPreset({ theme: { color: { brand: '#4f46e5' } } });
//                             ~~~~~ 'brand' does not exist in type …
```

The same mistakes from a config written in JavaScript — or cast — are a
`TypeError` when the config loads, before anything is built:

| Mistake | `TypeError` message |
| --- | --- |
| An option that is not `brand` or `theme` | `nxgtPreset: options.colours is not an option — one of brand, theme` |
| A brand option misspelled | `nxgtPreset: brand.primry is not a brand option — one of primary, onPrimary, logo, name` |
| A namespace the preset does not have | `nxgtPreset: theme.colour is not a theme namespace of the preset — one of color, font, radius` |
| A token the preset does not have | `nxgtPreset: theme.color.brand is not a token of the preset — one of primary, onPrimary, canvas, surface, foreground, muted, border, code` |
| A logo that is not an `http:` or `https:` URL | `nxgtPreset: brand.logo must be an http: or https: URL` |
| A value that is not a string | `nxgtPreset: brand.primary must be a string` |
| `brand` that is not an object | `nxgtPreset: brand must be an object` |
| A namespace that is not an object | `nxgtPreset: theme.color must be an object` |
| `brand.name` without `brand.logo` | `nxgtPreset: brand.name is the logo's alternative text — give brand.logo too` |
| Options that are not an object | `nxgtPreset: options must be an object` |

A token that is a string but not one CSS value — `'red; } body { color: red'`,
a `url(…)`, a double quote, a line break — passes `nxgtPreset` and is refused
by the build when it applies the preset. A font stack with single-quoted names
(`"Georgia, 'Times New Roman', serif"`) is one CSS value, and fine; see
[`@nxgt/mail-build`'s Presets guide](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/guide/presets.md#what-the-build-refuses).

A token of a namespace the preset does not have — a `spacing` scale, a
`fontWeight` — is not an option of `nxgtPreset`: add it with a preset of your
own, see [Extending](extending.md).

## See also

- [Components](components.md) — which component uses which class.
- [Extending](extending.md) — a second preset overriding a token.
