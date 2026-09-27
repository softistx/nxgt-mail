# The project config

This page is for writing a project's `maizzle.config.ts` with
`defineMailConfig`: which layer wins, how two layers merge, how the build
events of several plugins run, what the plain-text part looks like, and what
is refused.

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { alpha, beta } from './plugins';

export default defineMailConfig({
	plugins: [alpha, beta],
	vue: { globalProperties: { greeting: 'from the project' } },
	afterTransform: ({ html }) => `${html}<!-- project -->`,
});
```

`maizzle serve` and `maizzle build` load that file as they load any Maizzle
config, and `defineMailConfig` runs each time the file is loaded, answering a
plain Maizzle config. That can be more than once: above 50 templates Maizzle 6
builds in parallel, and each worker loads the file again. Keep the call free
of side effects. The per-template events (`beforeRender`, `afterRender`,
`afterTransform`) then run in the workers; `beforeCreate` and `afterBuild` run
only on the main thread, once per build.

## The signature

```ts
import type { MaizzleConfig } from '@maizzle/framework';

interface MailPlugin extends MaizzleConfig {
	readonly name: string;
	readonly plugins?: never; // a plugin cannot bring others
}

interface MailConfig extends MaizzleConfig {
	readonly plugins?: readonly MailPlugin[];
}

function defineMailConfig(config?: MailConfig): MaizzleConfig;

const baseConfig: Readonly<MaizzleConfig>; // { plaintext: { options: { cb: breakBlocks } }, afterBuild }, frozen
```

`config` is your whole Maizzle config plus `plugins`. The answer is a new
object: neither `config` nor any plugin is changed, and neither `plugins` nor a
plugin's `name` is passed on to Maizzle.

```ts
import { defineMailConfig } from '@nxgt/mail-config';

defineMailConfig(); // baseConfig
defineMailConfig({ plugins: [{ name: 'a', root: 'src' }] }); // { ...baseConfig, root: 'src' }
```

## The layers

Three layers, lowest first; each key of a later layer wins over the same key
below it:

1. `baseConfig` — a plain-text part next to each HTML file, laid out in
   paragraphs: `plaintext: { options: { cb: breakBlocks } }`, and an
   `afterBuild` that tidies each text part
   ([below](#the-plain-text-part)). It is frozen: override it in a layer,
   never by assigning to it. `dist/`, `public/` copied as static files, and
   CSS inlined and purged are already Maizzle's defaults, so the base does not
   repeat them.
2. Each plugin, in the order of `plugins`.
3. Everything in `config` but `plugins` — your project.

```ts
import { defineMailConfig } from '@nxgt/mail-config';

const config = defineMailConfig({
	plugins: [
		{ name: 'a', output: { path: 'a', extension: 'htm' }, css: { purge: false } },
		{ name: 'b', output: { path: 'b' } },
	],
	output: { path: 'project' },
});
// {
//   ...baseConfig,
//   output: { path: 'project', extension: 'htm' }, ← the project's path, a's extension
//   css: { purge: false },
// }
```

A plugin overrides the base, and the project overrides a plugin — even to turn
the plain text back off. An object is merged over the base's, so the base's
`cb` stays under it:

```ts
import { breakBlocks, defineMailConfig } from '@nxgt/mail-config';

