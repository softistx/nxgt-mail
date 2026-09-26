import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Catalogues } from './messages/catalogue';
import type { MessageSource } from './messages/compile';

/**
 * Tailwind CSS 4 theme tokens, by namespace: `{ color: { primary: '#2563eb' } }`
 * is `--color-primary`, which Tailwind turns into `bg-primary`, `text-primary`…
 * Names are camelCase, written kebab-case in the CSS: `color.textMuted` is
 * `--color-text-muted`.
 */
export type Theme = Readonly<Record<string, Readonly<Record<string, string>>>>;

/**
 * Defaults a package ships without forcing them: theme tokens, components and
 * messages. The build applies the presets of a config in order — a later one
 * overrides an earlier one token by token, component by component, message by
 * message — and the application's own files last.
 */
export interface Preset {
	/** Named in the errors: `nxgt`. */
	readonly name: string;
	/** Tailwind tokens, written to the `theme.css` a layout imports. */
	readonly theme?: Theme;
	/**
	 * Vue single-file components by file name, as `{ 'Transactional.vue':
	 * source }`: each one usable in a template as `<Transactional>`.
	 */
	readonly components?: Readonly<Record<string, string>>;
	/** Catalogues by locale, merged before the application's. */
	readonly messages?: Catalogues;
}

/** Types a preset: `export const myPreset = definePreset({ … })`. */
export function definePreset(preset: Preset): Preset {
	return preset;
}

/** The presets of a config, merged: what the build renders with. */
export interface ResolvedPresets {
	readonly theme: Theme;
	/** Component file name → source; the application's own included, last. */
	readonly components: Readonly<Record<string, string>>;
	/** One message source per preset that has messages, in order. */
	readonly messageSources: readonly MessageSource[];
}

const NAME = /^[a-z][a-zA-Z0-9]*$/;
const COMPONENT = /^[A-Z][A-Za-z0-9]*\.vue$/;
// A value that could close the declaration, the block, or the file's line.
const UNSAFE_VALUE = /[;{}\r\n\u0085\u2028\u2029]|\/\*/;

const kebab = (name: string) =>
	name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

let maizzleComponents: Promise<ReadonlySet<string>> | undefined;

/** The components Maizzle ships: a preset may not replace one. */
function builtInComponents(): Promise<ReadonlySet<string>> {
	maizzleComponents ??= (async () => {
		const entry = fileURLToPath(import.meta.resolve('@maizzle/framework'));
		const names = await readdir(join(dirname(entry), 'components'));
		return new Set(names.filter((name) => name.endsWith('.vue')));
	})();
	return maizzleComponents;
}

function checkTheme(where: string, theme: unknown): Theme {
	if (typeof theme !== 'object' || theme === null || Array.isArray(theme)) {
		throw new TypeError(
			`build: ${where}: theme must be an object of namespaces, as { color: { primary: '#2563eb' } }`,
		);
	}
	for (const [namespace, tokens] of Object.entries(theme)) {
		if (!NAME.test(namespace)) {
			throw new TypeError(
				`build: ${where}: the theme namespace ${namespace} is not camelCase, as color or fontWeight`,
			);
		}
		if (
			typeof tokens !== 'object' ||
			tokens === null ||
			Array.isArray(tokens)
		) {
			throw new TypeError(
				`build: ${where}: theme.${namespace} must be an object of tokens, as { primary: '#2563eb' }`,
			);
		}
		for (const [token, value] of Object.entries(tokens)) {
			if (!NAME.test(token)) {
				throw new TypeError(
					`build: ${where}: the theme token ${namespace}.${token} is not camelCase, as textMuted`,
				);
			}
			if (typeof value !== 'string' || value.trim() === '') {
				throw new TypeError(
					`build: ${where}: the theme token ${namespace}.${token} must be a CSS value, as '#2563eb'`,
				);
			}
			if (UNSAFE_VALUE.test(value)) {
				throw new TypeError(
					`build: ${where}: the theme token ${namespace}.${token} holds ;, a brace, a comment or a line break — write one CSS value`,
				);
			}
		}
	}
	return theme as Theme;
}

async function checkComponents(
	where: string,
	components: unknown,
): Promise<Readonly<Record<string, string>>> {
	if (
		typeof components !== 'object' ||
		components === null ||
		Array.isArray(components)
	) {
		throw new TypeError(
			`build: ${where}: components must be an object of sources by file name, as { 'Transactional.vue': '<template>…</template>' }`,
		);
	}
	const builtIn = await builtInComponents();
	for (const [file, source] of Object.entries(components)) {
		if (!COMPONENT.test(file)) {
			throw new TypeError(
				`build: ${where}: the component ${file} is not a PascalCase .vue file name, as Transactional.vue`,
			);
		}
		if (builtIn.has(file)) {
			throw new TypeError(
				`build: ${where}: the component ${file} would replace Maizzle's <${file.slice(0, -'.vue'.length)}> — give it a name of its own`,
			);
		}
		if (typeof source !== 'string') {
			throw new TypeError(
				`build: ${where}: the component ${file} must be the source of a single-file component`,
			);
		}
	}
	return components as Readonly<Record<string, string>>;
}

/**
 * Merges presets in order, then the application's own components: a later
 * token, component or message overrides an earlier one, never a whole
 * namespace. A preset is data a package wrote: checked before it is used, a
 * mistake in it a `TypeError`.
 */
export async function resolvePresets(
	presets: readonly Preset[],
	appComponents: Readonly<Record<string, string>> = {},
): Promise<ResolvedPresets> {
	const theme: Record<string, Record<string, string>> = {};
	const components: Record<string, string> = {};
	const messageSources: MessageSource[] = [];
	const names = new Set<string>();
	for (const [index, preset] of presets.entries()) {
		if (typeof preset !== 'object' || preset === null) {
			throw new TypeError(
				`build: presets[${index}] is not a preset — pass what a preset function returns, as nxgtPreset()`,
			);
		}
		if (typeof preset.name !== 'string' || !NAME.test(preset.name)) {
			throw new TypeError(
				`build: presets[${index}] has no camelCase name — name it, as definePreset({ name: 'acme', … })`,
			);
		}
		if (names.has(preset.name)) {
			throw new TypeError(
				`build: two presets are named ${preset.name} — a preset is listed once`,
			);
		}
		names.add(preset.name);
		const where = `preset ${preset.name}`;
		if (preset.theme !== undefined) {
			for (const [namespace, tokens] of Object.entries(
				checkTheme(where, preset.theme),
			)) {
				theme[namespace] = { ...theme[namespace], ...tokens };
			}
		}
		if (preset.components !== undefined) {
			Object.assign(
				components,
				await checkComponents(where, preset.components),
			);
		}
		if (preset.messages !== undefined) {
			messageSources.push({ name: where, catalogues: preset.messages });
		}
	}
	Object.assign(
		components,
		await checkComponents('components/', appComponents),
	);
	return { theme, components, messageSources };
}

/**
 * The `theme.css` a layout imports beside Maizzle's Tailwind:
 * `@import "./theme.css";`. Empty of tokens when no preset has a theme.
 */
export function themeCss(theme: Theme): string {
	const lines = Object.entries(theme).flatMap(([namespace, tokens]) =>
		Object.entries(tokens).map(
			([token, value]) => `\t--${kebab(namespace)}-${kebab(token)}: ${value};`,
		),
	);
	return `@theme {\n${lines.join('\n')}${lines.length === 0 ? '' : '\n'}}\n`;
}
