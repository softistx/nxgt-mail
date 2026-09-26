import type { MaizzleConfig } from '@maizzle/framework';
import { createDefu } from 'defu';

/** The build events Maizzle reads from a config, in the order it fires them. */
export const EVENTS = [
	'beforeCreate',
	'beforeRender',
	'afterRender',
	'afterTransform',
	'afterBuild',
] as const;

type Event = (typeof EVENTS)[number];
// biome-ignore lint/suspicious/noExplicitAny: a handler of any of the five events.
type Handler = (params: any) => unknown;

/**
 * Maizzle's own merge, copied from `@maizzle/framework`'s config loader:
 * objects merge key by key, an array replaces the array under it.
 */
const merge = createDefu((target, key, value) => {
	if (Array.isArray(target[key])) {
		target[key] = value;
		return true;
	}
});

/**
 * The lists a plugin adds to rather than sets: two plugins that each bring
 * components, or each a Vite or a Vue plugin, keep both. Under Maizzle's rule
 * the last one would silently drop the others.
 */
const LISTS = [
	['components', 'source'],
	['vite', 'plugins'],
	['vue', 'plugins'],
] as const;

type Layer = Record<string, unknown>;

const isObject = (value: unknown): value is Layer =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** A `vue.plugins` may be a list, or a factory that answers one per render. */
function joinVuePlugins(values: unknown[]): unknown {
	if (values.every(Array.isArray)) return values.flat();
	return () =>
		values.flatMap((value) =>
			typeof value === 'function' ? (value as () => unknown[])() : value,
		);
}

/** Takes each list out of the layers, and answers them joined, in layer order. */
function takeLists(layers: Layer[]): [string, string, unknown][] {
	const joined: [string, string, unknown][] = [];
	for (const [group, key] of LISTS) {
		const values: unknown[] = [];
		for (const layer of layers) {
			const section = layer[group];
			// Skipped as Maizzle's merge skips it: `null` sets nothing.
			if (!isObject(section) || section[key] == null) continue;
			values.push(section[key]);
			const { [key]: _, ...rest } = section;
			layer[group] = rest;
		}
		if (values.length === 0) continue;
		const value =
			group === 'vue'
				? joinVuePlugins(values)
				: values.flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
		joined.push([group, key, value]);
	}
	return joined;
}

/**
 * One handler that runs every layer's, in order, the way Maizzle runs the
 * handlers it collects: for `beforeRender` a string replaces
 * `template.source`; for `afterRender` and `afterTransform` it replaces the
 * `html` the next one receives.
 */
function chain(event: Event, handlers: Handler[]): Handler {
	if (handlers.length === 1) return handlers[0] as Handler;
	if (event === 'beforeRender') {
		return async (params) => {
			for (const handler of handlers) {
				const result = await handler(params);
				if (typeof result === 'string') params.template.source = result;
			}
			return params.template.source;
		};
	}
	if (event === 'afterRender' || event === 'afterTransform') {
		return async ({ config, template, html }) => {
			let current: string = html;
			for (const handler of handlers) {
				const result = await handler({ config, template, html: current });
				if (typeof result === 'string') current = result;
			}
			return current;
		};
	}
	return async (params) => {
		for (const handler of handlers) await handler(params);
	};
}

/**
 * Layers configs, the first lowest: each key of a later one wins, objects
 * merge, arrays replace — except the {@link LISTS}, joined — and every build
 * event runs each layer's handler in order.
 */
export function layer(layers: readonly MaizzleConfig[]): MaizzleConfig {
	const copies: Layer[] = layers.map((config) => ({ ...config }));
	const handlers = new Map<Event, Handler[]>();
	for (const copy of copies) {
		for (const event of EVENTS) {
			const handler = copy[event];
			if (handler === undefined) continue;
			handlers.set(event, [...(handlers.get(event) ?? []), handler as Handler]);
			delete copy[event];
		}
	}
	const lists = takeLists(copies);
	const merged: Layer = merge({}, ...copies.reverse());
	for (const [group, key, value] of lists) {
		merged[group] = { ...(merged[group] as Layer | undefined), [key]: value };
	}
	for (const [event, list] of handlers) merged[event] = chain(event, list);
	return merged as MaizzleConfig;
}
