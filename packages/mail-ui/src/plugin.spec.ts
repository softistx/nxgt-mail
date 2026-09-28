import { describe, expect, test } from 'bun:test';
import { COMPONENTS_DIR, ui } from './plugin';

const refuses = (options: unknown, message: string) =>
	expect(() => ui(options as never)).toThrow(new TypeError(message));

const brand = { name: 'Acme' };

describe('ui — wiring mistakes', () => {
	test('refuses options that are not an object', () => {
		refuses(
			undefined,
			"ui: options must be an object, as { brand: { name: 'Acme' } }",
		);
	});

	test('refuses a brand without a name', () => {
		const object =
			"ui: brand must be an object, as { name: 'Acme', url: 'https://acme.example' }";
		refuses({}, object);
		refuses({ brand: 'Acme' }, object);
		const name = 'ui: brand.name must be the name the e-mails show';
		refuses({ brand: {} }, name);
		refuses({ brand: { name: ' ' } }, name);
	});

	test('refuses a URL a mail client cannot follow', () => {
		refuses(
			{ brand: { name: 'Acme', url: '/home' } },
			'ui: brand.url must be an absolute http(s) URL',
		);
		const logo =
			'ui: brand.logo.src must be an absolute http(s) URL — a mail client loads nothing relative';
		refuses({ brand: { name: 'Acme', logo: 'logo.png' } }, logo);
		refuses({ brand: { name: 'Acme', logo: { src: 'logo.png' } } }, logo);
	});

	test('refuses a logo width or alt that is not one', () => {
		const src = 'https://acme.example/logo.png';
		for (const width of [0, 1.5, '96']) {
			refuses(
				{ brand: { name: 'Acme', logo: { src, width } } },
				'ui: brand.logo.width must be a width in pixels',
			);
		}
		refuses(
			{ brand: { name: 'Acme', logo: { src, alt: 1 } } },
			'ui: brand.logo.alt must be a string',
		);
	});

	test('refuses a theme that is not tokens of theme.css', () => {
		refuses(
			{ brand, theme: ['#0f766e'] },
			"ui: theme must be an object of tokens, as { 'color-primary': '#0f766e' }",
		);
		refuses(
			{ brand, theme: { 'color-primay': '#0f766e' } },
			'ui: theme.color-primay is not a token of the theme — name one of theme.css without its --, as color-primary',
		);
		refuses(
			{ brand, theme: { '--color-primary': '#0f766e' } },
			'ui: theme.--color-primary is not a token of the theme — name one of theme.css without its --, as color-primary',
		);
		for (const value of [
			'',
			'red; } body { color: red',
			'red /*',
			'"x',
			"url('x')",
			'a\n b',
			'a\\62',
			1,
		]) {
			refuses(
				{ brand, theme: { 'color-primary': value } },
				'ui: theme.color-primary must be a CSS value, as #0f766e or 8px',
			);
		}
	});
});

