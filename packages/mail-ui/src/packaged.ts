import type { MaizzleConfig } from '@maizzle/framework';
import Components from 'unplugin-vue-components/vite';

/** A Vite plugin, as Maizzle's `vite.plugins` takes one. */
type VitePlugins = NonNullable<NonNullable<MaizzleConfig['vite']>['plugins']>;

/** A `.vue` file an installed package ships: ours, or a preset's. */
const PACKAGED = /[\\/]node_modules[\\/].*\.vue(\?vue.*)?$/;

/** Maizzle's built-ins resolve their own imports; leave them be. */
const MAIZZLE = /[\\/]node_modules[\\/]@maizzle[\\/]framework[\\/]/;

/** What unplugin-vue-components answers for a tag: the file, and its export. */
interface ComponentInfo {
	readonly as?: string;
	readonly name?: string;
	readonly from: string;
}

/** The public API of an unplugin-vue-components instance. */
interface ComponentsApi {
	findComponent(name: string): Promise<ComponentInfo | undefined>;
}

interface NamedPlugin {
	readonly name?: string;
	readonly api?: unknown;
}

const hasFindComponent = (api: unknown): api is ComponentsApi =>
	typeof api === 'object' &&
	api !== null &&
	typeof (api as { findComponent?: unknown }).findComponent === 'function';

/**
 * The API of Maizzle's own unplugin-vue-components instance among `plugins`,
 * other than `ours`, or `null` when there is none.
 */
export function maizzleComponents(
	plugins: readonly NamedPlugin[],
	ours: unknown,
): ComponentsApi | null {
	for (const plugin of plugins) {
		if (plugin.name !== 'unplugin-vue-components' || plugin.api === ours) {
			continue;
		}
		if (hasFindComponent(plugin.api)) return plugin.api;
	}
	return null;
}

/**
 * Maizzle resolves the tags of a template (`<NxButton>`, `<Container>`) with
 * unplugin-vue-components, which skips every file under `node_modules` — so a
 * component or a template installed from npm would render empty, and the
 * build would pass. These plugins resolve the tags of those files with
 * Maizzle's own instance, so they resolve as a project's template would: the
 * project's `components/` and its subfolders, every `components.source`
 * folder with its prefix, and Maizzle's built-ins, in Maizzle's order.
 *
 * Maizzle's instance reads its folders on its first transform: that of the
 * template, or of the i18n plugin's wrapper, which imports every installed
 * file and so is always transformed before one.
 */
export function packagedComponents(): VitePlugins {
	let maizzle: ComponentsApi | null = null;
	const ours = Components({
		include: [PACKAGED],
		exclude: [MAIZZLE],
		dirs: [],
		resolvers: [
			async (name) => {
				if (maizzle === null) {
					throw new Error(
						'ui: no component resolver of Maizzle was found — is @maizzle/framework 6 installed?',
					);
				}
				return maizzle.findComponent(name);
			},
		],
		dts: false,
	});
	const oursApi = (ours as NamedPlugin).api;
	return [
		{
			name: 'nxgt:mail-ui:maizzle-components',
			configResolved(config: { readonly plugins: readonly NamedPlugin[] }) {
				maizzle = maizzleComponents(config.plugins, oursApi);
			},
		},
		ours,
	];
}
