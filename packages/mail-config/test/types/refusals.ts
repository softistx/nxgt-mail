/**
 * What `@nxgt/mail-config` refuses at COMPILE time.
 *
 * Checked by `tsc --noEmit`, never run. Every `@ts-expect-error` here is a
 * refusal that stops holding the moment the directive goes unused — so a
 * refusal that quietly weakens fails the typecheck instead of passing
 * unnoticed. The count is in the README; a count that goes down is a
 * regression.
 *
 * The calls that **must keep compiling** are here too, unmarked: a refusal
 * that refuses the correct call is a bug.
 *
 * Maizzle's own config type takes any key (`[key: string]: any`), so a
 * misspelled Maizzle key is not refused; what this package adds is.
 *
 * **Six plausible mistakes, six refused.**
 */

import {
	defineMailConfig,
	defineMailPlugin,
	type MailPlugin,
	productionConfig,
} from '../../src/index';

// Must keep compiling.
const brand: MailPlugin = defineMailPlugin({
	name: 'brand',
	components: { source: [{ path: '/abs/components', prefix: 'Nx' }] },
	beforeRender: ({ template }) => template.source.replace('a', 'b'),
	afterTransform: async ({ html }) => html,
});
const config = defineMailConfig({
	plugins: [brand, { name: 'other', plaintext: false }],
	afterBuild: ({ files }) => {
		files.length;
	},
});
productionConfig(config, { output: { path: 'dist-production' } });

// 1. A plugin without a name.
// @ts-expect-error — a plugin is { name, ...config }.
defineMailConfig({ plugins: [{ output: { path: 'x' } }] });

// 2. `plugins` as one plugin rather than a list.
// @ts-expect-error — plugins is an array.
defineMailConfig({ plugins: brand });

// 3. A build event that is not a function.
// @ts-expect-error — beforeRender is a handler.
defineMailConfig({ beforeRender: 'x' });

// 4. A plugin that brings other plugins.
// @ts-expect-error — the project lists every plugin.
defineMailPlugin({ name: 'bundle', plugins: [brand] });

// 5. productionConfig given defineMailConfig's argument instead of its result.
// @ts-expect-error — pass what defineMailConfig answered.
productionConfig({ plugins: [brand] });

// 6. Plugins added in the production overrides.
// @ts-expect-error — plugins belong in the project config.
productionConfig(config, { plugins: [brand] });
