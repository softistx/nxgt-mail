# The plugin

This page is for adding `ui({ brand, theme })` to a project: what it gives
every template, the options it checks, and how a project replaces one of its
components or its layout.

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { ui } from '@nxgt/mail-ui';

export default defineMailConfig({
	plugins: [ui({ brand: { name: 'Acme', url: 'https://acme.example' } })],
});
```

```vue
<!-- emails/welcome.vue -->
<template>
  <NxLayout preheader="Your account is ready">
    <NxTypography variant="headline-small">Welcome to {{ brand.name }}</NxTypography>
    <NxButton href="https://acme.example/start">Get started</NxButton>
  </NxLayout>
</template>
```

`maizzle build` writes `dist/welcome.html`: `Acme` at the top, linked to
`https://acme.example`, the heading and the button on a white card, and
`Acme` again in the footer.

## The signature

```ts
import type { MailPlugin } from '@nxgt/mail-config';

interface Brand {
	readonly name: string;
	readonly url?: string;
	readonly logo?: {
		readonly src: string;
		readonly width?: number; // pixels, default 120
		readonly alt?: string; // default the brand's name
	};
}

interface UiOptions {
	readonly brand: Brand;
	readonly theme?: Readonly<Record<string, string>>;
}

function ui(options: UiOptions): MailPlugin;
```

The plugin it answers, named `ui`, does three things:

- registers every component of the package's `components/` folder under the
  prefix `Nx` (`NxButton.vue` is `<NxButton>`); Maizzle's own stay
  available (`<Button>`, `<Spacer>`);