describe('ui — the plugin', () => {
	test('registers the components under Nx, and gives every template the brand', () => {
		const plugin = ui({ brand: { name: 'Acme', url: 'https://acme.example' } });
		expect(plugin.name).toBe('ui');
		expect(plugin.components?.source).toEqual([
			{ path: COMPONENTS_DIR, prefix: 'Nx' },
		]);
		expect(plugin.vue?.globalProperties).toEqual({
			brand: { name: 'Acme', url: 'https://acme.example' },
		});
	});

	test('provides the theme with the overrides after it, so they win', () => {
		const provided = new Map<unknown, unknown>();
		const plugins = ui({ brand, theme: { 'color-primary': ' #0f766e ' } }).vue
			?.plugins as { install(app: unknown): void }[];
		for (const plugin of plugins) {
			plugin.install({
				config: {},
				provide: (key: unknown, value: unknown) => provided.set(key, value),
			});
		}
		const { css } = provided.get('nxgt:mail-ui') as { css: string };
		expect(css).toContain('--color-primary: oklch(46% 0.1135 276.35);');
		expect(css.endsWith('@theme {\n\t--color-primary: #0f766e;\n}\n')).toBe(
			true,
		);
	});

	test('defaults primary-dark to primary, and refuses it like any other token', () => {
		const provided = new Map<unknown, unknown>();
		const plugins = ui({ brand }).vue?.plugins as {
			install(app: unknown): void;
		}[];
		for (const plugin of plugins) {
			plugin.install({
				config: {},
				provide: (key: unknown, value: unknown) => provided.set(key, value),
			});
		}
		const { css } = provided.get('nxgt:mail-ui') as { css: string };
		expect(css).toContain('--color-primary-dark: var(--color-primary);');
		expect(css).toContain(
			'--color-primary-foreground-dark: var(--color-primary-foreground);',
		);
		refuses(
			{ brand, theme: { 'color-primary-dark': 'red; } body { color: red' } },
			'ui: theme.color-primary-dark must be a CSS value, as #0f766e or 8px',
		);
	});

	test('recomputes the primary tints over the dark background once a dark primary is set', () => {
		const provided = new Map<unknown, unknown>();
		const plugins = ui({ brand, theme: { 'color-primary-dark': '#fafafa' } })
			.vue?.plugins as { install(app: unknown): void }[];
		for (const plugin of plugins) {
			plugin.install({
				config: {},
				provide: (key: unknown, value: unknown) => provided.set(key, value),
			});
		}
		const { css } = provided.get('nxgt:mail-ui') as { css: string };
		expect(css).toContain(
			'--color-primary-15-dark: color-mix(in srgb, var(--color-primary-dark) 15%, var(--color-background-dark));',
		);
		expect(css).toContain(
			'--color-primary-20-dark: color-mix(in srgb, var(--color-primary-dark) 20%, var(--color-background-dark));',
		);
		expect(css).toContain(
			'--color-primary-40-dark: color-mix(in srgb, var(--color-primary-dark) 40%, var(--color-background-dark));',
		);
		expect(css).toContain(
			'--color-primary-50-dark: color-mix(in srgb, var(--color-primary-dark) 50%, var(--color-background-dark));',
		);
	});

	test('leaves the tints aliased to their light twin when no dark primary is set', () => {
		const provided = new Map<unknown, unknown>();
		const plugins = ui({ brand }).vue?.plugins as {
			install(app: unknown): void;
		}[];
		for (const plugin of plugins) {
			plugin.install({
				config: {},
				provide: (key: unknown, value: unknown) => provided.set(key, value),
			});
		}
		const { css } = provided.get('nxgt:mail-ui') as { css: string };
		expect(css).not.toContain('--color-primary-15-dark: color-mix(');
		expect(css).toContain('--color-primary-15-dark: var(--color-primary-15);');
		expect(css).toContain('--color-primary-50-dark: var(--color-primary-50);');
	});

	test('defaults muted-dark to muted, and its foreground to muted-foreground', () => {
		const provided = new Map<unknown, unknown>();
		const plugins = ui({ brand }).vue?.plugins as {
			install(app: unknown): void;
		}[];
		for (const plugin of plugins) {
			plugin.install({
				config: {},
				provide: (key: unknown, value: unknown) => provided.set(key, value),
			});
		}
		const { css } = provided.get('nxgt:mail-ui') as { css: string };
		expect(css).toContain('--color-muted-dark: var(--color-muted);');
		expect(css).toContain(
			'--color-muted-foreground-dark: var(--color-muted-foreground);',
		);
	});

	test('shows a project-set dark muted pair, the same as color-primary-dark', () => {
		const provided = new Map<unknown, unknown>();
		const plugins = ui({
			brand,
			theme: {
				'color-muted-dark': '#1e293b',
				'color-muted-foreground-dark': '#e2e8f0',
			},
		}).vue?.plugins as { install(app: unknown): void }[];
		for (const plugin of plugins) {
			plugin.install({
				config: {},
				provide: (key: unknown, value: unknown) => provided.set(key, value),
			});
		}
		const { css } = provided.get('nxgt:mail-ui') as { css: string };
		expect(
			css.endsWith(
				'@theme {\n\t--color-muted-dark: #1e293b;\n\t--color-muted-foreground-dark: #e2e8f0;\n}\n',
			),
		).toBe(true);
	});

	test('makes an error while rendering fail the build under NODE_ENV=production too', () => {
		const config: Record<string, unknown> = {};
		const plugins = ui({ brand }).vue?.plugins as {
			install(app: unknown): void;
		}[];
		for (const plugin of plugins) plugin.install({ config, provide() {} });
		expect(config.throwUnhandledErrorInProduction).toBe(true);
	});

	test('keeps the brand from being changed after the call', () => {
		const options = {
			brand: { name: 'Acme', logo: { src: 'https://acme.example/l.png' } },
		};
		const given = ui(options).vue?.globalProperties
			?.brand as typeof options.brand;
		options.brand.logo.src = 'https://evil.example/l.png';
		expect(given.logo.src).toBe('https://acme.example/l.png');
		expect(Object.isFrozen(given.logo)).toBe(true);
	});
});
