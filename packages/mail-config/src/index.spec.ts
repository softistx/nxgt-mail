import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { MaizzleConfig } from '@maizzle/framework';
import {
	baseConfig,
	breakBlocks,
	defineMailConfig,
	defineMailPlugin,
	type MailPlugin,
	productionConfig,
} from './index';

const template = (source: string) => ({ source, path: {} });

// biome-ignore lint/suspicious/noExplicitAny: a hook's params, as Maizzle passes them.
const fire = (config: MaizzleConfig, event: string, params: any) =>
	(config[event] as (params: unknown) => unknown)(params);

describe('defineMailConfig — the layers', () => {
	test('answers the base config for a project with nothing', () => {
		expect(defineMailConfig()).toEqual(baseConfig);
		expect(defineMailConfig({})).toEqual({ ...baseConfig });
	});

	test('layers base, then each plugin in order, then the project', () => {
		const config = defineMailConfig({
			plugins: [
				{
					name: 'a',
					output: { path: 'a', extension: 'htm' },
					css: { purge: false },
				},
				{ name: 'b', output: { path: 'b' } },
			],
			output: { path: 'project' },
		});
		expect(config).toEqual({
			...baseConfig,
			output: { path: 'project', extension: 'htm' },
			css: { purge: false },
		});
	});

	test('a plugin overrides the base, and the project a plugin', () => {
		expect(
			defineMailConfig({ plugins: [{ name: 'a', plaintext: false }] })
				.plaintext,
		).toBe(false);
		expect(
			defineMailConfig({
				plugins: [{ name: 'a', plaintext: false }],
				plaintext: { extension: 'text' },
			}).plaintext,
		).toEqual({ extension: 'text', options: { cb: breakBlocks } });
	});

	test("an array replaces the one under it, as in Maizzle's own merge", () => {
		const config = defineMailConfig({
			plugins: [{ name: 'a', static: { source: ['a/**'], destination: 'a' } }],
			static: { source: ['project/**'] },
		});
		expect(config.static).toEqual({ source: ['project/**'], destination: 'a' });
	});

	test('components.source and vite.plugins are joined, in layer order', () => {
		const viteA = { name: 'vite-a' };
		const viteB = { name: 'vite-b' };
		const config = defineMailConfig({
			plugins: [
				{
					name: 'a',
					components: { source: { path: 'a', prefix: 'A' } },
					vite: { plugins: [viteA], base: '/a' },
				},
				{ name: 'b', vite: { plugins: [viteB] } },
			],
			components: { source: ['project'] },
		});
		expect(config.components).toEqual({
			source: [{ path: 'a', prefix: 'A' }, 'project'],
		});
		expect(config.vite).toEqual({ base: '/a', plugins: [viteA, viteB] });
	});

	test('vue.plugins are joined, a factory kept a factory', () => {
		const one = { install() {} };
		const two = { install() {} };
		const lists = defineMailConfig({
			plugins: [{ name: 'a', vue: { plugins: [one] } }],
			vue: { plugins: [two] },
		});
		expect(lists.vue?.plugins).toEqual([one, two]);

		const factory = defineMailConfig({
			plugins: [{ name: 'a', vue: { plugins: () => [one] } }],
			vue: { plugins: [two], globalProperties: { x: 1 } },
		});
		const joined = factory.vue?.plugins as () => unknown[];
		expect(typeof joined).toBe('function');
		expect(joined()).toEqual([one, two]);
		expect(factory.vue?.globalProperties).toEqual({ x: 1 });
	});

	test("a null list sets nothing, as in Maizzle's merge", () => {
		const config = defineMailConfig({
			plugins: [{ name: 'a', components: { source: ['a'] } }],
			components: { source: null as never },
		});
		expect(config.components).toEqual({ source: ['a'] });
	});

	test('the base config cannot be changed by a consumer', () => {
		expect(Object.isFrozen(baseConfig)).toBe(true);
	});

	test('changes neither the plugins nor the project it is given', () => {
		const plugin = {
			name: 'a',
			components: { source: ['a'] },
			beforeRender: () => undefined,
		};
		const project = { plugins: [plugin], components: { source: ['p'] } };
		defineMailConfig(project);
		expect(project).toEqual({
			plugins: [plugin],
			components: { source: ['p'] },
		});
		expect(plugin.name).toBe('a');
		expect(plugin.components).toEqual({ source: ['a'] });
		expect(typeof plugin.beforeRender).toBe('function');
	});

	test('passes neither plugins nor a name to Maizzle', () => {
		const config = defineMailConfig({ plugins: [{ name: 'a', root: 'src' }] });
		expect(config).toEqual({ ...baseConfig, root: 'src' });
	});
});

