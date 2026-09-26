# Troubleshooting `@nxgt/mail-config`

Each entry is headed by the text you see: a compiler error or a message. The
last section holds the traps that print nothing — a build that succeeds and
is wrong. Search this page for the words of your message.

How the messages are shaped:

- **Every message starts with the call you wrote**: `defineMailConfig: …`,
  `defineMailPlugin: …` or `productionConfig: …`. A plugin checked by
  `defineMailPlugin` is refused with its own messages, when the module that
  defines it loads.
- **Every refusal is a `TypeError`**, thrown when `maizzle.config.ts` (or the
  production config) is loaded: `maizzle build` and `maizzle serve` stop
  before any template is read. It is a wiring mistake; fix the config.
- **A plugin is named by its `name`** when it has one — otherwise by its
  position in `plugins` (`plugins[1]`) from `defineMailConfig`, or as `plugin`
  from `defineMailPlugin`.

## Index

**Install and types**
- [Which `moduleResolution` is supported](#install-and-types)

**Configuration**
- [`defineMailConfig: config must be an object, as { plugins, ...maizzleConfig }`](#definemailconfig-config-must-be-an-object-as--plugins-maizzleconfig-)
- [`defineMailConfig: plugins must be an array`](#definemailconfig-plugins-must-be-an-array)
- [`defineMailConfig: plugins[0] must be a plugin object, as { name, ...config } — was it called?`](#definemailconfig-plugins0-must-be-a-plugin-object-as--name-config---was-it-called)
- [`defineMailConfig: plugins[1] has no name — a plugin is { name, ...config }`](#definemailconfig-plugins1-has-no-name--a-plugin-is--name-config-)
- [`defineMailConfig: plugin "brand" lists plugins — a plugin cannot bring others; list them in the project`](#definemailconfig-plugin-brand-lists-plugins--a-plugin-cannot-bring-others-list-them-in-the-project)
- [`defineMailConfig: two plugins are named "brand" — is one listed twice?`](#definemailconfig-two-plugins-are-named-brand--is-one-listed-twice)
- [`defineMailConfig: plugin "brand": afterBuild must be a function`](#definemailconfig-plugin-brand-afterbuild-must-be-a-function)
- [`defineMailConfig: beforeRender must be a function`](#definemailconfig-beforerender-must-be-a-function)
- [`defineMailPlugin: plugin must be a plugin object, as { name, ...config } — was it called?`](#definemailplugin-plugin-must-be-a-plugin-object-as--name-config---was-it-called)
- [`defineMailPlugin: plugin has no name — a plugin is { name, ...config }`](#definemailplugin-plugin-has-no-name--a-plugin-is--name-config-)
- [`defineMailPlugin: plugin "brand" lists plugins — a plugin cannot bring others; list them in the project`](#definemailplugin-plugin-brand-lists-plugins--a-plugin-cannot-bring-others-list-them-in-the-project)
- [`defineMailPlugin: plugin "brand": beforeRender must be a function`](#definemailplugin-plugin-brand-beforerender-must-be-a-function)
- [`productionConfig: config must be the project config, as productionConfig(config, overrides)`](#productionconfig-config-must-be-the-project-config-as-productionconfigconfig-overrides)
- [`productionConfig: config lists plugins — pass what defineMailConfig answered, not its argument`](#productionconfig-config-lists-plugins--pass-what-definemailconfig-answered-not-its-argument)
- [`productionConfig: overrides must be an object`](#productionconfig-overrides-must-be-an-object)
- [`productionConfig: overrides list plugins — list every plugin in the project config`](#productionconfig-overrides-list-plugins--list-every-plugin-in-the-project-config)
- [`productionConfig: afterBuild must be a function`](#productionconfig-afterbuild-must-be-a-function)

**Traps that print nothing**
- [No Tailwind utility in the built HTML](#no-tailwind-utility-in-the-built-html)
- [A plugin's `content` (or another list) disappears](#a-plugins-content-or-another-list-disappears)
- [`maizzle build -c maizzle.config.production.ts` ignores `maizzle.config.ts`](#maizzle-build--c-maizzleconfigproductionts-ignores-maizzleconfigts)
- [A hook's change is lost](#a-hooks-change-is-lost)
- [A plugin's component tag stays in the HTML, unresolved](#a-plugins-component-tag-stays-in-the-html-unresolved)
- [One of two configs' hooks never runs](#one-of-two-configs-hooks-never-runs)
- [A bug in `@nxgt/mail-config` itself](#a-bug-in-nxgtmail-config-itself)

---

## Install and types

Resolve as a bundler does (`"moduleResolution": "bundler"`, as Maizzle's jiti
loader does): that is the supported contract. `nodenext` and `node16` are out
of contract — they may work today, and are not tested.

---

## Configuration

### `defineMailConfig: config must be an object, as { plugins, ...maizzleConfig }`

**When:** loading `maizzle.config.ts`, when `defineMailConfig` is given
`null`, an array, or a function.
**Why:** `defineMailConfig` takes one object: your Maizzle config, with the
plugins in its `plugins` key. It does not take the plugins as its argument.
**Fix:**

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { brand } from './brand';

export default defineMailConfig({
  plugins: [brand],
  output: { path: 'dist' },
});
```

`defineMailConfig()` with no argument is valid: the base config alone.

### `defineMailConfig: plugins must be an array`

**When:** loading `maizzle.config.ts`, with `plugins` set to one plugin, or to
an object of plugins.
**Why:** plugins are layered in the order they are listed; only an array has
one.
**Fix:**

```ts
export default defineMailConfig({ plugins: [brand] }); // not plugins: brand
```

### `defineMailConfig: plugins[0] must be a plugin object, as { name, ...config } — was it called?`

The index is the position of the plugin in your `plugins` array.

**When:** loading `maizzle.config.ts`, when an entry of `plugins` is not a
plain object: most often a plugin factory listed without calling it, or a
`false` left by a condition.
**Why:** a plugin is an object — a partial Maizzle config with a `name`. A
package usually exports a function that answers one, and the function itself
is not a plugin.
**Fix:** call the factory, and filter a conditional plugin out rather than
leaving `false` in the list:

```ts
import { defineMailConfig } from '@nxgt/mail-config';
import { footer } from './footer';
import { preview } from './preview';

export default defineMailConfig({
  plugins: [
    footer(),                                         // not footer
    ...(process.env.PREVIEW ? [preview()] : []),      // not PREVIEW && preview()
  ],
});
```

### `defineMailConfig: plugins[1] has no name — a plugin is { name, ...config }`

The index is the position of the plugin in your `plugins` array.

**When:** loading `maizzle.config.ts`, for a plugin whose `name` is missing,
not a string, or blank.
**Why:** the name tells two plugins apart, and names the plugin in every
other message. A plain Maizzle config object listed as a plugin has none.
**Fix:**

```ts
// brand.ts
import { defineMailPlugin } from '@nxgt/mail-config';

export const brand = defineMailPlugin({
  name: 'brand',
  css: { inline: true },
});
```

### `defineMailConfig: plugin "brand" lists plugins — a plugin cannot bring others; list them in the project`

**When:** loading `maizzle.config.ts`, for a plugin that has a `plugins` key.
`tsc` refuses it first when the plugin is typed `MailPlugin`.
**Why:** plugins are layered once, in the order the project lists them. A
plugin that carried others would hide them from that order, and from the
check for two plugins of the same name.
**Fix:** export the plugins side by side, and list each one in the project:

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { brand, footer } from './plugins';

export default defineMailConfig({ plugins: [brand, footer] });
```

### `defineMailConfig: two plugins are named "brand" — is one listed twice?`

**When:** loading `maizzle.config.ts`, when two entries of `plugins` carry
the same `name`.
**Why:** the same plugin listed twice would run each of its hooks twice. Two
different plugins with the same name could not be told apart in a message.
**Fix:** list each plugin once. To change a plugin's settings, set the key in
your own config — the project is layered over every plugin — rather than
listing the plugin again:

```ts
export default defineMailConfig({
  plugins: [brand],
  css: { inline: false },   // wins over what brand sets
});
```

Two different plugins of the same name need one of them renamed where it is
defined.

### `defineMailConfig: plugin "brand": afterBuild must be a function`

The event is the one that is wrong: `beforeCreate`, `beforeRender`,
`afterRender`, `afterTransform` or `afterBuild`.

**When:** loading `maizzle.config.ts`, for a plugin whose build event is set to
something other than a function.
**Why:** each build event is one function, which `defineMailConfig` chains
with the other layers'. An array of handlers, a string, or the result of
calling the handler (`afterBuild: done()`) cannot be chained.
**Fix:** hand the function itself; to run two things on one event, call both
from one function:

```ts
import { defineMailPlugin } from '@nxgt/mail-config';
import { report } from './report';
import { upload } from './upload';

export const brand = defineMailPlugin({
  name: 'brand',
  afterBuild: async (params) => {
    await report(params);
    await upload(params);
  },
});
```

### `defineMailConfig: beforeRender must be a function`

**When:** loading `maizzle.config.ts`, when your own config — not a plugin —
sets a build event to something other than a function.
**Why and fix:** as in the entry above; the message has no plugin name
because the value is in the project's own keys.

### `defineMailPlugin: plugin must be a plugin object, as { name, ...config } — was it called?`

**When:** importing the module that calls `defineMailPlugin`, when its
argument is not a plain object — `null`, an array, or a function.
**Why:** `defineMailPlugin` takes the plugin itself, `{ name, ...config }`,
and answers it unchanged. It is not a factory, and does not take one.
**Fix:** pass the object; to take options, wrap the call in your own
function:

```ts
import { defineMailPlugin } from '@nxgt/mail-config';

export const brand = (company: string) =>
  defineMailPlugin({ name: 'brand', vue: { globalProperties: { company } } });
```

### `defineMailPlugin: plugin has no name — a plugin is { name, ...config }`

**When:** importing the module that calls `defineMailPlugin`, for a plugin
whose `name` is missing, not a string, or blank.
**Why and fix:** as for
[`plugins[1] has no name`](#definemailconfig-plugins1-has-no-name--a-plugin-is--name-config-):
give the plugin a `name`.

### `defineMailPlugin: plugin "brand" lists plugins — a plugin cannot bring others; list them in the project`

**When:** importing the module that calls `defineMailPlugin`, for a plugin
with a `plugins` key. `tsc` refuses it first: `MailPlugin` declares
`plugins?: never`.
**Why and fix:** as for
[the same message from `defineMailConfig`](#definemailconfig-plugin-brand-lists-plugins--a-plugin-cannot-bring-others-list-them-in-the-project):
export the plugins side by side, and let the project list each one.

### `defineMailPlugin: plugin "brand": beforeRender must be a function`

The event is the one that is wrong: `beforeCreate`, `beforeRender`,
`afterRender`, `afterTransform` or `afterBuild`.

**When:** importing the module that calls `defineMailPlugin`, for a plugin
whose build event is set to something other than a function.
**Why and fix:** as for
[the same message from `defineMailConfig`](#definemailconfig-plugin-brand-afterbuild-must-be-a-function):
hand the function itself.

### `productionConfig: config must be the project config, as productionConfig(config, overrides)`

**When:** `maizzle build -c maizzle.config.production.ts`, when the first
argument of `productionConfig` is not an object: typically `undefined`,
because the import of the project config did not pick up its default export.
**Why:** `productionConfig` layers the production settings over the project
config, and needs it as its first argument. It does not take the overrides
alone.
**Fix:**

```ts
// maizzle.config.production.ts
import { productionConfig } from '@nxgt/mail-config';
import config from './maizzle.config';     // the default export

export default productionConfig(config, { output: { path: 'dist-production' } });
```

### `productionConfig: config lists plugins — pass what defineMailConfig answered, not its argument`

**When:** `maizzle build -c maizzle.config.production.ts`, when the config
handed to `productionConfig` still has a `plugins` key.
**Why:** `productionConfig` does not layer plugins; it expects the config
`defineMailConfig` already answered, plugins merged and hooks chained. An
object with `plugins` in it is `defineMailConfig`'s argument, exported or
imported before the call.
**Fix:** export what `defineMailConfig` answers, and import that:

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { brand } from './brand';

export default defineMailConfig({ plugins: [brand] });   // not export default { plugins: [brand] }
```

### `productionConfig: overrides must be an object`

**When:** `maizzle build -c maizzle.config.production.ts`, when the second
argument of `productionConfig` is not a plain object: an array, `null`, or a
function.
**Why:** the overrides are one partial Maizzle config, layered last.
**Fix:**

```ts
export default productionConfig(config, { output: { path: 'dist-production' } });
```

Leave the second argument out when there is nothing to override.

### `productionConfig: overrides list plugins — list every plugin in the project config`

**When:** `maizzle build -c maizzle.config.production.ts`, when the second
argument of `productionConfig` has a `plugins` key. `tsc` refuses it first.
**Why:** plugins are layered once, by `defineMailConfig`, in the order the
project lists them. The overrides are layered over that result, as one more
plugin would be — they cannot carry plugins of their own.
**Fix:** list the plugin in `maizzle.config.ts`. What only production needs
goes in the overrides as plain config keys: their `components.source`,
`vite.plugins` and `vue.plugins` are added to the project's, and their build
events run after the project's.

```ts
// maizzle.config.production.ts
import { productionConfig } from '@nxgt/mail-config';
import config from './maizzle.config';

export default productionConfig(config, {
  output: { path: 'dist-production' },
  afterBuild: async ({ files }) => {
    console.log(`${files.length} files built for production`);
  },
});
```

### `productionConfig: afterBuild must be a function`

The event is the one that is wrong: `beforeCreate`, `beforeRender`,
`afterRender`, `afterTransform` or `afterBuild`.

**When:** `maizzle build -c maizzle.config.production.ts`, when an override
sets a build event to something other than a function.
**Why:** an override's hook is chained after the project's, and must be a
function, as in a plugin.
**Fix:**

```ts
export default productionConfig(config, {
  afterBuild: async ({ files }) => {
    console.log(`${files.length} files built`);
  },
});
```

---

## Traps that print nothing

### No Tailwind utility in the built HTML

**When:** `maizzle build` or `maizzle serve` succeeds, but the classes stay
in the HTML (`class="p-4"`) with no CSS behind them, and nothing is inlined.
Typically under Bun workspaces or pnpm.
**Why:** those package managers install in isolation: a peer that your
project does not list itself is not linked where Maizzle's Tailwind looks for
it. The `@import "@maizzle/tailwindcss"` in the layout then fails silently,
and no utility is generated.
**Fix:** make `@maizzle/tailwindcss` a direct dependency of the project,
next to `@maizzle/framework`:

```sh
bun add @nxgt/mail-config @maizzle/framework @maizzle/tailwindcss
```

If it is installed and there are still no utilities, check the layout: the
`@import "@maizzle/tailwindcss"` must be a literal import in the same
`<style>` as your theme, or Maizzle scans no source.

### A plugin's `content` (or another list) disappears

**When:** `maizzle build` succeeds, but templates, static files or watched
paths a plugin set are missing — right after the project set the same key.
**Why:** configs merge as Maizzle merges them: objects key by key, but **an
array replaces** the array under it. Your `content`, `static.source` or
`server.watch` replaces the plugin's, and Maizzle's default too. Only three
lists are joined across layers: `components.source`, `vite.plugins` and
`vue.plugins`.
**Fix:** leave the key to the plugin, or repeat the entries you keep in your
own list:

```ts
import { defineMailConfig } from '@nxgt/mail-config';
import { brand } from './brand';

export default defineMailConfig({
  plugins: [brand],
  content: [...(brand.content ?? []), 'emails/**/*.{vue,md}', 'drafts/**/*.vue'],
});
```

### `maizzle build -c maizzle.config.production.ts` ignores `maizzle.config.ts`

**When:** the production build runs without your plugins, your components or
your hooks — the output looks like a bare Maizzle project.
**Why:** Maizzle has no environments. `-c` loads the file it is given and
**only** that file; nothing is merged from `maizzle.config.ts`.
**Fix:** import the project config in the production file, and layer over it
with `productionConfig`, which also minifies the HTML:

```ts
// maizzle.config.production.ts
import { productionConfig } from '@nxgt/mail-config';
import config from './maizzle.config';

export default productionConfig(config, { output: { path: 'dist-production' } });
```

### A hook's change is lost

**When:** a `beforeRender`, `afterRender` or `afterTransform` hook runs, but
the next hook — and the built file — does not see what it did.
**Why:** hooks are chained as Maizzle chains its own: **only a string
returned** replaces `template.source` (for `beforeRender`) or the `html` the
next hook receives. `undefined` means "leave it as is"; any other value — an
object such as `{ html }`, a `Buffer` — is ignored the same way. Reassigning
`params.html` changes nothing either: each hook receives its own `html`.
`beforeCreate` and `afterBuild` answer nothing; `beforeCreate` changes
`config` in place.
**Fix:** return the string:

```ts
import { defineMailPlugin } from '@nxgt/mail-config';
import posthtml from 'posthtml';

export const tidy = defineMailPlugin({
  name: 'tidy',
  afterTransform: async ({ html }) => {
    const result = await posthtml([]).process(html);
    return result.html;                        // not return result
  },
});
```

### A plugin's component tag stays in the HTML, unresolved

**When:** `maizzle build` succeeds, but a plugin's component — say
`<BrandFooter>` — is not rendered: the tag is left unresolved in the built
HTML.
**Why:** the plugin set `components.source` to a relative path
(`'./components'`). Maizzle resolves a relative `components.source` against
the directory `maizzle` runs in — the project — not against the plugin's
file, so it looks for the folder in the wrong place and finds no component.
**Fix:** make the path absolute, relative to the plugin's own file:

```ts
import { fileURLToPath } from 'node:url';
import { defineMailPlugin } from '@nxgt/mail-config';

export const brand = defineMailPlugin({
  name: 'brand',
  components: {
    source: [{ path: fileURLToPath(new URL('./components', import.meta.url)), prefix: 'Brand' }],
  },
});
```

When the plugin is compiled to `dist/`, point the URL at where the folder sits
from the built file (`'../components'`), and ship the folder in `files`.

### One of two configs' hooks never runs

**When:** the build succeeds, but a `beforeRender` (or any other build event)
from one of two configs you combined has no effect.
**Why:** spreading configs yourself — `{ ...a, ...b }` — keeps one value per
key: `b.beforeRender` replaces `a.beforeRender`, without a word. Nested
objects are replaced the same way (`b.css` drops every key of `a.css`).
**Fix:** give each config a `name` and list both as plugins; their hooks are
chained, in order, and their objects merged:

```ts
import { defineMailConfig } from '@nxgt/mail-config';
import { a, b } from './configs';

// not: export default defineMailConfig({ ...a, ...b });
export default defineMailConfig({
  plugins: [
    { name: 'a', ...a },
    { name: 'b', ...b },
  ],
});
```

### A bug in `@nxgt/mail-config` itself

A refusal of a config this page says is valid, or two plugins' hooks that do
not both run, in order, is a bug in this package. Open an issue on
[`softistx/nxgt-mail`](https://github.com/softistx/nxgt-mail/issues) with the
message, the package version, the Maizzle version and the smallest
`maizzle.config.ts` that reproduces it.
