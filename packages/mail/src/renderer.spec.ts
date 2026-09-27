import { afterEach, describe, expect, it } from 'bun:test';
import {
	cpSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MailRefused } from './errors';
import { createMailRenderer, MANIFEST_FORMAT } from './renderer';

const built = fileURLToPath(new URL('../test/built', import.meta.url));
const link = 'https://app.example/verify?token=abc&next=%2F';

describe('createMailRenderer — rendering a build', () => {
	const mails = createMailRenderer({ dir: built });

	it('lists the e-mails and the locales of the build', () => {
		expect(mails.emails).toEqual(['sign-in-code', 'verify-email']);
		expect(mails.locales).toEqual(['en', 'fr']);
	});

	it('fills every placeholder of each part, in the fallback locale by default', () => {
		expect(mails.render('verify-email', { name: 'Ada', link })).toEqual({
			subject: 'Confirm your address, Ada',
			html: '<!DOCTYPE html>\n<html lang="en"><body><p>Hello Ada,</p><a href="https://app.example/verify?token=abc&amp;next=%2F">Confirm</a><p>https://app.example/verify?token=abc&amp;next=%2F</p></body></html>\n',
			text: `Hello Ada,\n\nConfirm: ${link}\n`,
		});
	});

	it('renders the locale asked for, or the one getLanguage wants', () => {
		expect(
			mails.render('sign-in-code', { code: 123456 }, { locale: 'fr' }),
		).toEqual({
			subject: 'Votre code de connexion : 123456',
			html: '<!DOCTYPE html>\n<html lang="fr"><body><p>123456</p></body></html>\n',
			text: 'Votre code : 123456\n',
		});
		let wanted: string | undefined = 'fr-CA';
		const french = createMailRenderer({
			dir: built,
			getLanguage: () => wanted,
		});
		expect(french.render('sign-in-code', { code: '1' }).subject).toBe(
			'Votre code de connexion : 1',
		);
		wanted = undefined;
		expect(french.render('sign-in-code', { code: '1' }).subject).toBe(
			'Your sign-in code: 1',
		);
	});

	it("falls back to the locale given, rather than the manifest's", () => {
		const mails = createMailRenderer({
			dir: built,
			getLanguage: () => 'de',
			fallbackLocale: 'fr',
		});
		expect(mails.render('sign-in-code', { code: '1' }).text).toBe(
			'Votre code : 1\n',
		);
	});
});

describe('createMailRenderer — a value is data, never markup or a header', () => {
	const mails = createMailRenderer({ dir: built });

	it('escapes a value in html, and leaves it as is in text', () => {
		const name = '<script>alert("x")</script> & \'Ada\'';
		const rendered = mails.render('verify-email', { name, link });
		expect(rendered.html).toContain(
			'<p>Hello &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;Ada&#39;,</p>',
		);
		expect(rendered.html).not.toContain('<script>');
		expect(rendered.text).toContain(`Hello ${name},`);
	});

	it('refuses a URL variable that is not http:, https: or mailto:', () => {
		for (const value of [
			'javascript:alert(1)',
			'JaVaScRiPt:alert(1)',
			' javascript:alert(1)',
			'data:text/html,<script>alert(1)</script>',
			'//evil.example',
			'/relative',
			'https://app.example/"onmouseover="alert(1)',
			'https://app.example/\nx',
			'https://',
		]) {
			expect(() =>
				mails.render('verify-email', { name: 'Ada', link: value }),
			).toThrow(
				new MailRefused(
					'render: verify-email: link must be an http:, https: or mailto: URL',
				),
			);
		}
		expect(
			mails.render('verify-email', {
				name: 'Ada',
				link: 'mailto:ada@example.com',
			}).html,
		).toContain('href="mailto:ada@example.com"');
	});

	it('turns each run of line breaks in the subject into one space', () => {
		const rendered = mails.render('verify-email', {
			name: 'Ada\r\nBcc: victim@example.com\n\nX\u2028Y',
			link,
		});
		expect(rendered.subject).toBe(
			'Confirm your address, Ada Bcc: victim@example.com X Y',
		);
		expect(rendered.subject).not.toMatch(/[\r\n]/);
	});

	it('never reads a value again: a value holding a placeholder stays as written', () => {
		const rendered = mails.render('verify-email', { name: '{{ link }}', link });
		expect(rendered.text).toContain('Hello {{ link }},');
		expect(rendered.html).toContain('<p>Hello {{ link }},</p>');
	});
});