- gives every template `brand`, the brand as passed;
- provides the brand and the theme's CSS to the components, under
  [`UI_CONTEXT`](#your-own-layout--ui_context).

It sets no build event, and no list but the two `defineMailConfig` joins
(`components.source`, `vue.plugins`), so it drops nothing another plugin or
your config sets. See
[`@nxgt/mail-config`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-config/docs/guide/config.md)
for how plugins merge.

## Options

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `brand` | `Brand` | — (required) | Who sends the e-mail: `<NxLayout>`'s header and footer, and `brand` in templates |
| `brand.name` | `string` | — (required) | The header's text when there is no logo; the footer's, always |
| `brand.url` | `string` | none | Where the header and the footer's name link to. Without it, neither is a link |
| `brand.logo.src` | `string` | — (required in `logo`) | The header's image, instead of the name |
| `brand.logo.width` | `number` | `120` | The image's `width` attribute, in pixels |
| `brand.logo.alt` | `string` | `brand.name` | The image's `alt` |
| `theme` | `Record<string, string>` | `{}` | Tokens of `theme.css` to override — see [The theme](theme.md) |

### `brand.url` and `brand.logo.src` are absolute

```ts
ui({
	brand: {
		name: 'Acme',
		url: 'https://acme.example',
		logo: { src: 'https://acme.example/logo.png', width: 96 },
	},
});
```

A mail client opens the e-mail far from your site: it resolves no relative
URL, and `/logo.png` would show nothing. Both are refused unless they start
with `http://` or `https://`. The header then shows:

```html
<a href="https://acme.example" …><img src="https://acme.example/logo.png" width="96" alt="Acme" …></a>
```

### The brand is fixed when `ui()` is called

`ui()` keeps a frozen copy of `brand`: changing the object you passed, after
the call, changes nothing in the e-mails.

## `brand` in templates

```vue
<template>
  <NxTypography>Thanks for joining {{ brand.name }}.</NxTypography>
  <NxLink v-if="brand.url" :href="`${brand.url}/help`">Help</NxLink>
</template>
```

`brand` is a Vue global property, read-only. It is known at build time, so a
template may branch on it, unlike a placeholder.

To have it typed in templates by Vue's language tools (Volar, `vue-tsc`),
something in your TypeScript program imports the package — a
`maizzle.config.ts` in your tsconfig already does:

```ts
// env.d.ts, or any file your tsconfig includes
import type {} from '@nxgt/mail-ui';
```

## Replacing a component

A file in your project's `components/` named like one of ours replaces it, in
every template:

```vue
<!-- components/NxBadge.vue -->
<template>
  <span class="rounded-sm bg-primary px-2 text-xs text-primary-foreground"><slot /></span>
</template>
```

The theme's tokens (`bg-primary`, `rounded-sm`) work in it, since it renders
inside `<NxLayout>`. To start from ours, copy it from the package — its
folder is `COMPONENTS_DIR`:

```ts
import { COMPONENTS_DIR } from '@nxgt/mail-ui';

console.log(COMPONENTS_DIR); // /…/node_modules/@nxgt/mail-ui/components
```

A copied component imports `./ui` for its shared types; copy `ui.ts` from the
same folder beside it, or inline what it uses.

## Your own layout — `UI_CONTEXT`

Replace `<NxLayout>` the same way, with `components/NxLayout.vue`. Read the
brand and the theme's CSS from `UI_CONTEXT`, so `ui({ theme })` still applies
to every component inside:

```vue
<!-- components/NxLayout.vue -->
<script setup lang="ts">
import { type UiContext, UI_CONTEXT } from '@nxgt/mail-ui';
import { inject } from 'vue';

const { brand, css } = inject(UI_CONTEXT) as UiContext;
const style = `@import "@maizzle/tailwindcss";\n${css}`;
</script>

<template>
  <Html lang="en">
    <Head>
      <meta name="color-scheme" content="light">
      <style v-html="style"></style>
    </Head>
    <Body class="bg-background font-sans">
      <Container class="px-6 py-8">
        <p class="m-0 mb-6 text-lg font-semibold text-primary">{{ brand.name }}</p>
        <slot />
      </Container>
    </Body>
  </Html>
</template>
```

```ts
const UI_CONTEXT = 'nxgt:mail-ui';

interface UiContext {
	readonly brand: Brand;
	/** theme.css, then an @theme block of the overrides. */
	readonly css: string;
}
```

The theme is not a stylesheet link: a mail client loads none. Its tokens go
in the layout's `<style>` under the Tailwind import, and Maizzle inlines the
result.

## Errors

`ui()` throws a bare `TypeError` when `maizzle.config.ts` loads:

| Message | Cause |
| --- | --- |
| `ui: options must be an object, as { brand: { name: 'Acme' } }` | `ui()` called with nothing, or not an object |
| `ui: brand must be an object, as { name: 'Acme', url: 'https://acme.example' }` | No `brand`, or `brand: 'Acme'` |
| `ui: brand.name must be the name the e-mails show` | No `name`, or a blank one |
| `ui: brand.url must be an absolute http(s) URL` | `url: '/home'`, `url: 'acme.example'` |
| `ui: brand.logo.src must be an absolute http(s) URL — a mail client loads nothing relative` | `logo: 'logo.png'`, or `logo: { src: 'logo.png' }` |
| `ui: brand.logo.width must be a width in pixels` | `0`, `1.5`, `'96'` |
| `ui: brand.logo.alt must be a string` | `alt: 1` |
| `ui: theme must be an object of tokens, as { 'color-primary': '#0f766e' }` | `theme: ['#0f766e']` |
| `ui: theme.color-primay is not a token of the theme — name one of theme.css without its --, as color-primary` | A misspelled token, or one written with its `--` |
| `ui: theme.color-primary must be a CSS value, as #0f766e or 8px` | An empty value, a number, or one holding `;`, `{`, `}`, `<`, `>`, a quote, a backslash, a CSS comment (`/*`, `*/`) or a line break |

```ts
ui({ brand: { name: 'Acme', url: '/home' } });
// TypeError: ui: brand.url must be an absolute http(s) URL
```

A component rendered without the plugin fails the build instead, naming
itself:

```text
Error: NxLayout: ui() is not in the plugins of defineMailConfig
```

It happens when the components are registered by hand from
`COMPONENTS_DIR` rather than through `ui()`. List `ui()` in the project's
`plugins`.

## See also

- [Components](components.md) — every component, its props and its slots.
- [The theme](theme.md) — the tokens `theme` overrides.
- [Shared messages](messages.md) — the footer's text with `@nxgt/mail-i18n`.
