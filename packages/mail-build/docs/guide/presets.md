# Presets

This page is for using presets and writing one: the `presets` and
`components` options of the config, the `Preset` shape, the order everything
applies in, the `theme.css` a layout imports, and what the build refuses in a
preset.

```ts
// mail.config.ts
import { defineMailConfig, definePreset } from '@nxgt/mail-build';

const acme = definePreset({
	name: 'acme',
	theme: { color: { brand: '#e11d48' } },
	components: {
		'Brand.vue': '<template><p class="text-brand"><slot /></p></template>',
	},
	messages: { en: { common: { signOff: 'The Acme team' } } },
});

export default defineMailConfig({
	locales: ['en'],
	fallbackLocale: 'en',
	presets: [acme],
});
```

```vue
<!-- emails/welcome.vue -->
<template>
  <Html :lang="lang">
    <Head>
      <style>@import "@maizzle/tailwindcss"; @import "./theme.css";</style>
    </Head>
    <Body>
      <Brand>{{ t('common.signOff') }}</Brand>
    </Body>
  </Html>
</template>
```

`<Brand>` is the preset's component, `text-brand` its token — the paragraph is
written `color: #e11d48` — and `common.signOff` its message. The application's
`messages/en.json` holds only `welcome.subject`.

Most projects do not write a preset first: they add
[`@nxgt/mail-preset`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail-preset),
whose `nxgtPreset()` brings a layout, components, neutral tokens and shared
messages in English and French, and override what they need.

## The config — `presets` and `components`

```ts
interface MailConfig {
	// locales, fallbackLocale, emails, messages, out — see Building
	readonly components?: string;
	/** `& { call?: never }`: a preset function passed uncalled is a compile error. */
	readonly presets?: readonly (Preset & { readonly call?: never })[];
}
```

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `presets` | `readonly Preset[]` | `[]` | Theme tokens, components and messages, applied in order before the application's own files |
| `components` | `string` | `'components'` | The folder of the application's own components, one PascalCase `.vue` file each. They override a preset's component of the same name |

A preset function goes in the list **called**: `presets: [nxgtPreset()]`.
`presets: [nxgtPreset]` is a compile error — a function has a `name` too, so
without that guard it would pass for a preset.

