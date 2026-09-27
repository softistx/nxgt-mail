import { describe, expect, test } from 'bun:test';
import { guardUnresolved } from './unresolved';

/** Runs guarded code with `resolveComponent` answering from `registered`. */
function render(code: string, registered: Record<string, unknown>): unknown {
	const resolve = (name: string) => registered[name] ?? name;
	return new Function('_resolveComponent', `${code}\nreturn _component;`)(
		resolve,
	);
}

describe('guardUnresolved', () => {
	test('leaves code without a tag resolved by name alone', () => {
		expect(guardUnresolved('const a = 1;', 'emails/a.vue')).toBeNull();
	});

	test('throws where the component renders, naming the tag and the file', () => {
		const code = guardUnresolved(
			'const _component = _resolveComponent("NxButon")',
			'emails/welcome.vue',
		) as string;
		expect(() => render(code, {})).toThrow(
			'ui: <NxButon> in emails/welcome.vue is no component — check its name, or add the plugin or the components folder that brings it',
		);
	});

	test('passes a component the app registered', () => {
		const greeting = { name: 'Greeting' };
		const code = guardUnresolved(
			'const _component = _resolveComponent("Greeting")',
			'emails/welcome.vue',
		) as string;
		// biome-ignore lint/style/useNamingConvention: a component's name.
		expect(render(code, { Greeting: greeting })).toBe(greeting);
	});

	test('keeps the lines where they were, and leaves a self-reference alone', () => {
		const source = [
			'const _component = _resolveComponent("Tree", true)',
			'const b = _resolveComponent1("NxCard")',
		].join('\n');
		const code = guardUnresolved(source, 'components/tree.vue') as string;
		const lines = code.split('\n');
		expect(lines[0]).toBe('const _component = _resolveComponent("Tree", true)');
		expect(lines[1]).toBe(
			'const b = __nxgtResolved(_resolveComponent1("NxCard"), "NxCard")',
		);
	});
});
