import { existsSync } from 'node:fs';
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
	const resolveTag = (name: string): string | undefined => {
		for (const dir of [resolve(root, 'components'), componentsDir, builtins]) {
			const file = join(dir, `${name}.vue`);
			if (existsSync(file)) return file;
		}
		return undefined;
	};
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
			resolvers: [(name) => resolveTag(name)],
			dts: false,
		}),
	];
}