describe('defineMailConfig — the build events', () => {
	test("the base tidies the text parts before a plugin's or the project's afterBuild reads them", async () => {
		const { mkdtempSync, readFileSync, writeFileSync } = await import(
			'node:fs'
		);
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const file = join(
			mkdtempSync(join(tmpdir(), 'nxgt-mail-config-')),
			'a.txt',
		);
		writeFileSync(file, 'One.\n\n\n\u200DTwo.');
		let read = '';
		const config = defineMailConfig({
			afterBuild: () => {
				read = readFileSync(file, 'utf8');
			},
		});
		await fire(config, 'afterBuild', { files: [file], config });
		expect(read).toBe('One.\n\nTwo.\n');
	});

	test('the base plaintext options cannot be changed through a config', () => {
		const config = defineMailConfig();
		expect(() => {
			(config.plaintext as { options: Record<string, unknown> }).options.x = 1;
		}).toThrow(TypeError);
	});

	test('a single handler is handed to Maizzle as it is', () => {
		const afterRender = () => undefined;
		expect(defineMailConfig({ afterRender }).afterRender).toBe(afterRender);
	});

	test('beforeRender: each string replaces template.source for the next one', async () => {
		const seen: string[] = [];
		const config = defineMailConfig({
			plugins: [
				{
					name: 'a',
					beforeRender: ({ template }) => {
						seen.push(template.source);
						return `${template.source} a`;
					},
				},
				{
					name: 'b',
					beforeRender: ({ template }) => {
						seen.push(template.source);
					},
				},
			],
			beforeRender: async ({ template }) => {
				seen.push(template.source);
				return `${template.source} project`;
			},
		});
		const params = { config: {}, template: template('source') };
		expect(await fire(config, 'beforeRender', params)).toBe('source a project');
		expect(params.template.source).toBe('source a project');
		expect(seen).toEqual(['source', 'source a', 'source a']);
	});

	test('afterRender and afterTransform: each string is the html the next one gets', async () => {
		for (const event of ['afterRender', 'afterTransform'] as const) {
			const config = defineMailConfig({
				plugins: [
					{ name: 'a', [event]: ({ html }: { html: string }) => `${html}a` },
					{ name: 'b', [event]: () => undefined },
				],
				[event]: async ({ html }: { html: string }) => `${html}p`,
			});
			const params = { config: {}, template: template(''), html: '<p>' };
			expect(await fire(config, event, params)).toBe('<p>ap');
			expect(params.html).toBe('<p>');
		}
	});

	test('beforeCreate and afterBuild: every handler runs, in order, one after the other', async () => {
		for (const event of ['beforeCreate', 'afterBuild'] as const) {
			const order: string[] = [];
			const handler = (name: string) => async () => {
				await Promise.resolve();
				order.push(name);
			};
			const config = defineMailConfig({
				plugins: [
					{ name: 'a', [event]: handler('a') },
					{ name: 'b', [event]: handler('b') },
				],
				[event]: handler('project'),
			});
			expect(
				await fire(config, event, { config: {}, files: [] }),
			).toBeUndefined();
			expect(order).toEqual(['a', 'b', 'project']);
		}
	});

	test('a handler that throws stops the chain, and the error reaches Maizzle', async () => {
		const failure = new Error('catalogue broken');
		let after = false;
		const config = defineMailConfig({
			plugins: [
				{
					name: 'a',
					beforeRender: () => {
						throw failure;
					},
				},
			],
			beforeRender: () => {
				after = true;
			},
		});
		await expect(
			fire(config, 'beforeRender', { config: {}, template: template('') }),
		).rejects.toBe(failure);
		expect(after).toBe(false);
	});
});

