/**
 * `@nxgt/mail-config` — a shareable Maizzle config.
 *
 * ```ts
 * // maizzle.config.ts
 * import { defineMailConfig } from '@nxgt/mail-config';
 *
 * export default defineMailConfig({
 *   plugins: [ui({ brand }), i18n({ locales: ['en', 'fr'] })],
 *   // the project's own Maizzle config, which wins over every plugin
 * });
 * ```
 *
 * A plugin is a partial Maizzle config with a `name`. The layers are the base
 * config, then each plugin in order, then the project; every build event runs
 * each layer's handler in that order instead of the last one replacing the
 * others.
 */

import type { MaizzleConfig } from '@maizzle/framework';
import { EVENTS, layer } from './layer';
import { breakBlocks, tidyPlaintextFiles } from './plaintext';

export { breakBlocks, tidyPlaintext } from './plaintext';

/** A partial Maizzle config a package hands to {@link defineMailConfig}. */
export interface MailPlugin extends MaizzleConfig {
	/** Names the plugin in an error; two plugins of a project never share one. */
	readonly name: string;
	/** A plugin cannot bring others: the project lists every plugin. */
	readonly plugins?: never;
}

/** A project's Maizzle config, with the plugins layered under it. */
export interface MailConfig extends MaizzleConfig {
	/** Layered in order, each over the one before, all under the project. */
	readonly plugins?: readonly MailPlugin[];
}

/**
 * What a project gets without asking: a plain-text part next to each HTML
 * file, that reads as one — a blank line between paragraphs, a line break
 * for each `<br>`, no invisible characters from a spacer or a divider, and a
 * link's address written once. Everything else — `dist/`, `public/`, CSS
 * inlined and purged — is already Maizzle's default.
 */
export const baseConfig: Readonly<MaizzleConfig> = Object.freeze({
	plaintext: { options: { cb: breakBlocks } },
	afterBuild({ files, config }) {
		const { plaintext } = config;
		if (!plaintext) return;
		const extension =
			typeof plaintext === 'object' ? (plaintext.extension ?? 'txt') : 'txt';
		// An HTML output named like a text part is never rewritten.
		if (extension === (config.output?.extension ?? 'html')) return;
		tidyPlaintextFiles(files, extension);
	},
});

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

function checkHandlers(config: Record<string, unknown>, where: string): void {
	for (const event of EVENTS) {
		const handler = config[event];
		if (handler !== undefined && typeof handler !== 'function') {
			throw new TypeError(`${where}: ${event} must be a function`);
		}
	}
}

/**
 * Checks a plugin; `where` names it in an error — `defineMailConfig:
 * plugins[1]`, or `defineMailPlugin: plugin`.
 */
function checkPlugin(
	plugin: unknown,
	call: string,
	where: string,
): asserts plugin is MailPlugin {
	if (!isObject(plugin)) {
		throw new TypeError(
			`${call}: ${where} must be a plugin object, as { name, ...config } — was it called?`,
		);
	}
	const { name } = plugin;
	if (typeof name !== 'string' || name.trim() === '') {
		throw new TypeError(
			`${call}: ${where} has no name — a plugin is { name, ...config }`,
		);
	}
	if (plugin.plugins !== undefined) {
		throw new TypeError(
			`${call}: plugin "${name}" lists plugins — a plugin cannot bring others; list them in the project`,
		);
	}
	checkHandlers(plugin, `${call}: plugin "${name}"`);
}

/**
 * Checks a plugin and answers it as it is: for a package that exports one, so
 * its mistakes surface where it is written, not in the project that uses it.
 * Typed `MailPlugin`, so a package's declarations can name what it exports.
 */
export function defineMailPlugin(plugin: MailPlugin): MailPlugin {
	checkPlugin(plugin, 'defineMailPlugin', 'plugin');
	return plugin;
}

/**
 * The project's Maizzle config: {@link baseConfig}, then each plugin in
 * order, then the rest of `config`. Objects merge and arrays replace, as in
 * Maizzle — except `components.source`, `vite.plugins` and `vue.plugins`,
 * which every layer adds to. Every build event runs each layer's handler, in
 * that order.
 */
export function defineMailConfig(config: MailConfig = {}): MaizzleConfig {
	if (!isObject(config)) {
		throw new TypeError(
			'defineMailConfig: config must be an object, as { plugins, ...maizzleConfig }',
		);
	}
	const { plugins = [], ...project } = config;
	if (!Array.isArray(plugins)) {
		throw new TypeError('defineMailConfig: plugins must be an array');
	}
	const names = new Set<string>();
	const layers = plugins.map((plugin: unknown, index) => {
		checkPlugin(plugin, 'defineMailConfig', `plugins[${index}]`);
		const { name, ...rest } = plugin;
		if (names.has(name)) {
			throw new TypeError(
				`defineMailConfig: two plugins are named "${name}" — is one listed twice?`,
			);
		}
		names.add(name);
		return rest;
	});
	checkHandlers(project, 'defineMailConfig');
	return layer([baseConfig, ...layers, project]);
}

/**
 * The production build's config, for `maizzle.config.production.ts`: the
 * project's `config`, with the HTML minified — with the project's own
 * `html.minify` options when it set some — then `overrides`, merged as a
 * plugin is: its `components.source`, `vite.plugins` and `vue.plugins` are
 * added to the project's, its build events run after the project's.
 *
 * ```ts
 * // maizzle.config.production.ts — `maizzle build -c maizzle.config.production.ts`
 * import config from './maizzle.config';
 * import { productionConfig } from '@nxgt/mail-config';
 *
 * export default productionConfig(config, { output: { path: 'dist-production' } });
 * ```
 */
export function productionConfig(
	config: MaizzleConfig & { readonly plugins?: never },
	overrides: MaizzleConfig & { readonly plugins?: never } = {},
): MaizzleConfig {
	if (!isObject(config)) {
		throw new TypeError(
			'productionConfig: config must be the project config, as productionConfig(config, overrides)',
		);
	}
	if (config.plugins !== undefined) {
		throw new TypeError(
			'productionConfig: config lists plugins — pass what defineMailConfig answered, not its argument',
		);
	}
	if (!isObject(overrides)) {
		throw new TypeError('productionConfig: overrides must be an object');
	}
	if (overrides.plugins !== undefined) {
		throw new TypeError(
			'productionConfig: overrides list plugins — list every plugin in the project config',
		);
	}
	checkHandlers(overrides, 'productionConfig');
	// Minify options the project already set are kept: `true` would replace them.
	const minify = isObject(config.html?.minify)
		? {}
		: { html: { minify: true } };
	return layer([config, minify, overrides]);
}
