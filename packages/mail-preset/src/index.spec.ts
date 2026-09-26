import { describe, expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	compileProject,
	definePreset,
	type MailConfig,
	type Preset,
} from '@nxgt/mail-build';
import { nxgtPreset } from './index';

const ROOT = join(import.meta.dir, '../test/fixtures/app');

type Mails = Record<
	string,
	(args: Record<string, unknown>) => {
		readonly subject: string;
		readonly html: string;
		readonly text: string;
	}
>;

/** Builds the fixture with `presets`, and imports the module it generates. */
async function buildWith(presets: readonly Preset[]): Promise<Mails> {
	const config: MailConfig = {
		locales: ['en', 'fr'],
		fallbackLocale: 'en',
		presets,
	};
	const { module } = await compileProject(config, { root: ROOT });
	const dir = await mkdtemp(join(tmpdir(), 'mail-preset-'));
	try {
		const file = join(dir, 'mail.ts');
		await writeFile(file, module);
		return ((await import(file)) as { mails: Mails }).mails;
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}

const verifyEmail = {
	name: 'Ada',
	link: 'https://example.com/verify?token=abc',
	hours: 24,
	code: '482913',
};
const orderPlaced = {
	name: 'Ada',
	reference: 'A-1042',
	orderLink: 'https://example.com/orders/A-1042',
};

describe('nxgtPreset()', async () => {
	const mails = await buildWith([nxgtPreset()]);

	for (const locale of ['en', 'fr']) {
		test(`renders verifyEmail in ${locale}`, () => {
			const rendered = mails.verifyEmail?.({ locale, ...verifyEmail });
			expect(rendered?.subject).toMatchSnapshot();
			expect(rendered?.text).toMatchSnapshot();
			expect(rendered?.html).toMatchSnapshot();
		});

		test(`renders orderPlaced in ${locale}`, () => {
			const rendered = mails.orderPlaced?.({ locale, ...orderPlaced });
			expect(rendered?.subject).toMatchSnapshot();
			expect(rendered?.text).toMatchSnapshot();
			expect(rendered?.html).toMatchSnapshot();
		});
	}

	test('inlines its tokens: the accent on the button, the fonts every client has', () => {
		const html = mails.verifyEmail?.({ locale: 'en', ...verifyEmail }).html;
		expect(html).toContain('background-color: #2563eb');
		expect(html).toContain("'Segoe UI'");
		expect(html).not.toMatch(/var\(--|@import|@theme/);
	});

	test('writes the shared messages, and the footer a template chose', () => {
		const verify = mails.verifyEmail?.({ locale: 'fr', ...verifyEmail });
		expect(verify?.text).toContain('Bonjour Ada,');
		expect(verify?.text).toContain('vous pouvez ignorer cet e-mail');
		expect(verify?.text).not.toContain('suite à une action');
		const order = mails.orderPlaced?.({ locale: 'en', ...orderPlaced });
		expect(order?.text).toContain(
			'You are receiving this e-mail because of an action on your account.',
		);
	});

	test('shows no logo unless one is given', () => {
		const html = mails.verifyEmail?.({ locale: 'en', ...verifyEmail }).html;
		expect(html).not.toContain('<img');
	});
});

describe('a second preset', async () => {
	const acme = definePreset({
		name: 'acme',
		theme: { color: { primary: '#e11d48' } },
		messages: {
			en: { common: { footer: { why: 'Acme sent you this e-mail.' } } },
		},
	});
	const mails = await buildWith([
		nxgtPreset({
			brand: { logo: 'https://cdn.example.com/logo.png', name: 'Acme' },
		}),
		acme,
	]);

	test('overrides one token, and keeps the others', () => {
		const html = mails.verifyEmail?.({ locale: 'en', ...verifyEmail }).html;
		expect(html).toContain('background-color: #e11d48');
		expect(html).not.toContain('#2563eb');
		expect(html).toContain('background-color: #f4f4f5');
	});

	test('overrides one message in one locale, and keeps the rest', () => {
		expect(
			mails.orderPlaced?.({ locale: 'en', ...orderPlaced }).text,
		).toContain('Acme sent you this e-mail.');
		expect(
			mails.orderPlaced?.({ locale: 'fr', ...orderPlaced }).text,
		).toContain('Vous recevez cet e-mail suite à une action sur votre compte.');
	});

	test('escapes the brand in the rendered e-mail', async () => {
		const html = (
			await buildWith([
				nxgtPreset({
					brand: {
						logo: 'https://x.test/a.png?b=1&c="2"><script>',
						name: 'A <b> & "c" {{ lang }}',
					},
				}),
			])
		).verifyEmail?.({ locale: 'en', ...verifyEmail }).html;
		// Quotes escaped, so nothing leaves its attribute; Maizzle's serializer
		// writes `&` and `<` bare inside a quoted value, which HTML allows.
		expect(html).toContain(
			'src="https://x.test/a.png?b=1&c=&quot;2&quot;><script>"',
		);
		expect(html).toContain('alt="A <b> & &quot;c&quot; {{ lang }}"');
		expect(html?.replace(/"[^"]*"/g, '""')).not.toMatch(/<script|<b>/);
	}, 30_000);

	test('shows the logo of the brand, its name as the alternative text', () => {
		expect(mails.verifyEmail?.({ locale: 'en', ...verifyEmail }).html).toMatch(
			/<img src="https:\/\/cdn\.example\.com\/logo\.png"[^>]* alt="Acme"/,
		);
	});
});

describe('nxgtPreset options', () => {
	test('brand.primary is color.primary; any token is overridable', () => {
		const preset = nxgtPreset({
			brand: { primary: '#4f46e5' },
			theme: { color: { canvas: '#ffffff' }, radius: { button: '0' } },
		});
		expect(preset.theme?.color).toMatchObject({
			primary: '#4f46e5',
			canvas: '#ffffff',
			foreground: '#18181b',
		});
		expect(preset.theme?.radius).toEqual({ button: '0', card: '8px' });
	});

	test('escapes the brand into the layout', () => {
		const preset = nxgtPreset({
			brand: { logo: 'https://x.test/a.png?b=1&c="2"', name: 'A <b> & "c"' },
		});
		const layout = preset.components?.['TransactionalLayout.vue'];
		expect(layout).toContain(
			'src="https://x.test/a.png?b=1&amp;c=&quot;2&quot;" alt="A &lt;b&gt; &amp; &quot;c&quot;"',
		);
	});

	test('refuses what the preset does not have', () => {
		const call = (options: unknown) => () =>
			nxgtPreset(options as Parameters<typeof nxgtPreset>[0]);
		expect(call({ colours: {} })).toThrow(
			new TypeError(
				'nxgtPreset: options.colours is not an option — one of brand, theme',
			),
		);
		expect(call({ brand: { primry: '#000' } })).toThrow(
			new TypeError(
				'nxgtPreset: brand.primry is not a brand option — one of primary, onPrimary, logo, name',
			),
		);
		expect(call({ theme: { colour: {} } })).toThrow(
			new TypeError(
				'nxgtPreset: theme.colour is not a theme namespace of the preset — one of color, font, radius',
			),
		);
		expect(call({ theme: { color: { brand: '#000' } } })).toThrow(
			new TypeError(
				'nxgtPreset: theme.color.brand is not a token of the preset — one of primary, onPrimary, canvas, surface, foreground, muted, border, code',
			),
		);
		expect(call({ brand: { logo: 'javascript:alert(1)' } })).toThrow(
			new TypeError('nxgtPreset: brand.logo must be an http: or https: URL'),
		);
		expect(call({ brand: { primary: 4 } })).toThrow(
			new TypeError('nxgtPreset: brand.primary must be a string'),
		);
		expect(call({ theme: { color: null } })).toThrow(
			new TypeError('nxgtPreset: theme.color must be an object'),
		);
		expect(call({ brand: null })).toThrow(
			new TypeError('nxgtPreset: brand must be an object'),
		);
		expect(call({ brand: { name: 'Acme' } })).toThrow(
			new TypeError(
				"nxgtPreset: brand.name is the logo's alternative text — give brand.logo too",
			),
		);
		expect(call(null)).toThrow(
			new TypeError('nxgtPreset: options must be an object'),
		);
	});
});