The other options are in [Building](building.md#the-config--definemailconfig).

## The order

Everything is merged **one token, one component, one message at a time** —
never a whole namespace — and the later wins:

1. each preset of `presets`, in the order of the list;
2. the application: its `components/` folder, then its `messages/`.

```ts
export default defineMailConfig({
	locales: ['en', 'fr'],
	fallbackLocale: 'en',
	presets: [nxgtPreset(), acme], // acme overrides nxgtPreset; your files override both
});
```

With presets that bring messages, the application's `messages/` folder may be
empty or absent: the build needs at least one catalogue from somewhere. How
catalogues merge, and the `KEY_CONFLICT` a namespace replaced by a message
raises, is in
[Catalogues](catalogues.md#merging-sources--presets-then-the-application).

## The `Preset` shape — `definePreset`

```ts
function definePreset(preset: Preset): Preset;

interface Preset {
	/** Named in the errors: `nxgt`. */
	readonly name: string;
	/** Tailwind tokens, written to the `theme.css` a layout imports. */
	readonly theme?: Theme;
	/** Vue single-file components by file name: `{ 'Transactional.vue': source }`. */
	readonly components?: Readonly<Record<string, string>>;
	/** Catalogues by locale, merged before the application's. */
	readonly messages?: Catalogues;
}

type Theme = Readonly<Record<string, Readonly<Record<string, string>>>>;
```

`definePreset` only types the object: it answers it unchanged. A preset is
**data**: it hooks nothing into the build, and its only code is its
components — Vue, run at build time like a template. A package ships one as a
function answering a `Preset` (`nxgtPreset(options)`) or as a constant.

| Field | Type | Required | Effect |
| --- | --- | --- | --- |
| `name` | `string` | yes | `camelCase`, unique in the list. Named in the errors: `preset acme`, and as the message source `preset acme` |
| `theme` | `Theme` | no | Tailwind CSS 4 tokens by namespace, merged one token at a time |
| `components` | `Record<string, string>` | no | Single-file component sources by PascalCase file name; `Brand.vue` is `<Brand>` in a template |
| `messages` | `Catalogues` | no | Catalogues by locale, as `messages/<locale>.json` would hold them; a locale may be left out |

### `theme` — tokens, and `themeCss`

A namespace and a token are `camelCase`, written kebab-case in the CSS:
`{ color: { textMuted: '#71717a' } }` is `--color-text-muted`, which Tailwind
turns into `text-text-muted`, `bg-text-muted`… A namespace is one of Tailwind
CSS 4's (`color`, `font`, `radius`, `spacing`, `fontWeight`…) for the token to
become a class.

A token's value is **one CSS value** — a colour, a length, a font stack with
single-quoted names (`"-apple-system, 'Segoe UI', sans-serif"`). The build
refuses one holding `;`, a brace, a backslash, `<`, `>`, `@`, a double quote,
`url(`, a comment, a line break or an unbalanced single quote: none is ever
needed, and each could escape the declaration or fetch something.

`themeCss(theme)` answers the file the build writes:

```ts
import { themeCss } from '@nxgt/mail-build';

themeCss({
	color: { primary: '#2563eb', textMuted: '#71717a' },
	fontWeight: { heavy: '800' },
});
// '@theme {\n\t--color-primary: #2563eb;\n\t--color-text-muted: #71717a;\n\t--font-weight-heavy: 800;\n}\n'

themeCss({}); // '@theme {\n}\n'
```

```ts
function themeCss(theme: Theme): string;
```

### `theme.css` — what a layout imports

The build writes `theme.css` — every preset's tokens, merged — **beside each
template** as it renders it. A layout (or a template with no layout) imports
it in the **same `<style>`** as Maizzle's Tailwind, after it:

```vue
<Head>
  <style>
    @import "@maizzle/tailwindcss";
    @import "./theme.css";
  </style>
</Head>
```

The two imports share one block because Tailwind compiles each `<style>` on
its own: tokens imported in another block do not reach the utilities of the
first, so `text-brand` compiles to nothing and the e-mail renders without its
colour — no error. For the same reason, a template placed in Maizzle's own
`<Layout>`, which imports Tailwind without the theme, cannot use a preset's
tokens.

Without presets, or with presets that have no theme, `theme.css` is still
written, empty of tokens, so the import never fails.

### `components` — PascalCase, never Maizzle's names

A component is a Vue single-file component, as a string, under its file name:

```ts
const acme = definePreset({
	name: 'acme',
	components: {
		'Callout.vue': `<template>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="bg-brand px-6 py-4 text-white"><slot /></td></tr>
  </table>
</template>
`,
	},
});
```

A template uses it as `<Callout>`, with no import. A component renders once,
at build time: `t()` and `lang` work in it, and whatever a template passes it
must reach the output as written (see [Templates](templates.md#components)).

### A component's own rule — never compute on a passed value

A component is code its author wrote, run once at build time. It is not held
to a template's rules: a `v-if`, a default or a computed class is fine **on
its own static props** — a `level`, a `variant` written as a literal where it
is used. What it renders is checked like a template: a value it moves into a
`style` fails the build, and so does a value it drops.

**What the build cannot see is a component computing on a value a template
passes.** At build time that value is a placeholder, so a branch or a
transform is decided on the placeholder and frozen into every e-mail:

```vue
<!-- Wrong: decided once, on the placeholder, for every e-mail -->
<script setup>
defineProps({ href: { type: String, required: true } });
</script>

<template>
  <Link v-if="href.startsWith('https:')" :href="href"><slot /></Link>
  <Link v-else :href="encodeURIComponent(href)"><slot /></Link>
</template>
```

```vue
<!-- Right: the value passes through untouched -->
<script setup>
defineProps({ href: { type: String, required: true } });
</script>

<template>
  <Link :href="href" class="text-primary underline"><slot /></Link>
</template>
```

Pass such a value through untouched — into text, a text attribute, or the
start of an `href` or a `src`. Anything else is a bug the build does not
catch: decide it in your code, before calling the render function.

A component may not take the name of one Maizzle ships — `Button.vue`,
`Text.vue`, `Heading.vue`, `Layout.vue`… A preset's components wrap Maizzle's,
which carry the Outlook fallbacks; a replaced built-in could no longer be
wrapped. Prefix yours: `MailButton`, `AcmeButton`.

### `messages`

```ts
const acme = definePreset({
	name: 'acme',
	messages: {
		en: { common: { signOff: 'The Acme team' } },
		fr: { common: { signOff: 'L’équipe Acme' } },
	},
});
```

A preset's catalogues are one message source each, named `preset <name>`,
merged before the application's `messages/`. Every locale of the config must
end up with every key of the fallback locale: a locale the preset does not
translate is written by the application, or the build fails with
`KEY_MISSING` (see [Catalogues](catalogues.md#what-fails-the-build)).

## The application's components

The `components/` folder beside `mail.config.ts` holds the application's own
components, one PascalCase `.vue` file each — applied after every preset, so a
file named like a preset's component replaces it:

```text
components/
  MailButton.vue       replaces the preset's MailButton, in every template
  OrderLine.vue        a new component: <OrderLine>
emails/
messages/
mail.config.ts
```

Only `.vue` files are read — any other file is ignored — and only at the top
of the folder: a sub-folder is a `TypeError`,
`build: /home/ada/shop/components/buttons is a folder — put each component directly in /home/ada/shop/components`.
The default folder is **optional**: a project
without `components/` builds with the presets' components alone. A folder the
config **names** must exist:

```ts
export default defineMailConfig({
	locales: ['en'],
	fallbackLocale: 'en',
	components: 'src/mail/components',
});
// build: /home/ada/shop/src/mail/components does not exist — put the application's components there, or leave components out of the config
```

The same rules as a preset's apply: a PascalCase file name, never one of
Maizzle's.

## `resolvePresets` — the merge alone

`build` and `compileProject` call it; call it yourself to test a preset, or to
hand its result to [`compileMail`](building.md#compilemailoptions--without-files).

```ts
function resolvePresets(
	presets: readonly Preset[],
	appComponents?: Readonly<Record<string, string>>,
	/** The application's components folder, as named in the errors. Default `'components/'`. */
	appFolder?: string,
): Promise<ResolvedPresets>;

interface ResolvedPresets {
	readonly theme: Theme;
	/** Component file name → source; the application's own included, last. */
	readonly components: Readonly<Record<string, string>>;
	/** One message source per preset that has messages, in order. */
	readonly messageSources: readonly MessageSource[];
}
```

```ts
import { definePreset, resolvePresets } from '@nxgt/mail-build';

const base = definePreset({
	name: 'base',
	theme: { color: { primary: '#2563eb', canvas: '#f4f4f5' } },
	components: { 'Card.vue': '<template><div>base</div></template>' },
	messages: { en: { common: { hello: 'Hello' } } },
});
const brand = definePreset({ name: 'brand', theme: { color: { primary: '#e11d48' } } });

const resolved = await resolvePresets([base, brand], {
	'Card.vue': '<template><div>app</div></template>',
});
// resolved.theme:          { color: { primary: '#e11d48', canvas: '#f4f4f5' } }
// resolved.components:     { 'Card.vue': '<template><div>app</div></template>' }
// resolved.messageSources: [{ name: 'preset base', catalogues: { en: { common: { hello: 'Hello' } } } }]
```

With no preset, it answers `{ theme: {}, components: {}, messageSources: [] }`.

## Testing a preset you publish

A package that ships a preset checks it the way an application would use it —
here over `nxgtPreset()`, whose `MailButton` takes `color.primary` — built
into a module, the rendered e-mail read back:

```ts
import { expect, test } from 'bun:test';
import { compileProject } from '@nxgt/mail-build';
import { nxgtPreset } from '@nxgt/mail-preset';
import { acmePreset } from './index';

test('the button takes the accent of the brand', async () => {
	const { module } = await compileProject(
		{ locales: ['en', 'fr'], fallbackLocale: 'en', presets: [nxgtPreset(), acmePreset] },
		{ root: `${import.meta.dirname}/../test/fixtures/app` }, // emails/ and messages/ of a sample app
	);
	expect(module).toContain('background-color: #e11d48');
}, 30_000);
```

Each template renders with Maizzle, about a second each: give the test a
timeout to match.

## What the build refuses

A preset is data a package wrote: the build checks it before using it, and a
mistake in it is a bare `TypeError`, before any template is rendered.

| Mistake | `TypeError` message |
| --- | --- |
| `presets` is not a list | `build: presets must be a list, as [nxgtPreset()], or left out` |
| `components` is not a string | `build: components must be a path, or left out` |
| A named `components` folder does not exist | `build: /home/ada/shop/parts does not exist — put the application's components there, or leave components out of the config` |
| A sub-folder in the components folder | `build: /home/ada/shop/components/buttons is a folder — put each component directly in /home/ada/shop/components` |
| An entry that is not a preset | `build: presets[0] is not a preset — pass what a preset function returns, as nxgtPreset()` |
| A preset with no `camelCase` name | `build: presets[0] has no camelCase name — name it, as definePreset({ name: 'acme', … })` |
| The same preset twice | `build: two presets are named base — a preset is listed once` |
| A component file name not PascalCase | `build: preset a: the component card.vue is not a PascalCase .vue file name, as Transactional.vue` |
| A component named like Maizzle's | `build: preset a: the component Button.vue would replace Maizzle's <Button> — give it a name of its own` |
| A component that is not a string | `build: preset a: the component Card.vue must be the source of a single-file component` |
| `components` that is not an object | `build: preset a: components must be an object of sources by file name, as { 'Transactional.vue': '<template>…</template>' }` |
| `theme` that is not an object | `build: preset a: theme must be an object of namespaces, as { color: { primary: '#2563eb' } }` |
| A namespace not `camelCase` | `build: preset a: the theme namespace Color is not camelCase, as color or fontWeight` |
| A namespace that is not an object | `build: preset a: theme.color must be an object of tokens, as { primary: '#2563eb' }` |
| A token not `camelCase` | `build: preset a: the theme token color.text-muted is not camelCase, as textMuted` |
| A token that is empty or not a string | `build: preset a: the theme token color.primary must be a CSS value, as '#2563eb'` |
| A token holding what one CSS value never needs | `build: preset a: the theme token color.primary holds what one CSS value never needs — ;, a brace, a backslash, <, >, @, a double quote, url(), a comment, a line break or an unbalanced quote` |

The application's own components are checked the same way, named by their
folder as the config names it — `components/` by default, `parts/` with
`components: 'parts'`:
`build: components/: the component Button.vue would replace Maizzle's <Button> — give it a name of its own`.

Three of these are also compile errors — a preset function passed uncalled, a
preset without a `name`, a token that is not a string — counted in the
[README](../../README.md#type-safety-counted).

A component used in a template that no preset and no file provides — a typo,
`<Buton>` — fails the build with `TEMPLATE_INVALID`, as in
[Templates](templates.md#components). Every message, with its fix, is in
[Troubleshooting](../troubleshooting.md).

## See also

- [Building](building.md) — the rest of the config, and `compileMail` with
  `components` and `theme`.
- [Templates](templates.md) — what a template, and so a component, may hold.
- [Catalogues](catalogues.md) — how a preset's messages merge with yours.
