# Writing a plugin

This page is for shipping part of a Maizzle config in a package — components,
global properties, build hooks — so a project adds it with one line in
`plugins`.

```ts
// brand.ts in a package, say `acme-mail-brand`, next to its components/ folder
import { fileURLToPath } from 'node:url';
import { defineMailPlugin } from '@nxgt/mail-config';

export const brand = defineMailPlugin({
	name: 'brand',
	components: {
		source: [{ path: fileURLToPath(new URL('./components', import.meta.url)), prefix: 'Brand' }],
	},
	vue: { globalProperties: { company: 'Example Inc.' } },
	afterTransform: ({ html }) => `${html}<!-- brand -->`,
});
```

```ts
// maizzle.config.ts, in the project
import { defineMailConfig } from '@nxgt/mail-config';
import { brand } from 'acme-mail-brand';

export default defineMailConfig({ plugins: [brand] });
```

```vue
<!-- emails/welcome.vue -->
<template>
  <Html>
    <Body>
      <Container>
        <Text>Welcome to {{ company }}.</Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
</template>
```

`<BrandFooter>` is the package's `components/Footer.vue`; `{{ company }}` is
the global property; every built file ends with `<!-- brand -->`.

## The signature

```ts
import type { MaizzleConfig } from '@maizzle/framework';

interface MailPlugin extends MaizzleConfig {
	readonly name: string;
	readonly plugins?: never; // a plugin cannot bring others
}

function defineMailPlugin(plugin: MailPlugin): MailPlugin;
```