defineMailConfig({ plugins: [{ name: 'a', plaintext: false }] }).plaintext; // false
defineMailConfig({
	plugins: [{ name: 'a', plaintext: false }],
	plaintext: { extension: 'text' },
}).plaintext; // { extension: 'text', options: { cb: breakBlocks } }
```

## How two layers merge

The rule is Maizzle's own — the one its config loader uses to put your file
over its defaults — with three lists as the exception.

| What | Rule |
| --- | --- |
| An object | Merged key by key. The later layer's key wins; a key only an earlier layer sets stays |
| An array | **Replaced** by the later layer's |
| `components.source` | **Joined**, in layer order. A single entry (not in an array) counts as one |
| `vite.plugins` | **Joined**, in layer order |
| `vue.plugins` | **Joined**, in layer order. When any layer gives a factory, the result is a factory |
| A build event | **Chained** — [below](#build-events) |

### An array replaces

```ts
const config = defineMailConfig({
	plugins: [{ name: 'a', static: { source: ['a/**'], destination: 'a' } }],
	static: { source: ['project/**'] },
});
config.static; // { source: ['project/**'], destination: 'a' }
```

The same holds against Maizzle's defaults, which sit under every layer: a
plugin that sets `content` replaces `emails/**/*.{vue,md}`, and one that sets
`static.source` replaces `public/**/*.*`.

### Three lists are joined

Under Maizzle's rule, two plugins that each bring components would keep only
the last one's. These three are added to instead:

```ts
const viteA = { name: 'vite-a' };
const viteB = { name: 'vite-b' };

const config = defineMailConfig({
	plugins: [
		{
			name: 'a',
			components: { source: { path: '/abs/a', prefix: 'A' } },
			vite: { plugins: [viteA], base: '/a' },
		},
		{ name: 'b', vite: { plugins: [viteB] } },
	],
	components: { source: ['components-extra'] },
});
config.components; // { source: [{ path: '/abs/a', prefix: 'A' }, 'components-extra'] }
config.vite; // { base: '/a', plugins: [viteA, viteB] }
```

A `null` in one of the three sets nothing, as in Maizzle's own merge — it
neither empties the list nor ends up in it:

```ts
const config = defineMailConfig({
	plugins: [{ name: 'a', components: { source: ['a'] } }],
	components: { source: null as never },
});
config.components; // { source: ['a'] }
```

Your own `components/` folder does not need to be in `components.source`:
Maizzle always reads it, whatever the list holds, so a component there is
found whatever the plugins bring.

`vue.plugins` may be a list or a factory, `() => Plugin[]`, which Maizzle calls
for each render so a stateful Vue plugin starts fresh. When every layer gives a
list, the lists are joined; when any gives a factory, the result is a factory
that calls each layer's factory and joins what they answer, in layer order:

```ts
const one = { install() {} };
const two = { install() {} };

const config = defineMailConfig({
	plugins: [{ name: 'a', vue: { plugins: () => [one] } }],
	vue: { plugins: [two], globalProperties: { x: 1 } },
});
const plugins = config.vue?.plugins as () => unknown[];
plugins(); // [one, two] — a's factory called again on every call
config.vue?.globalProperties; // { x: 1 }
```

## Build events

Maizzle keeps **one** function per build event: under a plain merge, the last
layer's `beforeRender` would replace every other. `defineMailConfig` hands
Maizzle one function per event that runs every layer's handler, in layer
order — the base, each plugin in order, then the project — each awaited before
the next. An event only one layer sets is handed to Maizzle as it is.

The base sets `afterBuild` — it tidies the text parts — so a plugin's or the
project's `afterBuild` is always chained after it, and reads each `.txt`
already tidied.

Maizzle fires them in this order:

| Event | When | Parameters | What a returned string does |
| --- | --- | --- | --- |
| `beforeCreate` | Once, before any template | `{ config }` | Nothing |
| `beforeRender` | Before each template renders | `{ config, template }` | Replaces `template.source`; the next handler reads the new one |
| `afterRender` | After each render, before the transformers | `{ config, template, html }` | Becomes the `html` the next handler receives |
| `afterTransform` | After the transformers, on each template | `{ config, template, html }` | Becomes the `html` the next handler receives |
| `afterBuild` | Once, after every template | `{ config, files }` | Nothing |

A handler that returns nothing (or anything but a string) leaves the source or
the HTML as it was.

### `beforeRender`

```ts
import { defineMailConfig } from '@nxgt/mail-config';