describe('createMailRenderer — a mistake throws', () => {
	const mails = createMailRenderer({ dir: built });

	it('refuses an unknown e-mail or locale', () => {
		expect(() => mails.render('welcome', {})).toThrow(
			new Error(
				'render: welcome is not an e-mail of the build — one of sign-in-code, verify-email',
			),
		);
		expect(() =>
			mails.render('sign-in-code', { code: '1' }, { locale: 'de' }),
		).toThrow(
			new Error(
				"render: the locale asked for is not one of the build's, en, fr",
			),
		);
	});

	it('refuses a missing variable, an unknown one, and a value that is not text', () => {
		expect(() => mails.render('verify-email', { name: 'Ada' })).toThrow(
			new Error('render: verify-email needs the variable link'),
		);
		expect(() =>
			mails.render('sign-in-code', { code: '1', name: 'Ada' }),
		).toThrow(
			new Error('render: sign-in-code has no variable name — it takes code'),
		);
		for (const code of [null, undefined, Number.NaN, {}, ['1']]) {
			expect(() => mails.render('sign-in-code', { code } as never)).toThrow(
				new TypeError(
					'render: sign-in-code: code must be a string or a finite number',
				),
			);
		}
		expect(() => mails.render('sign-in-code', 'code' as never)).toThrow(
			new TypeError(
				"render: the variables of sign-in-code must be an object, as { name: 'Ada' }",
			),
		);
	});

	it('never puts a value in a message', () => {
		const refuse = () =>
			mails.render('verify-email', {
				name: 'secret-name',
				link: 'javascript:secret-token',
			});
		expect(refuse).toThrow(MailRefused);
		try {
			refuse();
		} catch (error) {
			expect(String(error)).not.toContain('secret');
		}
	});
});

