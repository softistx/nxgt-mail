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
 * `card-header` in PascalCase, `CardHeader`, as Maizzle writes a file's name.
 * A copy of its `pascalCase` (`@maizzle/framework/dist/utils/componentSources.js`),
 * which the package does not export: change them together.
 */
const pascalCase = (name: string): string =>
	name
		.replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
		.replace(/^(.)/, (c) => c.toUpperCase());

/** A folder of components, and the prefix Maizzle gives their names, if any. */
export interface ComponentsFolder {
	readonly path: string;
	readonly prefix?: string;
}

/**
 * The name Maizzle gives the component of a file at the top of a folder, as
 * its `componentNameFromPath`: `card-header.vue` under the prefix `Nx` is
 * `NxCardHeader`, and so is `nx-card-header.vue` — a prefix the name already
 * starts with is not repeated. Without a prefix, `nx-badge.vue` is `NxBadge`.
 */
function componentName(file: string, prefix: string | undefined): string {
	const name = pascalCase(file.slice(0, -'.vue'.length));
	if (prefix === undefined) return name;
	return prefix + (name.startsWith(prefix) ? name.slice(prefix.length) : name);
}

/**
 * The first `.vue` file at the top of `folders`, in order, that Maizzle names
 * `tag` — `button.vue` under the prefix `Nx`, or a project's `nx-button.vue`
 * or `NxButton.vue`, for `<NxButton>`. Named, not guessed: `2fa.vue` under
 * `Nx` is `<Nx2fa>`, which no case conversion of the tag gives back. A missing
 * folder is skipped.
 */
export function fileForTag(
	folders: readonly ComponentsFolder[],
	tag: string,
): string | undefined {
	for (const { path, prefix } of folders) {
		if (!existsSync(path)) continue;
		// Sorted, so that of two files Maizzle would give the same name, as
		// `nx-badge.vue` and `NxBadge.vue`, the same one wins on every machine.
		const file = readdirSync(path)
			.filter((entry) => entry.endsWith('.vue'))
			.sort()
			.find((entry) => componentName(entry, prefix) === tag);
		if (file !== undefined) return join(path, file);
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
export function packagedComponents(ours: ComponentsFolder): VitePlugins {
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
						[{ path: resolve(root, 'components') }, ours, { path: builtins }],
						name,
					),
			],
			dts: false,
		}),
	];
}