export default defineMailConfig({
	plugins: [
		{ name: 'a', beforeRender: ({ template }) => `${template.source} a` },
		{ name: 'b', beforeRender: ({ template }) => { console.log(template.source); } }, // 'source a'
	],
	beforeRender: async ({ template }) => `${template.source} project`,
});
// a template whose source is 'source' renders 'source a project'
```

### `afterRender` and `afterTransform`

```ts
export default defineMailConfig({
	plugins: [
		{ name: 'a', afterTransform: ({ html }) => `${html}a` },
		{ name: 'b', afterTransform: () => undefined }, // keeps what a answered
	],
	afterTransform: async ({ html }) => `${html}p`,
});
// '<p>' comes out as '<p>ap'
```

Each handler receives the `html` the previous one answered; the `html` Maizzle
passed in is not changed.

### `beforeCreate` and `afterBuild`

```ts
export default defineMailConfig({
	plugins: [
		{ name: 'a', afterBuild: async () => { /* runs first */ } },
		{ name: 'b', afterBuild: async () => { /* runs once a's has settled */ } },
	],
	afterBuild: async ({ files }) => { /* runs last, with every file written */ },
});
```

### A throw stops the chain

A handler that throws, or rejects, stops there: the handlers after it do not
run, and the error reaches Maizzle unchanged, which fails the build with it.
Nothing is caught or logged on the way.

```ts
export default defineMailConfig({
	plugins: [
		{
			name: 'a',
			beforeRender: () => {
				throw new Error('catalogue broken');
			},
		},
	],
	beforeRender: () => {
		/* never runs */
	},
});
```

## The plain-text part

Maizzle writes a text part next to each HTML file with `string-strip-html`,
which keeps only the line breaks it finds in the HTML — and a built e-mail has
few. Left alone, the text part is one long line, with a code or a link buried
in it, the zero-width joiners of a spacer on their own, and a link whose text
is its address written twice. The base fixes that in two steps:

```ts
import { createPlaintext } from '@maizzle/framework';
import { breakBlocks, tidyPlaintext } from '@nxgt/mail-config';

const html = '<p>Hello,</p><p>Your code is <b>123456</b>.</p>';

createPlaintext(html); // 'Hello, Your code is 123456.'
tidyPlaintext(createPlaintext(html, { cb: breakBlocks }));
// 'Hello,\n\nYour code is 123456.\n'
```

`createPlaintext` is what Maizzle calls for each template, with
`plaintext.options`.

### `breakBlocks` — while the HTML is stripped

The `cb` the base puts in `plaintext.options`, which Maizzle forwards to
`string-strip-html`. It decides what each tag becomes:

| Tag | Becomes |
| --- | --- |
| `p`, `h1`–`h6`, `ul`, `ol`, `table`, `blockquote` | A blank line |
| `br`, `hr`, and the end of a `div`, `tr` or `li` | A line break: two list items in a row are two lines, not two paragraphs |
| Any other | What `string-strip-html` proposes — a link's address still written after it |

### `tidyPlaintext` — after the build

The base's `afterBuild` reads each file Maizzle wrote with the text part's
extension (`plaintext.extension`, `txt` by default) and rewrites it with
`tidyPlaintext`, which:

- drops the invisible characters a `<Spacer>`, an `<Hr>` or the preheader's
  padding hold — zero-width joiner and space, byte-order mark, U+034F, figure
  space, soft hyphen, word joiner — and the empty lines they leave;
- trims each line, keeps at most one blank line in a row, no blank line
  first, and ends with one newline;
- drops a line that is an address — a URL with its scheme, or one
  `{{ placeholder }}` — when the line before is the same address or ends
  with it after a space: a link whose text is its address. Any other line
  stays, even one that ends the line before (`Seats: 12`, then `2`).

```ts
import { tidyPlaintext } from '@nxgt/mail-config';