describe('createMailRenderer — wiring and a broken build', () => {
	let dir = '';
	afterEach(() => rmSync(dir, { recursive: true, force: true }));
	const copy = () => {
		dir = mkdtempSync(join(tmpdir(), 'nxgt-mail-renderer-'));
		cpSync(built, dir, { recursive: true });
		return dir;
	};
	interface EditableManifest {
		formatVersion?: unknown;
		locales?: unknown;
		emails: Record<string, { files: Record<string, { text: string | null }> }>;
	}
	const editManifest = (edit: (manifest: EditableManifest) => void) => {
		const file = join(copy(), 'mail-manifest.json');
		const manifest = JSON.parse(readFileSync(file, 'utf8'));
		edit(manifest);
		writeFileSync(file, JSON.stringify(manifest));
		return dir;
	};

	it('refuses options that are not what it takes, with a TypeError', () => {
		expect(() => createMailRenderer(undefined as never)).toThrow(
			new TypeError(
				"createMailRenderer: options must be an object, as { dir: 'dist' }",
			),
		);
		expect(() => createMailRenderer({ dir: '' })).toThrow(
			new TypeError(
				'createMailRenderer: dir must be the folder maizzle build wrote, as dist',
			),
		);
		expect(() =>
			createMailRenderer({ dir: built, getLanguage: 'en' as never }),
		).toThrow(
			new TypeError(
				'createMailRenderer: getLanguage must be a function that answers the wanted locales, as () => user.locale',
			),
		);
		expect(() =>
			createMailRenderer({ dir: built, fallbackLocale: 'de' }),
		).toThrow(
			new TypeError(
				"createMailRenderer: fallbackLocale must be one of the build's locales, en, fr",
			),
		);
	});

	it('fails when created, not at the first send, on a missing or broken build', () => {
		const missing = join(tmpdir(), 'nxgt-mail-no-such-build');
		expect(() => createMailRenderer({ dir: missing })).toThrow(
			`createMailRenderer: ${join(missing, 'mail-manifest.json')} cannot be read — run maizzle build, and deploy its output folder`,
		);
		writeFileSync(join(copy(), 'mail-manifest.json'), '{');
		expect(() => createMailRenderer({ dir })).toThrow(
			`createMailRenderer: ${join(dir, 'mail-manifest.json')} is not valid JSON`,
		);
	});

	it('fails on a manifest it does not read, or a file it lists that is gone', () => {
		const at = editManifest((m) => {
			delete m.locales;
		});
		expect(() => createMailRenderer({ dir: at })).toThrow(
			`createMailRenderer: ${join(at, 'mail-manifest.json')} is not a manifest of @nxgt/mail-i18n — build with its i18n() plugin`,
		);
		rmSync(at, { recursive: true });
		rmSync(join(copy(), 'fr/sign-in-code.txt'));
		expect(() => createMailRenderer({ dir })).toThrow(
			`createMailRenderer: ${join(dir, 'fr/sign-in-code.txt')} cannot be read`,
		);
	});

	it('reads a manifest without formatVersion, as @nxgt/mail-i18n 0.1 and 0.2 wrote it', () => {
		const at = editManifest((m) => {
			delete m.formatVersion;
		});
		const renderer = createMailRenderer({ dir: at });
		expect(renderer.render('sign-in-code', { code: '123456' }).text).toContain(
			'123456',
		);
	});

	it('reads every format up to its own, and refuses a newer one, saying which', () => {
		expect(MANIFEST_FORMAT).toBe(1);
		const newer = editManifest((m) => {
			m.formatVersion = MANIFEST_FORMAT + 1;
		});
		expect(() => createMailRenderer({ dir: newer })).toThrow(
			`createMailRenderer: ${join(newer, 'mail-manifest.json')} is manifest format 2, newer than this @nxgt/mail reads (1) — upgrade @nxgt/mail`,
		);
		// A newer format may change any field: it is refused as newer first.
		const reshaped = editManifest((m) => {
			m.formatVersion = 2;
			delete m.locales;
		});
		expect(() => createMailRenderer({ dir: reshaped })).toThrow(
			`createMailRenderer: ${join(reshaped, 'mail-manifest.json')} is manifest format 2, newer than this @nxgt/mail reads (1) — upgrade @nxgt/mail`,
		);
	});

	it.each([0, 1.5, '1', null])(
		'refuses a formatVersion that is not a format: %p',
		(formatVersion) => {
			const at = editManifest((m) => {
				m.formatVersion = formatVersion;
			});
			expect(() => createMailRenderer({ dir: at })).toThrow(
				`createMailRenderer: ${join(at, 'mail-manifest.json')} is not a manifest of @nxgt/mail-i18n — build with its i18n() plugin`,
			);
		},
	);

	it('fails on an e-mail whose entry lacks a locale', () => {
		const at = editManifest((m) => {
			const files = m.emails['sign-in-code']?.files;
			if (files) delete files.fr;
		});
		expect(() => createMailRenderer({ dir: at })).toThrow(
			'createMailRenderer: mail-manifest.json describes sign-in-code in a shape its format does not have — it was changed after the build; run maizzle build again',
		);
	});

	it('fails on an e-mail built without its text part', () => {
		const at = editManifest((m) => {
			const fr = m.emails['sign-in-code']?.files.fr;
			if (fr) fr.text = null;
		});
		expect(() => createMailRenderer({ dir: at })).toThrow(
			"createMailRenderer: sign-in-code has no text part in fr — keep Maizzle's plaintext on, as @nxgt/mail-config sets it",
		);
	});
});
