import { describe, expect, test } from 'bun:test';
import { definePreset, type Preset, resolvePresets, themeCss } from './presets';

const base = definePreset({
	name: 'base',
	theme: { color: { primary: '#2563eb', canvas: '#f4f4f5' } },
	components: {
		'Card.vue': '<template><div>base</div></template>',
		'Footer.vue': '<template><p>base</p></template>',
	},
	messages: { en: { common: { hello: 'Hello' } } },
});
const brand = definePreset({
	name: 'brand',
	theme: {
		color: { primary: '#e11d48' },
		radius: { buttonLarge: '8px' },
	},
	components: { 'Card.vue': '<template><div>brand</div></template>' },
});

describe('resolvePresets', () => {
	test('applies presets in order: a later token, component or message wins', async () => {
		const resolved = await resolvePresets([base, brand]);
		expect(resolved.theme).toEqual({
			color: { primary: '#e11d48', canvas: '#f4f4f5' },
			radius: { buttonLarge: '8px' },
		});
		expect(resolved.components).toEqual({
			'Card.vue': '<template><div>brand</div></template>',
			'Footer.vue': '<template><p>base</p></template>',
		});
		expect(resolved.messageSources).toEqual([
			{
				name: 'preset base',
				catalogues: { en: { common: { hello: 'Hello' } } },
			},
		]);
	});

	test("applies the application's components last", async () => {
		const resolved = await resolvePresets([base], {
			'Footer.vue': '<template><p>app</p></template>',
		});
		expect(resolved.components['Footer.vue']).toBe(
			'<template><p>app</p></template>',
		);
	});

	test('answers nothing to merge without presets', async () => {
		expect(await resolvePresets([])).toEqual({
			theme: {},
			components: {},
			messageSources: [],
		});
	});
});

describe('resolvePresets refuses a preset that is not one', () => {
	const refuse = (presets: readonly unknown[], message: string) =>
		expect(resolvePresets(presets as readonly Preset[])).rejects.toThrow(
			new TypeError(message),
		);

	test('not an object, no name, the same name twice', async () => {
		await refuse(
			[undefined],
			'build: presets[0] is not a preset — pass what a preset function returns, as nxgtPreset()',
		);
		await refuse(
			[{ theme: {} }],
			"build: presets[0] has no camelCase name — name it, as definePreset({ name: 'acme', … })",
		);
		await refuse(
			[base, base],
			'build: two presets are named base — a preset is listed once',
		);
	});

	test('a component that is not PascalCase, or that replaces one of Maizzle’s', async () => {
		await refuse(
			[{ name: 'a', components: { 'card.vue': '' } }],
			'build: preset a: the component card.vue is not a PascalCase .vue file name, as Transactional.vue',
		);
		await refuse(
			[{ name: 'a', components: { 'Button.vue': '' } }],
			"build: preset a: the component Button.vue would replace Maizzle's <Button> — give it a name of its own",
		);
		await refuse(
			[{ name: 'a', components: { 'Card.vue': 1 } }],
			'build: preset a: the component Card.vue must be the source of a single-file component',
		);
		await refuse(
			[{ name: 'a', components: ['Card.vue'] }],
			"build: preset a: components must be an object of sources by file name, as { 'Transactional.vue': '<template>…</template>' }",
		);
	});

	test('a theme token that is not camelCase, or not one CSS value', async () => {
		await refuse(
			[{ name: 'a', theme: Object.fromEntries([['Color', {}]]) }],
			'build: preset a: the theme namespace Color is not camelCase, as color or fontWeight',
		);
		await refuse(
			[{ name: 'a', theme: { color: { 'text-muted': '#000' } } }],
			'build: preset a: the theme token color.text-muted is not camelCase, as textMuted',
		);
		await refuse(
			[{ name: 'a', theme: { color: '#000' } }],
			"build: preset a: theme.color must be an object of tokens, as { primary: '#2563eb' }",
		);
		await refuse(
			[{ name: 'a', theme: { color: { primary: '' } } }],
			"build: preset a: the theme token color.primary must be a CSS value, as '#2563eb'",
		);
		for (const value of ['red; } body { color: red', 'red\n', 'red /* x */']) {
			await refuse(
				[{ name: 'a', theme: { color: { primary: value } } }],
				'build: preset a: the theme token color.primary holds ;, a brace, a comment or a line break — write one CSS value',
			);
		}
		await refuse(
			[{ name: 'a', theme: [] }],
			"build: preset a: theme must be an object of namespaces, as { color: { primary: '#2563eb' } }",
		);
	});
});

describe('themeCss', () => {
	test('writes each token as a Tailwind variable, kebab-case', () => {
		expect(
			themeCss({
				color: { primary: '#2563eb', textMuted: '#71717a' },
				fontWeight: { heavy: '800' },
			}),
		).toBe(
			'@theme {\n\t--color-primary: #2563eb;\n\t--color-text-muted: #71717a;\n\t--font-weight-heavy: 800;\n}\n',
		);
	});

	test('writes an empty block without a theme', () => {
		expect(themeCss({})).toBe('@theme {\n}\n');
	});
});