describe('defineMailConfig — wiring mistakes', () => {
	const refuses = (config: unknown, message: string) =>
		expect(() => defineMailConfig(config as never)).toThrow(
			new TypeError(message),
		);

	test('refuses what is not a config', () => {
		refuses(
			null,
			'defineMailConfig: config must be an object, as { plugins, ...maizzleConfig }',
		);
		refuses(
			[],
			'defineMailConfig: config must be an object, as { plugins, ...maizzleConfig }',
		);
		refuses({ plugins: {} }, 'defineMailConfig: plugins must be an array');
	});

	test('refuses a plugin that is not one', () => {
		refuses(
			{ plugins: [() => ({ name: 'a' })] },
			'defineMailConfig: plugins[0] must be a plugin object, as { name, ...config } — was it called?',
		);
		refuses(
			{ plugins: [{ name: 'a' }, { output: {} }] },
			'defineMailConfig: plugins[1] has no name — a plugin is { name, ...config }',
		);
		refuses(
			{ plugins: [{ name: ' ' }] },
			'defineMailConfig: plugins[0] has no name — a plugin is { name, ...config }',
		);
		refuses(
			{ plugins: [{ name: 'a', plugins: [] }] },
			'defineMailConfig: plugin "a" lists plugins — a plugin cannot bring others; list them in the project',
		);
	});

	test('refuses two plugins of the same name', () => {
		refuses(
			{ plugins: [{ name: 'i18n' }, { name: 'i18n' }] },
			'defineMailConfig: two plugins are named "i18n" — is one listed twice?',
		);
	});

	test('refuses a build event that is not a function', () => {
		refuses(
			{ plugins: [{ name: 'a', afterBuild: 'build' }] },
			'defineMailConfig: plugin "a": afterBuild must be a function',
		);
		refuses(
			{ beforeRender: {} },
			'defineMailConfig: beforeRender must be a function',
		);
	});
});

describe('defineMailPlugin', () => {
	test('answers the plugin it is given', () => {
		const plugin: MailPlugin = { name: 'a', plaintext: false };
		expect(defineMailPlugin(plugin)).toBe(plugin);
	});

	test('refuses a plugin with no name, where it is written', () => {
		expect(() => defineMailPlugin({ output: {} } as never)).toThrow(
			new TypeError(
				'defineMailPlugin: plugin has no name — a plugin is { name, ...config }',
			),
		);
		expect(() =>
			defineMailPlugin({ name: 'a', beforeRender: 1 } as never),
		).toThrow(
			new TypeError(
				'defineMailPlugin: plugin "a": beforeRender must be a function',
			),
		);
	});
});

describe('productionConfig', () => {
	test('minifies the HTML over the project config, then applies the overrides', () => {
		const config = defineMailConfig({ output: { path: 'dist' } });
		expect(productionConfig(config)).toEqual({
			...baseConfig,
			output: { path: 'dist' },
			html: { minify: true },
		});
		expect(
			productionConfig(config, {
				output: { path: 'dist-production' },
				html: { minify: { lineLengthLimit: 1000 } },
			}),
		).toEqual({
			...baseConfig,
			output: { path: 'dist-production' },
			html: { minify: { lineLengthLimit: 1000 } },
		});
	});

	test('keeps the minify options the project set', () => {
		const config = defineMailConfig({
			html: { minify: { lineLengthLimit: 1000 }, decodeEntities: false },
		});
		expect(productionConfig(config).html).toEqual({
			minify: { lineLengthLimit: 1000 },
			decodeEntities: false,
		});
	});

	test("keeps the project's hooks, and chains an override's after them", async () => {
		const config = defineMailConfig({
			afterTransform: ({ html }) => `${html}p`,
		});
		const production = productionConfig(config, {
			afterTransform: ({ html }) => `${html}!`,
		});
		expect(
			await fire(production, 'afterTransform', {
				config: {},
				template: template(''),
				html: '',
			}),
		).toBe('p!');
	});

	test('refuses what is not a config', () => {
		expect(() => productionConfig(undefined as never)).toThrow(
			new TypeError(
				'productionConfig: config must be the project config, as productionConfig(config, overrides)',
			),
		);
		expect(() => productionConfig({ plugins: [] } as never)).toThrow(
			new TypeError(
				'productionConfig: config lists plugins — pass what defineMailConfig answered, not its argument',
			),
		);
		expect(() => productionConfig({}, { plugins: [] } as never)).toThrow(
			new TypeError(
				'productionConfig: overrides list plugins — list every plugin in the project config',
			),
		);
		expect(() => productionConfig({}, [] as never)).toThrow(
			new TypeError('productionConfig: overrides must be an object'),
		);
		expect(() => productionConfig({}, { afterBuild: 1 } as never)).toThrow(
			new TypeError('productionConfig: afterBuild must be a function'),
		);
	});
});
