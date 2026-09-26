import { afterEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { type Catalogues, checkCatalogues } from './catalogues';
import { buildManifest, emailKey } from './manifest';

const catalogues: Catalogues = {
	en: { welcome: { subject: 'Welcome, {name}' } },
	fr: { welcome: { subject: 'Bienvenue, {name}' } },
};

let out = '';
afterEach(() => rmSync(out, { recursive: true, force: true }));

/** Writes `files` under a fresh output folder and builds the manifest of what is there. */
function manifestOf(
	files: Record<string, string>,
	options: {
		catalogues?: Catalogues;
		layout?: 'nested' | 'flat';
		extra?: string[];
	} = {},
) {
	out = mkdtempSync(join(tmpdir(), 'mail-i18n-manifest-'));
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(dirname(join(out, path)), { recursive: true });
		writeFileSync(join(out, path), content);
	}
	return buildManifest({
		files: [
			...Object.keys(files).map((path) => join(out, path)),
			...(options.extra ?? []),
		],
		outputDir: out,
		htmlExtension: 'html',
		layout: options.layout ?? 'nested',
		locales: ['en', 'fr'],
		fallbackLocale: 'en',
		messages: checkCatalogues(
			options.catalogues ?? catalogues,
			['en', 'fr'],
			'en',
		),
	});
}

const both = (html: string, text?: string) => ({
	'en/welcome.html': html,
	'fr/welcome.html': html,
	...(text === undefined
		? {}
		: { 'en/welcome.txt': text, 'fr/welcome.txt': text }),
});

describe('buildManifest', () => {
	test('records the placeholders, the subject per locale and the files', () => {
		expect(manifestOf(both('<p>{{ code }}</p>', '{{ code }}'))).toEqual({
			locales: ['en', 'fr'],
			fallbackLocale: 'en',
			emails: {
				welcome: {
					variables: ['code', 'name'],
					urlVariables: [],
					subject: { en: 'Welcome, {{ name }}', fr: 'Bienvenue, {{ name }}' },
					files: {
						en: { html: 'en/welcome.html', text: 'en/welcome.txt' },
						fr: { html: 'fr/welcome.html', text: 'fr/welcome.txt' },
					},
				},
			},
		});
	});

	test('a URL variable is one a URL attribute starts with, in any quotes', () => {
		const html = [
			'<a href="{{ link }}">a</a>',
			"<img src='{{ logo }}'>",
			'<td background=" {{ bg }}">',
			'<a href="https://app.test/verify?token={{ token }}">b</a>',
			'<p title="{{ label }}">c</p>',
		].join('');
		const { welcome } = manifestOf(both(html)).emails;
		expect(welcome?.urlVariables).toEqual(['bg', 'link', 'logo']);
		expect(welcome?.variables).toEqual([
			'bg',
			'label',
			'link',
			'logo',
			'name',
			'token',
		]);
	});

	test('a placeholder only in the text part is a variable', () => {
		const { welcome } = manifestOf(
			both('<p>hi</p>', 'Code: {{ code }}'),
		).emails;
		expect(welcome?.variables).toEqual(['code', 'name']);
		expect(welcome?.files.en?.text).toBe('en/welcome.txt');
	});

	test('an e-mail with no text part answers null for it', () => {
		expect(manifestOf(both('<p>hi</p>')).emails.welcome?.files.fr).toEqual({
			html: 'fr/welcome.html',
			text: null,
		});
	});

	test('reads the flat layout', () => {
		const manifest = manifestOf(
			{ 'welcome.en.html': '<p/>', 'welcome.fr.html': '<p/>' },
			{ layout: 'flat' },
		);
		expect(manifest.emails.welcome?.files.fr).toEqual({
			html: 'welcome.fr.html',
			text: null,
		});
	});

	test('fails the build on a file written outside the output folder', () => {
		expect(() =>
			manifestOf(both('<p/>'), { extra: ['/elsewhere/text/welcome.en.txt'] }),
		).toThrow(
			/^i18n: \.\.\/.*welcome\.en\.txt was written outside the output folder — the i18n plugin lays out every e-mail; set no plaintext\.destination and no output path in a template$/,
		);
	});

	test('fails the build on a file the plugin did not lay out', () => {
		expect(() =>
			manifestOf({ ...both('<p/>'), 'custom/welcome.html': '<p/>' }),
		).toThrow(
			new Error(
				'i18n: custom/welcome.html is not where the i18n plugin puts an e-mail — set no output path in a template',
			),
		);
	});

	test('fails the build on an e-mail missing in a locale', () => {
		expect(() => manifestOf({ 'en/welcome.html': '<p/>' })).toThrow(
			new Error('i18n: welcome was not built in fr'),
		);
	});

	test('fails the build on a subject whose argument is not a string', () => {
		expect(() =>
			manifestOf(both('<p/>'), {
				catalogues: {
					en: { welcome: { subject: '{n, number} new' } },
					fr: { welcome: { subject: '{n, number} nouveaux' } },
				},
			}),
		).toThrow(
			new Error(
				"i18n: en: welcome.subject uses {n} as a number — a subject's arguments are placeholders, filled at send time as strings",
			),
		);
	});

	test('fails the build on a subject that chooses on a placeholder', () => {
		expect(() =>
			manifestOf(both('<p/>'), {
				catalogues: {
					en: {
						welcome: { subject: '{kind, select, admin {Hi admin} other {Hi}}' },
					},
					fr: {
						welcome: {
							subject: '{kind, select, admin {Salut admin} other {Salut}}',
						},
					},
				},
			}),
		).toThrow(
			new Error(
				"i18n: en: welcome.subject chooses on {kind} with a select — a subject's arguments are placeholders, which always choose other",
			),
		);
	});
});

describe('emailKey', () => {
	test('is where the messages of an e-mail live', () => {
		expect(emailKey('verify-email')).toBe('verifyEmail');
		expect(emailKey('auth/reset-password-2')).toBe('auth.resetPassword2');
	});
});
