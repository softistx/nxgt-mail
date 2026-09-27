import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MaizzleConfig } from '@maizzle/framework';
import Components from 'unplugin-vue-components/vite';

/** A Vite plugin, as Maizzle's `vite.plugins` takes one. */
type VitePlugins = NonNullable<NonNullable<MaizzleConfig['vite']>['plugins']>;

/** A `.vue` file an installed package ships: ours, or a preset's. */
const PACKAGED = /[\\/]node_modules[\\/].*\.vue(\?vue.*)?$/;

/** Maizzle's built-ins resolve their own imports; leave them be. */
const MAIZZLE = /[\\/]node_modules[\\/]@maizzle[\\/]framework[\\/]/;

/**
 * The folder of `@maizzle/framework`'s built-in components, found the way
 * Node finds the package: up from here, through each `node_modules`. The
 * package exports no subpath to ask it with.
 */
function maizzleComponentsDir(from: string): string {
	for (let dir = from; ; dir = dirname(dir)) {
		const candidate = join(
			dir,
			'node_modules/@maizzle/framework/dist/components',
		);
		if (existsSync(candidate)) return candidate;
		if (dirname(dir) === dir) {
			throw new Error(
				'ui: @maizzle/framework is not installed beside @nxgt/mail-ui',
			);
		}
	}
}

/**
 * The name Maizzle gives the component of a file name: `nx-card-header` is
 * `NxCardHeader`, `Button` stays `Button`. A copy of its `pascalCase`
 * (`@maizzle/framework/dist/utils/componentSources.js`), which the package does
 * not export: change them together.
 */
const pascalCase = (name: string): string =>
	name
		.replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
		.replace(/^(.)/, (c) => c.toUpperCase());

/**
 * The first `.vue` file at the top of `dirs`, in order, that Maizzle names
 * `tag` — `nx-card-header.vue` or `NxCardHeader.vue` for `<NxCardHeader>`.
 * Named, not guessed: `nx-2fa.vue` is `<Nx2fa>`, which no case conversion of
 * the tag gives back. A missing folder is skipped.
 */
export function fileForTag(
	dirs: readonly string[],
	tag: string,
): string | undefined {
	for (const dir of dirs) {
		if (!existsSync(dir)) continue;
		const file = readdirSync(dir)
			.filter((entry) => entry.endsWith('.vue'))
			.sort()
			.find((entry) => pascalCase(entry.slice(0, -'.vue'.length)) === tag);
		if (file !== undefined) return join(dir, file);
	}
	return undefined;
}

/**
 * Maizzle resolves the tags of a template (`<NxButton>`, `<Container>`) with
 * unplugin-vue-components, which skips every file under `node_modules` — so a
 * component or a template installed from npm would render empty, and the
 * build would pass. These plugins resolve the tags of those files the way
 * Maizzle would: the project's `components/` first, then ours, then Maizzle's
 * built-ins.
 */
export function packagedComponents(componentsDir: string): VitePlugins {
	const builtins = maizzleComponentsDir(
		dirname(fileURLToPath(import.meta.url)),
	);
	let root = process.cwd();
	return [
		{
			name: 'nxgt:mail-ui:root',
			configResolved(config: { readonly root: string }) {
				root = config.root;
			},
		},
		Components({
			include: [PACKAGED],
			exclude: [MAIZZLE],
			dirs: [],
			resolvers: [
				(name) =>
					fileForTag(
						[resolve(root, 'components'), componentsDir, builtins],
						name,
					),
			],
			dts: false,
		}),
	];
}
