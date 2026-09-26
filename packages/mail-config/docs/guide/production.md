# Production

This page is for adding a production build next to the everyday one: the same
project config, with the HTML minified, written somewhere else, with whatever
else only production needs.

```ts
// maizzle.config.production.ts
import { productionConfig } from '@nxgt/mail-config';
import config from './maizzle.config';

export default productionConfig(config, { output: { path: 'dist-production' } });
```

```json
{
	"scripts": {
		"dev": "maizzle serve",
		"build": "maizzle build -c maizzle.config.production.ts"
	}
}
```

Maizzle 6 has no environments. `maizzle build -c <file>` loads that file and
no other — not `maizzle.config.ts` beside it — so the production file imports
the project config and builds on it.

## The signature

```ts
import type { MaizzleConfig } from '@maizzle/framework';

function productionConfig(
	config: MaizzleConfig & { readonly plugins?: never },
	overrides?: MaizzleConfig & { readonly plugins?: never },
): MaizzleConfig;
```

Neither argument may carry `plugins`: every plugin is listed in the project
config, and `plugins` in either one is a type error as well as a `TypeError`
at load time.

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `config` | `MaizzleConfig` | — | The project config: what `maizzle.config.ts` exports, that is **what `defineMailConfig` answered** |
| `overrides` | `MaizzleConfig` | `{}` | Layered last: wins over the project and over the minification |

It answers three layers, lowest first — `config`, then
`{ html: { minify: true } }` (left out when the project already set minify
options, [below](#what-it-changes)), then `overrides` — merged by the same
rules as `defineMailConfig`, the overrides as a plugin is: objects merge,
arrays replace, their `components.source`, `vite.plugins` and `vue.plugins`
are added to the project's, their build events run after the project's. See
[The project config](config.md#how-two-layers-merge). Neither argument is
changed.

## What it changes

Only `html.minify`. Everything else is the project's:

```ts
import { defineMailConfig, productionConfig } from '@nxgt/mail-config';

const config = defineMailConfig({ output: { path: 'dist' } });

productionConfig(config);
// { plaintext: true, output: { path: 'dist' }, html: { minify: true } }
```

When the project config already sets `html.minify` to an object of options,
they are kept: `minify: true` would replace them.

```ts
const config = defineMailConfig({
	html: { minify: { lineLengthLimit: 1000 }, decodeEntities: false },
});
productionConfig(config).html;
// { minify: { lineLengthLimit: 1000 }, decodeEntities: false }
```

Minifying with no output path of its own writes over the everyday build in
`dist/`. Give production its own folder, as above, when both are kept.

## Overrides

Anything a Maizzle config holds. The minifier's options, for one:

```ts
productionConfig(config, {
	output: { path: 'dist-production' },
	html: { minify: { lineLengthLimit: 1000 } },
});
// { plaintext: true, output: { path: 'dist-production' }, html: { minify: { lineLengthLimit: 1000 } } }
```

A list in `overrides` is added to the project's, never replaces it — a Vite
plugin only production needs, say:

```ts
const report = { name: 'report' }; // a Vite plugin of yours

productionConfig(config, { vite: { plugins: [report] } });
// vite.plugins: the project's (and its plugins'), then report
```

A build event in `overrides` runs **after** the project's — and after every
plugin's, which the project config already chains:

```ts
import { defineMailConfig, productionConfig } from '@nxgt/mail-config';

const config = defineMailConfig({ afterTransform: ({ html }) => `${html}p` });

export default productionConfig(config, {
	afterTransform: ({ html }) => `${html}!`, // receives the project's output: '…p' becomes '…p!'
});
```

A realistic one: fail the production build when an e-mail is heavier than an
inbox will show in full.

```ts
// maizzle.config.production.ts
import { productionConfig } from '@nxgt/mail-config';
import config from './maizzle.config';

const limit = 100 * 1024; // some clients clip an e-mail past about 100 KB

export default productionConfig(config, {
	output: { path: 'dist-production' },
	afterTransform: ({ template, html }) => {
		const size = new TextEncoder().encode(html).length;
		if (size > limit) {
			throw new Error(`${template.path.name}: ${size} bytes, over the ${limit}-byte limit`);
		}
	},
});
```

Returning nothing keeps the HTML as it was; throwing fails the build.

## Errors

A bare `TypeError`, when `maizzle.config.production.ts` loads:

| Message | Cause |
| --- | --- |
| `productionConfig: config must be the project config, as productionConfig(config, overrides)` | `config` is missing, `null`, an array, or not an object |
| `productionConfig: config lists plugins — pass what defineMailConfig answered, not its argument` | `config` still has `plugins`: it is the object given to `defineMailConfig`, not what it answered |
| `productionConfig: overrides must be an object` | `overrides` is `null`, an array, or not an object |
| `productionConfig: overrides list plugins — list every plugin in the project config` | `overrides` sets `plugins`. Plugins are layered once, in the project config; what only production needs goes in the overrides as plain config keys, which merge as a plugin's would |
| `productionConfig: afterBuild must be a function` | `overrides` sets a build event to something other than a function |

The second one comes from exporting the argument instead of the result:

```ts
// maizzle.config.ts — wrong: exports the input, not a Maizzle config
const input = { plugins: [brand] };
export default input;

// right
export default defineMailConfig({ plugins: [brand] });
```

## See also

- [The project config](config.md) — the merge rules and the chained events.
- [Writing a plugin](plugins.md) — what a plugin can add, in both builds.
