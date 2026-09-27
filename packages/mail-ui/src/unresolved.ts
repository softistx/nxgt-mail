import { relative } from 'node:path';
import type { MaizzleConfig } from '@maizzle/framework';

/** A Vite plugin, as Maizzle's `vite.plugins` takes one. */
type VitePlugin = NonNullable<
	NonNullable<MaizzleConfig['vite']>['plugins']
>[number];

/**
 * A tag the compiled template still asks Vue for by name: what
 * unplugin-vue-components matches, and leaves as is when no file answers to
 * it, and the literal `is` of `<component>` — `is="NxButton"`, or
 * `:is="'NxButton'"`, which keeps its single quotes. A self-reference
 * (`_resolveComponent("Tree", true)`) is not matched.
 */
const RESOLVE = /\b_resolve(?:Dynamic)?Component\d*\((["'])([^"'\n]+)\1\)/g;

/**
 * A name only a component can have, as Maizzle names them: `NxButton`, or
 * `nx-button`. A lowercase tag Vue does not know (`center`, `font`, `big`)
 * is HTML an e-mail still uses, which Vue writes as it is, and so does a
 * namespaced one (`o:p`, `v:rect`): neither is guarded.
 */
const COMPONENT_NAME = /^(?:[A-Z]|[a-z][\w]*-)[\w-]*$/;

/** A Vue file, a Markdown template, or one of their sub-requests. */
const TEMPLATE = /\.(vue|md)($|\?)/;

/** Maizzle's built-ins resolve their own imports; leave them be. */
const MAIZZLE = /[\\/]node_modules[\\/]@maizzle[\\/]framework[\\/]/;

const GUARD = '__nxgtResolved';

/**
 * `code` with every tag still resolved by name wrapped in a guard, or `null`
 * when it has none. The guard runs where the component would render: a
 * component registered on the app (`app.component`) resolves and passes; a
 * name nothing registered comes back from Vue as the name itself, and the
 * guard throws, naming the tag and `file`. Line numbers are kept: the
 * helper goes at the end, and a function declaration is hoisted.
 */
export function guardUnresolved(code: string, file: string): string | null {
	let found = false;
	const guarded = code.replace(RESOLVE, (call, _quote, tag: string) => {
		if (!COMPONENT_NAME.test(tag)) return call;
		found = true;
		return `${GUARD}(${call}, ${JSON.stringify(tag)})`;
	});
	if (!found) return null;
	const message = JSON.stringify(
		` in ${file} is no component — check its name, or add the plugin or the components folder that brings it`,
	);
	return [
		guarded,
		`function ${GUARD}(component, tag) {`,
		`\tif (typeof component === 'string') throw new Error('ui: <' + tag + '>' + ${message});`,
		'\treturn component;',
		'}',
		'',
	].join('\n');
}

/**
 * Fails the build on a tag that resolves to no component — `<NxButon>` for
 * `<NxButton>`, nested anywhere. Vue renders such a tag as an unknown
 * element, or as nothing, and only warns, in development only. Runs after
 * every component resolver, Maizzle's and the one for installed files.
 */
export function unresolvedComponents(): VitePlugin {
	let root = process.cwd();
	return {
		name: 'nxgt:mail-ui:unresolved',
		enforce: 'post',
		configResolved(config: { readonly root: string }) {
			root = config.root;
		},
		transform: {
			order: 'post',
			handler(code: string, id: string) {
				if (!TEMPLATE.test(id) || MAIZZLE.test(id)) return null;
				const file = relative(root, id.split('?')[0] as string)
					.split('\\')
					.join('/');
				const guarded = guardUnresolved(code, file);
				return guarded === null ? null : { code: guarded, map: null };
			},
		},
	};
}