A plugin is any Maizzle config key, plus a `name`. `defineMailPlugin` answers
the object it is given, unchanged; it runs the checks `defineMailConfig` would
run, so a mistake throws where the plugin is written — in the package, when it
loads, with a `defineMailPlugin: plugin …` message — and not in each project
that lists it. See [Errors](#errors). It also types the export as
`MailPlugin`, so the package's declarations name it.

A plain object `{ name, ...config }` in `plugins` works as well:
`defineMailPlugin` is for a plugin written in one place and used in another.

## `name`

Names the plugin in an error, and must be unique in a project: two plugins with
the same `name` are refused, since that is usually one plugin listed twice. It
is not passed to Maizzle.

```ts
defineMailPlugin({ name: 'brand', plaintext: false }); // answers the same object
defineMailPlugin({ output: {} } as never);
// TypeError: defineMailPlugin: plugin has no name — a plugin is { name, ...config }
```

## Components, under a prefix

Point `components.source` at a folder **inside the package**, as an absolute
path, with a `prefix`:

```ts
import { fileURLToPath } from 'node:url';
import { defineMailPlugin } from '@nxgt/mail-config';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export const brand = defineMailPlugin({
	name: 'brand',
	components: { source: [{ path: here('./components'), prefix: 'Brand' }] },
});
```

- **Absolute.** Maizzle resolves a relative `components.source` against the
  directory `maizzle` runs in — the project, where `./components` is the
  project's own folder, not the package's. `new URL(…, import.meta.url)` is
  relative to the plugin's file wherever the package is installed.
- **Prefixed.** `prefix: 'Brand'` makes `Footer.vue` `<BrandFooter>`, so the
  package never shadows Maizzle's own components (`<Button>`) or the project's.
- **Joined, not replaced.** Every plugin's `components.source` is kept, in the
  order of `plugins`, then the project's — see
  [The project config](config.md#three-lists-are-joined).
- **Shipped.** The folder must be in the package's `files`, or it is not in
  the tarball:

```json
{
	"files": ["dist", "components", "README.md", "package.json", "LICENSE"]
}
```

When the plugin is compiled to `dist/`, `import.meta.url` is the built file's:
point the path at where the folder sits relative to `dist/index.js`
(`'../components'`).

## Global properties

`vue.globalProperties` makes a value available in every template, with no
import. It is an object, so it merges key by key: a later plugin's key wins
over an earlier one's, the project's over every plugin's, and a key only one
layer sets stays.

```ts
import { defineMailConfig, defineMailPlugin } from '@nxgt/mail-config';

const alpha = defineMailPlugin({
	name: 'alpha',
	vue: { globalProperties: { greeting: 'from alpha', origin: 'alpha' } },
});
const beta = defineMailPlugin({
	name: 'beta',
	vue: { globalProperties: { greeting: 'from beta' } },
});

export default defineMailConfig({
	plugins: [alpha, beta],
	vue: { globalProperties: { greeting: 'from the project' } },
});
// {{ greeting }} / {{ origin }} renders 'from the project / alpha'
```

## Hooks

A plugin sets any of Maizzle's five build events — `beforeCreate`,
`beforeRender`, `afterRender`, `afterTransform`, `afterBuild` — with Maizzle's
own parameter types. It never sees the other layers' handlers: each runs in
turn, and a string it returns is what the next one reads. The table of events
is in [The project config](config.md#build-events).

```ts
import { defineMailPlugin } from '@nxgt/mail-config';

export const tracking = defineMailPlugin({
	name: 'tracking',
	// replaces the template's source for the handlers after it, and for the render
	beforeRender: ({ template }) => template.source.replaceAll('[[year]]', String(new Date().getFullYear())),
	// the html the next handler receives, and in the end the file written
	afterTransform: ({ html }) => html.replace('</body>', '<!-- sent by Example Inc. --></body>'),
});
```

A hook that finds the project wrong **throws**: the handlers after it do not
run, and Maizzle fails the build with the error. Do not log and return.

## The order of `plugins` matters

Plugins are layered in the order listed, and their hooks run in that order.
Two plugins that each rewrite what the other wrote give a different result the
other way round:

```ts
import { defineMailConfig, defineMailPlugin } from '@nxgt/mail-config';

/** Rewrites `[[mark]]` to `[[alpha]]`, which only beta knows how to finish. */
const alpha = defineMailPlugin({
	name: 'alpha',
	beforeRender: ({ template }) => template.source.replace('[[mark]]', '[[alpha]]'),
});

/** Finishes what alpha started. */
const beta = defineMailPlugin({
	name: 'beta',
	beforeRender: ({ template }) => template.source.replace('[[alpha]]', 'alpha then beta'),
});

export default defineMailConfig({ plugins: [alpha, beta] }); // [[mark]] → 'alpha then beta'
// plugins: [beta, alpha] leaves '[[alpha]]' in the e-mail
```

A plugin that depends on another's output says so in its README, and names
which one comes first. The same order decides which plugin's key wins: the
later one.

## A plugin with options

A package usually exports a function that takes options and answers the
plugin. Check the options there, and throw a bare `TypeError` for a wrong one —
a wiring mistake, raised when the config loads, never in the middle of a build:

```ts
import { fileURLToPath } from 'node:url';
import { defineMailPlugin, type MailPlugin } from '@nxgt/mail-config';

export interface BrandOptions {
	/** Shown in every template as {{ company }}. */
	readonly company: string;
}

export function brand(options: BrandOptions): MailPlugin {
	if (typeof options?.company !== 'string' || options.company.trim() === '') {
		throw new TypeError('brand: company must be a non-empty string');
	}
	return defineMailPlugin({
		name: 'brand',
		components: {
			source: [{ path: fileURLToPath(new URL('../components', import.meta.url)), prefix: 'Brand' }],
		},
		vue: { globalProperties: { company: options.company } },
	});
}
```

```ts
// maizzle.config.ts
export default defineMailConfig({ plugins: [brand({ company: 'Example Inc.' })] });
```

Listing the factory without calling it — `plugins: [brand]` — is refused by
`defineMailConfig` with `plugins[0] must be a plugin object, … — was it
called?`.

## What a plugin cannot do

- **Bring other plugins.** `MailPlugin` declares `plugins?: never`, so a
  plugin that sets `plugins` is a type error, and a `TypeError` at load time
  (`plugin "a" lists plugins — a plugin cannot bring others; list them in the
  project`). A project lists every plugin it uses, so their order is visible
  in one place.
- **Win over the project.** The project's config is always the top layer.
- **Add to an array other than the three joined lists.** A plugin that sets
  `content` or `static.source` replaces Maizzle's default for it, and is
  replaced by a later layer that sets it.

## Errors

`defineMailPlugin` throws a bare `TypeError` when the module that calls it
loads. Its messages name the plugin by its `name`, or `plugin` when it has
none:

| Message | Cause |
| --- | --- |
| `defineMailPlugin: plugin must be a plugin object, as { name, ...config } — was it called?` | The argument is not an object — `null`, an array, a function |
| `defineMailPlugin: plugin has no name — a plugin is { name, ...config }` | No `name`, or a blank one |
| `defineMailPlugin: plugin "a" lists plugins — a plugin cannot bring others; list them in the project` | The plugin sets `plugins` |
| `defineMailPlugin: plugin "a": beforeRender must be a function` | A build event set to something other than a function |

```ts
import { defineMailPlugin } from '@nxgt/mail-config';

export const broken = defineMailPlugin({
	name: 'a',
	beforeRender: 'x' as never,
}); // TypeError: defineMailPlugin: plugin "a": beforeRender must be a function
```

The same mistakes in a plain object listed in `plugins` are refused by
`defineMailConfig`, as `defineMailConfig: plugins[1] …` — see
[The project config](config.md#errors). Two plugins with the same `name` can
only be seen there, in the project.

## See also

- [The project config](config.md) — the layers, the merge rules, the chained
  events and every error.
- [Production](production.md) — a hook that only runs in the production build.
