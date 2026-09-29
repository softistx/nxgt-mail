# @nxgt/mail-config

Less boilerplate in a normal [Maizzle](https://maizzle.com) 6 project of
transactional e-mails: `defineMailConfig` layers **plugins** — partial Maizzle
configs shipped by packages — under your own `maizzle.config.ts`, and runs every
plugin's build events one after the other instead of letting the last one
silently replace the others.

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { brand } from './plugins/brand';

export default defineMailConfig({
	plugins: [brand],
	// your own Maizzle config, as usual — it wins over every plugin
	afterTransform: ({ html }) => `${html}<!-- built by the project -->`,
});
```

Your project stays a Maizzle project: `emails/`, `components/`, `public/`,
`maizzle serve`, `maizzle build`. Nothing here replaces a Maizzle command.

> **1.x.** Semantic versioning: a breaking change waits for the next major,
> and the changelog says what each release changes.

## Install

```sh
bun add @nxgt/mail-config @maizzle/framework @maizzle/tailwindcss
```

Peers, all required:

- `@maizzle/framework` (`^6.1.7`) — Maizzle itself.
- `@maizzle/tailwindcss` (`^1.5.6`) — **as a direct dependency of your
  project**, even if another package already brings it: see
  [Setup](#setup).
- `typescript` (6). Bundler resolution (`"moduleResolution": "bundler"`) is
  what is supported and tested; `nodenext` is out of contract.

Runs wherever `maizzle build` does: Node `^22.22.3`, `^24.15.0` or `>=26` — the
range Maizzle 6's own dependencies require — or Bun. CI runs the tests on
Bun, and builds the starter under Node 22.22.3.

## Setup

```css
/* in the <style> your layout imports Tailwind from */
@import "@maizzle/tailwindcss";
```

That import is resolved from your project. Under an isolated install — Bun
workspaces, pnpm — a copy that is only a dependency of another package is not
reachable from there, and the import fails **silently**: the build succeeds,
and no Tailwind utility is generated. Listing `@maizzle/tailwindcss` in
your own `package.json`, as the `bun add` above does, is what makes it
resolve.

## Exports

| Export | What it is |
| --- | --- |
| `defineMailConfig(config?)` | Your `maizzle.config.ts`: base, plugins, then your config |
| `defineMailPlugin(plugin)` | Checks a plugin and answers it unchanged |
| `productionConfig(config, overrides?)` | `maizzle.config.production.ts`: minified HTML over your config |
| `baseConfig` | The lowest layer, frozen: a plain-text part that reads as one (`plaintext` with `breakBlocks`, and an `afterBuild` that tidies it) |
| `breakBlocks` | The `string-strip-html` `cb` the base hands Maizzle: marks a blank line after a paragraph, a line break after a `<br>`, and a `<pre>`'s content, so `tidyPlaintext` can tell these from a source line Maizzle wrapped |
| `tidyPlaintext(text)` | The text tidied: no invisible characters, one blank line at most, a link's address once, a wrapped source line rejoined into its sentence |
| `MailConfig` | The type `defineMailConfig` takes: a `MaizzleConfig` with `plugins` |
| `MailPlugin` | The type of a plugin: a `MaizzleConfig` with a `name`, and no `plugins` |

## Usage

### A project config — `defineMailConfig`

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

The layers, lowest first:

1. **`baseConfig`** — a `.txt` part next to each `.html`, laid out in
   paragraphs ([below](#the-plain-text-part)). Everything else a project needs
   (`dist/`, `public/` copied, CSS inlined and purged) is already Maizzle's
   default.
2. **Each plugin, in the order listed** — a later plugin wins over an earlier
   one.
3. **The rest of your config** — it wins over every plugin.

How two layers merge:

| What | Rule |
| --- | --- |
| An object (`output`, `css`, `vue.globalProperties`…) | Merged key by key; the later layer's key wins, a key only an earlier layer sets stays |
| An array (`content`, `static.source`…) | **Replaced** by the later layer's, as Maizzle's own merge does |
| `components.source`, `vite.plugins`, `vue.plugins` | **Joined**, in layer order: two plugins that each bring components keep both. A `vue.plugins` factory (`() => Plugin[]`) stays a factory, called once per render |
| A build event | **Chained** — see below |

The result is a plain Maizzle config: `plugins` and each plugin's `name` are
not passed to Maizzle. See [The project config](docs/guide/config.md).

### Build events, chained

Every layer's handler for an event runs, in layer order, each awaited before
the next:

```ts
import { defineMailConfig, defineMailPlugin } from '@nxgt/mail-config';

const alpha = defineMailPlugin({
	name: 'alpha',
	beforeRender: ({ template }) => template.source.replace('[[mark]]', '[[alpha]]'),
});

const beta = defineMailPlugin({
	name: 'beta', // listed after alpha, so it sees alpha's source
	beforeRender: ({ template }) => template.source.replace('[[alpha]]', 'alpha then beta'),
});

export default defineMailConfig({ plugins: [alpha, beta] }); // [[mark]] → alpha then beta
```

| Event | What a returned string does |
| --- | --- |
| `beforeCreate` | Nothing — every handler runs, in order |
| `beforeRender` | Replaces `template.source`, which the next handler reads |
| `afterRender`, `afterTransform` | Replaces the `html` the next handler receives; the last string is the output |
| `afterBuild` | Nothing — every handler runs, in order |

A handler that returns nothing leaves the source or the HTML as it was. A
handler that **throws stops the chain**: the handlers after it do not run, and
the error reaches Maizzle, which fails the build.

### The plain-text part

Without asking, each template gets a `.txt` part that reads as one: a blank
line between paragraphs, a line break for each `<br>`, row or list item —
a row's cells side by side, a space apart — a
button's address on its own line, every line of a `<pre>` kept, no invisible
character from a `<Spacer>`, an `<Hr>` or the preheader's padding, a link
whose text is its address written once, and a long source line Maizzle
wrapped rejoined into the sentence it broke — never a line break mid-word.
`maizzle serve`'s plain-text preview does not show it: only `maizzle build`
writes it.

```text
Confirm my address

{{ link }}

The link expires in 15 minutes.

Or paste this link into your browser: {{ link }}
```

To change the text part's options, set `plaintext` to an **object**: it is
merged key by key over the base's, so the base's `cb` stays. The two functions
behind it are exported, for a text part built elsewhere:

```ts
import { createPlaintext } from '@maizzle/framework';
import { breakBlocks, tidyPlaintext } from '@nxgt/mail-config';

const html = '<p>Hello,</p><p>Your code is <b>123456</b>.</p>';
tidyPlaintext(createPlaintext(html, { cb: breakBlocks }));
// 'Hello,\n\nYour code is 123456.\n'
```

See [The plain-text part](docs/guide/config.md#the-plain-text-part).

### A plugin — `defineMailPlugin`

A plugin is a partial Maizzle config with a `name`. A package exports one,
checked where it is written — a mistake throws `defineMailPlugin: plugin …`
when the package loads, not in each project that lists it:

```ts
// plugins/brand.ts
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

`components/footer.vue` next to that file is `<BrandFooter>` in every template.
See [Writing a plugin](docs/guide/plugins.md).

### A production build — `productionConfig`

Maizzle has no environments: `maizzle build -c <file>` loads that file and no
other, so the production config imports the project's.

```ts
// maizzle.config.production.ts
import { productionConfig } from '@nxgt/mail-config';
import config from './maizzle.config';

export default productionConfig(config, { output: { path: 'dist-production' } });
```

```sh
maizzle build -c maizzle.config.production.ts
```

It layers your config, then `{ html: { minify: true } }` — unless your config
already set minify options, which are kept — then the overrides, merged as a
plugin is: their `components.source`, `vite.plugins` and `vue.plugins` are
added to yours, their build events run after yours. See
[Production](docs/guide/production.md).

## Traps

**A plugin's paths are absolute.** Maizzle resolves a relative
`components.source` against the directory `maizzle` runs in — your project,
not the package: write `fileURLToPath(new URL('./components', import.meta.url))`.

**A plugin that sets an array replaces the default under it.** `content:
['src/**/*.vue']` in a plugin drops Maizzle's `emails/**/*.{vue,md}`, as it
would in your own config.

**Do not set a build event by spreading configs yourself.** `{ ...a, ...b }`
keeps `b`'s `beforeRender` and drops `a`'s without a word; list both in
`plugins`.

**`plaintext: true` in your config drops the base's paragraphs.** A boolean
replaces the base's object, `cb` included; leave `plaintext` out, or set an
object: `plaintext: { extension: 'text' }`.

**Pass `productionConfig` what `defineMailConfig` answered**, not its argument,
and list every plugin in the project config: `plugins` in either argument of
`productionConfig` is a type error, and a `TypeError` at load time.

**A wiring mistake is a bare `TypeError`**, thrown when the config file loads:
a plugin that was not called, a plugin without a `name`, two plugins with the
same `name`, a build event that is not a function. Each message names the
plugin or its index — the list is in [The project config](docs/guide/config.md#errors).

## Type safety, counted

**6 plausible mistakes, 6 refused** at compile time, each measured by a
`@ts-expect-error` in
[`test/types/refusals.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-config/test/types/refusals.ts)
that fails the typecheck the moment it stops holding:

1. A plugin without a `name`.
2. `plugins` given one plugin rather than a list.
3. A build event that is not a function (`beforeRender: 'x'`).
4. A plugin that brings other plugins.
5. `productionConfig` given `defineMailConfig`'s argument instead of what it
   answered.
6. Plugins added in `productionConfig`'s overrides.

The same file holds the calls that must keep compiling: a refusal that refuses
the correct call is a bug.

Maizzle's own keys are not refused: its config type takes any key
(`[key: string]: any`), so a misspelled Maizzle option compiles. What this
package adds — `name`, `plugins`, the build events' types — is checked.

## Documentation

- [The guides](docs/README.md) — one page per area, with every option and error.
- [Troubleshooting](docs/troubleshooting.md) — an error message, its cause and
  its fix.
- [Roadmap](docs/roadmap.md) — what is next, and what is deliberately not
  planned.
- [Vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md)
  — the words these pages use, defined once.

## Licence

MIT
