# Troubleshooting `@nxgt/mail-ui`

Each entry is headed by the message you see. The last section holds the traps
that fail no build — a build that succeeds and is wrong. Search this page for
the words of your message.

How the messages are shaped:

- **A wiring mistake is a `TypeError` starting `ui:`**, thrown by the `ui()`
  call in `maizzle.config.ts` when the config loads, so `maizzle build` and
  `maizzle serve` stop before any template is built. Fix the call. One
  failure at that moment is a plain `Error` instead, since no option causes
  it: `ui: @maizzle/framework is not installed beside @nxgt/mail-ui`.
- **A build failure is a plain `Error`**, thrown while `maizzle build` renders
  a template, and printed after Vue's own
  `[Vue warn]: Unhandled error during execution of setup function`. It names
  the component and what to fix. It has no `code`: it is a mistake in the
  config, not a condition to catch.
- **A message never holds a value you passed**: it names the option or the
  token, never the URL or the colour.

The samples below use the locales `en` and `fr`, the template
`emails/welcome.vue`, and the brand `Acme`.

## Index

**Wiring** — when `maizzle.config.ts` loads
- [`ui: options must be an object, as { brand: { name: 'Acme' } }`](#ui-options-must-be-an-object-as--brand--name-acme--)
- [`ui: brand must be an object, as { name: 'Acme', url: 'https://acme.example' }`](#ui-brand-must-be-an-object-as--name-acme-url-httpsacmeexample-)
- [`ui: brand.name must be the name the e-mails show`](#ui-brandname-must-be-the-name-the-e-mails-show)
- [`ui: brand.url must be an absolute http(s) URL`](#ui-brandurl-must-be-an-absolute-https-url)
- [`ui: brand.logo.src must be an absolute http(s) URL — a mail client loads nothing relative`](#ui-brandlogosrc-must-be-an-absolute-https-url--a-mail-client-loads-nothing-relative)
- [`ui: brand.logo.width must be a width in pixels`](#ui-brandlogowidth-must-be-a-width-in-pixels)
- [`ui: brand.logo.alt must be a string`](#ui-brandlogoalt-must-be-a-string)
- [`ui: theme must be an object of tokens, as { 'color-primary': '#0f766e' }`](#ui-theme-must-be-an-object-of-tokens-as--color-primary-0f766e-)
- [`ui: theme.--color-primary is not a token of the theme — name one of theme.css without its --, as color-primary`](#ui-theme--color-primary-is-not-a-token-of-the-theme--name-one-of-themecss-without-its----as-color-primary)
- [`ui: theme.color-primary must be a CSS value, as #0f766e or 8px`](#ui-themecolor-primary-must-be-a-css-value-as-0f766e-or-8px)
- [`ui: @maizzle/framework is not installed beside @nxgt/mail-ui`](#ui-maizzleframework-is-not-installed-beside-nxgtmail-ui)

**Build** — while `maizzle build` renders
- [`[Vue warn]: Failed to resolve component: NxLayout`](#vue-warn-failed-to-resolve-component-nxlayout)
- [`NxLayout: ui() is not in the plugins of defineMailConfig`](#nxlayout-ui-is-not-in-the-plugins-of-definemailconfig)
- [`i18n: en: welcome calls t('common.footer.why'), which is not a key of the catalogues`](#i18n-en-welcome-calls-tcommonfooterwhy-which-is-not-a-key-of-the-catalogues)

**Traps: a build that succeeds and is wrong**
- [A tint written with an alpha (`bg-primary/15`) is missing in Outlook](#a-tint-written-with-an-alpha-bg-primary15-is-missing-in-outlook)
- [A side border (`border-b`) is gone, and the style ends with `border: 0`](#a-side-border-border-b-is-gone-and-the-style-ends-with-border-0)
- [A project's own component does not replace the package's](#a-projects-own-component-does-not-replace-the-packages)
- [An element placed directly in `NxCard` breaks the card](#an-element-placed-directly-in-nxcard-breaks-the-card)
- [`class="mb-0"` leaves the space under an `NxAlert`, `NxBanner`, `NxCard` or `NxCode`](#classmb-0-leaves-the-space-under-an-nxalert-nxbanner-nxcard-or-nxcode)
- [The editor says `Property 'brand' does not exist` in a template](#the-editor-says-property-brand-does-not-exist-in-a-template)
- [Biome reports `parse` errors in a template as soon as you edit it](#biome-reports-parse-errors-in-a-template-as-soon-as-you-edit-it)
- [A bug in `@nxgt/mail-ui` itself](#a-bug-in-nxgtmail-ui-itself)

---

## Wiring

### `ui: options must be an object, as { brand: { name: 'Acme' } }`

**When:** loading `maizzle.config.ts`, when `ui` is called with nothing, or
with the brand's name alone: `ui()`, `ui('Acme')`.
**Why:** `ui` takes one object of options; `brand` is the one it requires,
because the layout's header and footer show it.
**Fix:**

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { ui } from '@nxgt/mail-ui';

export default defineMailConfig({
  plugins: [ui({ brand: { name: 'Acme' } })],   // not ui('Acme')
});
```

### `ui: brand must be an object, as { name: 'Acme', url: 'https://acme.example' }`

**When:** loading `maizzle.config.ts`, when `brand` is missing, or is the
name alone: `ui({})`, `ui({ brand: 'Acme' })`.
**Why:** the brand is a name, and optionally a link and a logo; it is an
object so that the last two can be added.
**Fix:**

```ts
ui({ brand: { name: 'Acme', url: 'https://acme.example' } });
```

### `ui: brand.name must be the name the e-mails show`

**When:** loading `maizzle.config.ts`, when `brand.name` is missing, not a
string, or blank — often an environment variable that is not set:
`{ name: process.env.BRAND_NAME }`.
**Why:** the header shows the name when there is no logo, and the footer
always does; a blank name would leave both empty.
**Fix:**

```ts
ui({ brand: { name: 'Acme' } });
```

### `ui: brand.url must be an absolute http(s) URL`

**When:** loading `maizzle.config.ts`, when `brand.url` is set to a relative
path (`/home`), a bare domain (`acme.example`), another scheme, or a string
with a space in it.
**Why:** the header and the footer link to it, and a mail client has no page
to resolve a relative link against.
**Fix:**

```ts
ui({ brand: { name: 'Acme', url: 'https://acme.example' } });
```

Leave `url` out for a header and a footer without a link.

### `ui: brand.logo.src must be an absolute http(s) URL — a mail client loads nothing relative`

**When:** loading `maizzle.config.ts`, when `brand.logo` is set and its `src`
is missing, relative (`/logo.png`, `images/logo.png`), or not a string — or
when `logo` is the URL alone: `logo: 'https://…'`.
**Why:** the image is loaded by the mail client, from wherever the e-mail is
read; only an absolute URL points somewhere from there.
**Fix:**

```ts
ui({
  brand: {
    name: 'Acme',
    logo: { src: 'https://acme.example/logo.png', width: 96 },   // not logo: '…'
  },
});
```

Host the image where the recipients can reach it; `public/` in the project is
served by `maizzle serve`, not by the mail client.

### `ui: brand.logo.width must be a width in pixels`

**When:** loading `maizzle.config.ts`, when `brand.logo.width` is a string
(`'96px'`, `'100%'`), zero, negative, or not a whole number.
**Why:** it is written as the image's `width` attribute, which a mail client
reads as a whole number of pixels.
**Fix:**

```ts
logo: { src: 'https://acme.example/logo.png', width: 96 }
```

Leave `width` out for the default, `120`.

### `ui: brand.logo.alt must be a string`

**When:** loading `maizzle.config.ts`, when `brand.logo.alt` is set to
something else than a string, such as `null` or `false`.
**Why:** it is written as the image's `alt`, the text shown while images are
blocked.
**Fix:**

```ts
logo: { src: 'https://acme.example/logo.png', alt: 'Acme' }
```

Leave `alt` out to use the brand's name.

### `ui: theme must be an object of tokens, as { 'color-primary': '#0f766e' }`

**When:** loading `maizzle.config.ts`, when `theme` is a list, a string (the
path to a CSS file), or `null`.
**Why:** `theme` overrides tokens of the package's theme one by one, by
name; it is not a replacement stylesheet.
**Fix:**

```ts
ui({
  brand: { name: 'Acme' },
  theme: { 'color-primary': '#0f766e', 'radius-lg': '4px' },
});
```

Leave `theme` out for the package's theme as it is.

### `ui: theme.--color-primary is not a token of the theme — name one of theme.css without its --, as color-primary`

The message names the token you passed.

**When:** loading `maizzle.config.ts`, for a token written as CSS writes it
(`'--color-primary'`), in camelCase (`colorPrimary`), misspelt
(`color-primery`), or not declared by the theme (`color-brand`).
**Why:** `theme` only overrides the tokens `@nxgt/mail-ui/theme.css`
declares, named without their `--`; a token it does not declare would style
nothing, so it is refused rather than ignored.
**Fix:**

```ts
theme: { 'color-primary': '#0f766e' }   // not '--color-primary'
```

The tokens are the `--…` lines of `node_modules/@nxgt/mail-ui/theme.css`:
colours (`color-primary`, `color-error`, …) and radii (`radius-sm` to
`radius-xl`). A colour's tints (`color-primary-15`, …) follow it when you
override the colour; a tint can also be overridden alone.

### `ui: theme.color-primary must be a CSS value, as #0f766e or 8px`

The message names the token you passed.

**When:** loading `maizzle.config.ts`, when a token's value is not a string
(`'radius-lg': 4`), is empty, or holds a `;`, a brace, an angle bracket, a
quote, a backslash, a CSS comment or a line break — `'#0f766e; color: red'`,
`"'#0f766e' /* brand */"`.
**Why:** each value is written into one CSS declaration; anything that could
end it or open another is refused.
**Fix:**

```ts
theme: { 'color-primary': '#0f766e', 'radius-lg': '4px' }   // not 4
```

### `ui: @maizzle/framework is not installed beside @nxgt/mail-ui`

This one is a plain `Error`, not a `TypeError`: the call is right, the
install is not.

**When:** loading `maizzle.config.ts`, when `ui()` finds no
`@maizzle/framework` in any `node_modules` folder above the one it is
installed in. It happens when `@maizzle/framework` is not a dependency of the
project, or when `@nxgt/mail-ui` is linked from a folder outside the project
(`bun link`, a `file:` or `link:` dependency).
**Why:** `ui()` resolves the tags of templates and components installed from
npm itself, with Maizzle's built-in components (`<Container>`, `<Spacer>`,
…) as the last choice. It finds them where Node would find the package, up
from its own folder. `@maizzle/framework` is a required peer.
**Fix:** install Maizzle in the project, beside `@nxgt/mail-ui`, and install
the package from the registry rather than linking it:

```sh
bun add @nxgt/mail-ui @maizzle/framework
```

---

## Build

These fail while `maizzle build` renders a template: the build stops, and the
line to read starts `Error:`, after Vue's warning and a stack trace.

### `[Vue warn]: Failed to resolve component: NxLayout`

One such warning for each tag that did not resolve: `NxTypography`,
`NxButton`, …

**When:** `maizzle build`, when `ui()` is not in the plugins. What follows
depends on the template: `TypeError: Cannot read properties of undefined
(reading 'name')` when it reads `brand.name`; with `@nxgt/mail-i18n`,
`i18n: en/welcome.html is empty — a tag of its template resolved to no
component; list the plugin that brings it, as ui()` after the build; without
it, nothing. The build then succeeds, and the built e-mail holds its doctype
and nothing else.
**Why:** Vue renders a component it cannot resolve as nothing. Maizzle
resolves the tags of the project's own templates from its `components`
folders, but skips every file under `node_modules`: the package's components,
and templates installed from npm such as `@nxgt/mail-presets`'s. `ui()`
resolves the tags of those files: the project's `components/` first, then
the `Nx*` components, then Maizzle's built-ins.
**Fix:** list `ui()`, rather than registering `COMPONENTS_DIR` in
`components.source`:

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { ui } from '@nxgt/mail-ui';

export default defineMailConfig({
  plugins: [ui({ brand: { name: 'Acme' } })],
});
```

A template installed from another package, which uses a component that is
neither the project's, nor an `Nx*` component, nor one of Maizzle's, is left
unresolved: that package's plugin must resolve it.

### `NxLayout: ui() is not in the plugins of defineMailConfig`

**When:** `maizzle build`, on the first template that uses `<NxLayout>`, when
the project registers the package's components itself — `COMPONENTS_DIR` in
`components.source` — without calling `ui()`.
**Why:** the layout reads the brand and the theme that `ui()` provides.
Registering the folder makes `<NxLayout>` resolve, but provides neither.
**Fix:** register the components through `ui()`, which does both:

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { ui } from '@nxgt/mail-ui';

export default defineMailConfig({
  plugins: [ui({ brand: { name: 'Acme' } })],
  // no components.source pointing at COMPONENTS_DIR
});
```

### `i18n: en: welcome calls t('common.footer.why'), which is not a key of the catalogues`

The message names your locale and template; the key starts `common.`.

**When:** `maizzle build`, on the first template that uses `<NxLayout>` (its
footer calls `t('common.footer.why')`), or that calls `t('common.greeting')`
or another `common.` key, when `@nxgt/mail-i18n` is in the plugins without
the package's messages.
**Why:** the `common.*` messages ship in `uiCatalogues`, not in the
project's `locales/`. The i18n plugin only knows them when they are passed
to it.
**Fix:**

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui, uiCatalogues } from '@nxgt/mail-ui';

export default defineMailConfig({
  plugins: [
    ui({ brand: { name: 'Acme' } }),
    i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] }),
  ],
});
```

`uiCatalogues` holds `en` and `fr`. A project in another locale writes the
`common` keys in its own `locales/<locale>.json`; a key there overrides the
package's, key by key.

---

## Traps: a build that succeeds and is wrong

### A tint written with an alpha (`bg-primary/15`) is missing in Outlook

**When:** `maizzle build` succeeds, and an element written with a colour and
an opacity — `bg-primary/15`, `border-error/50` — has
`background-color: rgba(72, 80, 150, .15)` in its style. Outlook on Windows
shows no background there.
**Why:** Outlook drops a colour with an alpha. And Maizzle rewrites the class
`bg-primary/15` to `bg-primary-15` in the HTML, so in the same template the
`rgba()` also lands on elements written with the package's `bg-primary-15`.
**Fix:** write the theme's tint, which is the same colour mixed over the
background into a plain hex value:

```vue
<td class="bg-primary-15">…</td>   <!-- not bg-primary/15 -->
```

Each colour of the theme (`primary`, `secondary`, `info`, `success`,
`warning`, `error`, `foreground`) has the tints `-5`, `-10`, `-15`, `-40` and
`-50`, for `bg-`, `text-` and `border-`.

### A side border (`border-b`) is gone, and the style ends with `border: 0`

**When:** `maizzle build` succeeds, and an element written as
`border-0 border-b border-solid border-primary-40` has no bottom border; its
style reads `border-bottom-style: solid; border-bottom-width: 1px; border: 0 solid #b6b9d5`.
**Why:** Maizzle merges the width, style and colour into one `border`
shorthand and writes it after the per-side declarations, so `border: 0` wins
over `border-bottom-width`. Without `border-0`, `border-solid` would draw the
other three sides at the default width instead.
**Fix:** leave out `border-0` and `border-solid`, and set the style of that
side only:

```vue
<td class="border-b [border-bottom-style:solid] border-primary-40">…</td>
```

The style comes out as `border-bottom: 1px solid; border-color: …`, and the
other sides have none. `NxSummaryData` draws its rows this way.

### A project's own component does not replace the package's

**When:** `maizzle build` succeeds, and a template still renders the
package's `<NxBadge>` although the project has its own badge component.
**Why:** a project replaces a component by name: its file must be named as
the component, `Nx` prefix included, in the project's `components/` folder
(under `root`, when the config sets one), in kebab case or in Pascal case.
`components/badge.vue` is a different component, `<Badge>`.
**Fix:**

```
components/nx-badge.vue    → replaces <NxBadge> in every template
components/NxBadge.vue     → the same
```

The package's components carry the `Nx` prefix so that Maizzle's own
(`<Button>`, …) stay available; the project's override keeps it.

### An element placed directly in `NxCard` breaks the card

**When:** `<NxCard>` holds something other than its parts —
`<NxCard><p>Text</p></NxCard>`. The built HTML has the `<p>` straight inside
a `<table>`, which clients render out of place or drop.
**Why:** the card's body is a `<table>` of rows; each part (`NxCardHeader`,
`NxCardContent`, `NxCardFooter`) is one `<tr>`.
**Fix:** put the content in a part:

```vue
<NxCard>
  <NxCardContent><NxTypography>Text</NxTypography></NxCardContent>
</NxCard>
```

### `class="mb-0"` leaves the space under an `NxAlert`, `NxBanner`, `NxCard` or `NxCode`

**When:** `<NxAlert class="mb-0">` still has 16px below it.
**Why:** these components put their `class` on the box inside, where it
styles the box; the space below is on the table around it.
**Fix:** replace the component with your own, copied from the package's, and
change its outer `mb-4` — see
[Replacing a component](guide/plugin.md#replacing-a-component). On
`NxTypography` and `NxSummaryData`, `class="mb-0"` works.

### The editor says `Property 'brand' does not exist` in a template

`Property 'brand' does not exist on type 'ComponentPublicInstance<…>'`, in
the editor or in `vue-tsc`. The build is not affected: `brand` is there when
Maizzle renders.

**When:** editing a template, in an editor with Vue's language tools, or in
`vue-tsc`.
**Why:** the type of `brand` reaches the templates through
`.maizzle/nxgt-mail-ui.d.ts`, which `ui()` writes each time the config loads.
Either it has not been written yet — a fresh clone, before any
`maizzle prepare`, `serve` or `build` — or your `tsconfig.json` does not
include `.maizzle/*.d.ts`. A project that sets Maizzle's `root`, or a Laravel
project, has its `.maizzle/` elsewhere: include that one.
**Fix:** keep the starter's include and write the file once:

```json
{ "include": ["**/*.vue", ".maizzle/*.d.ts"] }
```

```sh
bunx maizzle prepare
```

See [Typed in the editor and in CI](guide/plugin.md#typed-in-the-editor-and-in-ci).

### Biome reports `parse` errors in a template as soon as you edit it

`Expected a property, a shorthand property, a getter, a setter, or a method but
instead found '{ t('welcome.title')'`, `type assertion are a TypeScript
only feature`, or `This class property name should be in camelCase` on a
component's tag — in the editor only; `biome check` reports nothing.

**When:** typing in a template that has no `<script>`, with Biome 2.5 as the
editor's linter.
**Why:** Biome's language server reads only the `<script>` of a `.vue` file
when it opens it, but re-reads a file without one as JavaScript from the first
change on. The template is fine; the editor's Biome is not reading it as Vue.
**Fix:** let Biome parse Vue templates — add this key to your existing
`biome.json` — then run **Biome: Restart** in the editor:

```json
{ "html": { "experimentalFullSupportEnabled": true } }
```

Biome then lints the templates too. A rule that cannot see a slot's text,
such as `useAnchorContent` on `<a><slot /></a>`, is silenced on its element:

```vue
<!-- biome-ignore lint/a11y/useAnchorContent: the link's text is the slot. -->
<a :href="href"><slot /></a>
```

### A bug in `@nxgt/mail-ui` itself

A component that renders differently from what its props ask for, a colour
left as `oklch()`, `var(--…)` or `color-mix()` in the built HTML, or a theme
override that does not reach the tints of its colour, is a bug in this
package. Open an issue on
[`softistx/nxgt-mail`](https://github.com/softistx/nxgt-mail/issues) with the
message or the built HTML, the package version, the Maizzle version, and the
smallest template that reproduces it — never a real address or link.
