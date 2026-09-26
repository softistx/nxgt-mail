# Extending

This page is for changing the preset beyond its options: a second preset
overriding a token or a message, a component of your own replacing one of the
preset's, and a layout of your own.

```ts
// mail.config.ts
import { defineMailConfig, definePreset } from '@nxgt/mail-build';
import { nxgtPreset } from '@nxgt/mail-preset';

const acme = definePreset({
	name: 'acme',
	theme: { color: { primary: '#e11d48' } },
	messages: {
		en: { common: { footer: { why: 'Acme sent you this e-mail.' } } },
	},
});

export default defineMailConfig({
	locales: ['en', 'fr'],
	fallbackLocale: 'en',
	presets: [
		nxgtPreset({ brand: { logo: 'https://cdn.example.com/logo.png', name: 'Acme' } }),
		acme,
	],
});
```

The button is `#e11d48` instead of `#2563eb`, and the canvas is still
`#f4f4f5`. The English footer reads *Acme sent you this e-mail.*, the French
one is still *Vous recevez cet e-mail suite à une action sur votre compte.*
The logo is Acme's.

## The order

The build applies what it is given in this order, a later one overriding an
earlier one **one token, one component, one message at a time** — never a
whole namespace:

1. each preset of `presets`, in the order of the list;
2. the application's own files: `components/` and `messages/`.

So `acme` above overrides `nxgtPreset()`, and your `messages/en.json`
overrides both. The same token in `nxgtPreset({ brand: { primary } })` and in
a later preset: the later preset wins.

## A second preset — `definePreset`

`definePreset` comes from `@nxgt/mail-build`; it only types the object. A
preset is data:

| Field | Type | Effect |
| --- | --- | --- |
| `name` | `string` | Required, `camelCase`, unique in the list. Named in the errors: `preset acme` |
| `theme` | `{ [namespace]: { [token]: string } }` | Tokens, merged one at a time over the earlier presets' |
| `components` | `{ 'Name.vue': source }` | Single-file components by file name, replacing an earlier preset's of the same name |
| `messages` | `{ [locale]: catalogue }` | Catalogues by locale, merged one message at a time |

Every field but `name` is optional. The full shape, and what the build refuses
in a preset, is in
[`@nxgt/mail-build`'s Presets guide](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/guide/presets.md).

A preset of your own is where a token of a namespace `nxgtPreset` has no
option for goes, and where a brand shared by several applications lives —
publish it as a package that exports the preset:

```ts
// acme-mail-preset/src/index.ts
import { definePreset } from '@nxgt/mail-build';

export const acmePreset = definePreset({
	name: 'acme',
	theme: {
		color: { primary: '#e11d48', canvas: '#fff7ed' },
		font: { sans: "Georgia, 'Times New Roman', serif" },
	},
	messages: {
		en: { common: { footer: { why: 'Acme sent you this e-mail.' } } },
		fr: { common: { footer: { why: 'Acme vous a envoyé cet e-mail.' } } },
	},
});
```

```ts
// mail.config.ts
import { defineMailConfig } from '@nxgt/mail-build';
import { nxgtPreset } from '@nxgt/mail-preset';
import { acmePreset } from 'acme-mail-preset';

export default defineMailConfig({
	locales: ['en', 'fr'],
	fallbackLocale: 'en',
	presets: [nxgtPreset(), acmePreset],
});
```

A second preset's tokens are **not** checked against `nxgtPreset`'s:
`definePreset` types `theme` as any namespace of any token, so
`{ color: { primry: '#e11d48' } }` adds a token no class uses, and the button
keeps the default accent. The token names are in [Theme](theme.md).

## Replacing a component

A `components/` folder beside `mail.config.ts` holds the application's own
components, one PascalCase `.vue` file each. A file named like one of the
preset's replaces it in every template:

```vue
<!-- components/MailCode.vue — a code with a border instead of a tinted block -->
<template>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="my-4">
    <tr>
      <td class="border border-solid border-border px-6 py-4 text-center font-mono text-3xl font-bold text-foreground"><slot /></td>
    </tr>
  </table>
</template>
```

The other components, and `TransactionalLayout`, are kept. A file with a new
name — `components/OrderLine.vue` — is a new component, usable as
`<OrderLine>`. Both use the theme's classes like the preset's own.

A component renders once, at build time. It may branch or compute on its
**own static props** — a `variant` written as a literal where it is used —
but **never on a value a template passes**, such as `href`: at build time that
value is a placeholder, so `v-if="href.startsWith('https:')"` or
`encodeURIComponent(href)` is decided on the placeholder and frozen into every
e-mail, and the build does not catch it. Pass it through untouched — into a
slot, a text attribute, or an `href` — as the preset's own components do:

```vue
<!-- components/MailLink.vue -->
<script setup>
defineProps({ href: { type: String, required: true } });
</script>

<template>
  <Link :href="href" class="text-primary font-semibold no-underline"><slot /></Link>
</template>
```

A value it drops, or moves into a `style` or a class, fails the build. The
rule in full is in
[`@nxgt/mail-build`'s Presets guide](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/guide/presets.md#a-components-own-rule--never-compute-on-a-passed-value).

Only `.vue` files are read, directly in the folder: a sub-folder
(`components/buttons/`) is a `TypeError`, and any other file is ignored.

The folder is optional: without it, the preset's components are used as they
are. It may not hold a component named like one Maizzle ships — `Button.vue`,
`Text.vue`, `Heading.vue`… — which the build refuses:

```text
build: components/: the component Button.vue would replace Maizzle's <Button> — give it a name of its own
```

That is why the preset's are `MailButton`, `MailText` and `MailHeading`: they
wrap Maizzle's, which carry the Outlook fallbacks. Another folder is set with
`components` in the config — see
[`@nxgt/mail-build`'s Presets guide](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/guide/presets.md#the-applications-components).

## A layout of your own

A `components/TransactionalLayout.vue` replaces the preset's layout; a new name
— `components/NewsletterLayout.vue` — adds one. Either must import Maizzle's
Tailwind **and** the theme in the **same** `<style>`:

```vue
<!-- components/NewsletterLayout.vue -->
<template>
  <Html :lang="lang">
    <Head>
      <style>
        @import "@maizzle/tailwindcss";
        @import "./theme.css";
      </style>
    </Head>
    <Body class="m-0 bg-canvas p-0">
      <Container class="bg-surface p-8 font-sans text-foreground">
        <slot />
        <Text class="text-xs text-muted">{{ t('common.footer.why') }}</Text>
      </Container>
    </Body>
  </Html>
</template>
```

`theme.css` holds the tokens of every preset, written by the build beside each
template. Tokens imported in another `<style>` block do not reach the
utilities: `bg-canvas` and `text-muted` would compile to nothing, and the
e-mail would render without their colours. Maizzle's own `<Layout>` imports
Tailwind without the theme, so a template placed in it cannot use the tokens.

## See also

- [Theme](theme.md) — the tokens `nxgtPreset` has, and their classes.
- [Components](components.md) — what each component renders, to start a
  replacement from.
- [Messages](messages.md) — overriding a message from your own catalogue.