tidyPlaintext('Or paste this link: https://example.test/v?t=1\n\nhttps://example.test/v?t=1\n\nBye.');
// 'Or paste this link: https://example.test/v?t=1\n\nBye.\n'
tidyPlaintext('Confirm my address\n\n{{ link }}');
// 'Confirm my address\n\n{{ link }}\n' — a button's text is not its address, so it stays
```

It never rewrites anything when `plaintext` is `false`, nor a file that
starts with `<!doctype` or `<html>` — HTML a template wrote under the text
part's extension is never tidied as text. A text part a template asks for
itself with another extension than the config's is not tidied.

Only `maizzle build` writes this text part. `maizzle serve`'s plain-text
preview, and its test send, strip the HTML with Maizzle's own defaults and
run no `afterBuild`: they still show the e-mail on one line.

### Keep the `cb`, or replace it

```ts
import { breakBlocks, defineMailConfig } from '@nxgt/mail-config';

// Keeps it: an object merges key by key over the base's.
defineMailConfig({ plaintext: { extension: 'text' } });
defineMailConfig({ plaintext: { options: { ignoreTags: ['style'] } } });
// { options: { cb: breakBlocks, ignoreTags: ['style'] } }

// Replaces it: your own cb wins over the base's.
defineMailConfig({ plaintext: { options: { cb: ({ rangesArr, proposedReturn }) => {
	if (proposedReturn) rangesArr.push(...proposedReturn);
} } } });

// Loses it: a boolean replaces the base's object — the paragraphs run together again.
defineMailConfig({ plaintext: true });
```

`plaintext: true` still gets the tidy, since `afterBuild` stays; only the
paragraphs are lost. See
[the trap](../troubleshooting.md#the-plain-text-part-is-one-long-line-again).

```ts
import type { PlaintextConfig } from '@maizzle/framework';

type StripCallback = NonNullable<NonNullable<PlaintextConfig['options']>['cb']>; // string-strip-html's cb

function breakBlocks(tag: Parameters<StripCallback>[0]): void;
function tidyPlaintext(text: string): string;
```

## Errors

A mistake in how the config is wired is a bare `TypeError`, thrown by
`defineMailConfig` each time `maizzle.config.ts` is loaded — the first time
before any template is built, so the build stops there. A message names the
plugin by its `name`, or by its index when it has none. Several are also
refused at compile time — a plugin without a `name`, `plugins` that is not a
list, a build event that is not a function, a plugin that lists plugins; the
count is in the [README](../../README.md#type-safety-counted).

| Message | Cause |
| --- | --- |
| `defineMailConfig: config must be an object, as { plugins, ...maizzleConfig }` | `config` is `null`, an array, or not an object |
| `defineMailConfig: plugins must be an array` | `plugins` is set to something else |
| `defineMailConfig: plugins[0] must be a plugin object, as { name, ...config } — was it called?` | An entry is not an object — usually a plugin factory listed without calling it: `plugins: [brand]` for `plugins: [brand()]` |
| `defineMailConfig: plugins[1] has no name — a plugin is { name, ...config }` | An entry has no `name`, or a blank one |
| `defineMailConfig: plugin "a" lists plugins — a plugin cannot bring others; list them in the project` | A plugin sets `plugins`: plugins do not nest |
| `defineMailConfig: two plugins are named "i18n" — is one listed twice?` | Two entries share a `name` |
| `defineMailConfig: plugin "a": afterBuild must be a function` | A plugin sets a build event to something other than a function |
| `defineMailConfig: beforeRender must be a function` | The project sets a build event to something other than a function |

```ts
import { defineMailConfig } from '@nxgt/mail-config';
import { brand } from './plugins/brand'; // a factory: brand(options) answers the plugin

export default defineMailConfig({
	plugins: [brand], // TypeError: defineMailConfig: plugins[0] must be a plugin object, … — was it called?
});
```

Each message says where the problem is, never a value from your config. A
plugin checked by `defineMailPlugin` in its own package is refused there, with
`defineMailPlugin: plugin …` messages — see
[Writing a plugin](plugins.md#errors).

## See also

- [Writing a plugin](plugins.md) — what goes in a plugin, and `defineMailPlugin`.
- [Production](production.md) — the same layering, for `maizzle.config.production.ts`.
