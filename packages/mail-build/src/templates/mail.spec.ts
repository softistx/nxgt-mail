import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import ts from 'typescript';
import config from '../../test/fixtures/mail/mail.config';
import { locales, mails } from '../../test/types/generated/mail';
import { compileProject } from '../build';

const FIXTURE = join(import.meta.dir, '../../test/fixtures/mail');
const GOLDEN = join(import.meta.dir, '../../test/types/generated/mail.ts');

const verifyEmail = {
	name: 'Ada',
	link: 'https://example.com/verify?token=abc&next=%2F',
	hours: 24,
} as const;
const orderPlaced = {
	name: 'Ada',
	reference: 'A-1042',
	placedAt: new Date('2026-09-25T21:30:00Z'),
	total: 42.5,
	logo: 'https://cdn.example.com/logo.png',
	orderLink: 'https://example.com/orders/A-1042',
} as const;

describe('the generated module', () => {
	test('is the one the fixture builds (UPDATE_GOLDEN=1 writes it)', async () => {
		const { module } = await compileProject(config, { root: FIXTURE });
		if (process.env.UPDATE_GOLDEN === '1') await Bun.write(GOLDEN, module);
		expect(module).toBe(await readFile(GOLDEN, 'utf8'));
	}, 30_000);

	test('imports nothing: no Maizzle, no Tailwind, no parser on the render path', async () => {
		const source = await readFile(GOLDEN, 'utf8');
		const { importedFiles, referencedFiles, typeReferenceDirectives } =
			ts.preProcessFile(source, true, true);
		expect(importedFiles).toEqual([]);
		expect(referencedFiles).toEqual([]);
		expect(typeReferenceDirectives).toEqual([]);
	});

	for (const locale of locales) {
		test(`renders verifyEmail in ${locale}`, () => {
			const rendered = mails.verifyEmail({ locale, ...verifyEmail });
			expect(rendered.subject).toMatchSnapshot();
			expect(rendered.text).toMatchSnapshot();
			expect(rendered.html).toMatchSnapshot();
		});

		test(`renders orderPlaced in ${locale}`, () => {
			const rendered = mails.orderPlaced({
				locale,
				timeZone: 'Europe/Paris',
				...orderPlaced,
			});
			expect(rendered.subject).toMatchSnapshot();
			expect(rendered.text).toMatchSnapshot();
			expect(rendered.html).toMatchSnapshot();
		});
	}
});

describe('escaping', () => {
	test('escapes <script> in a name in html, and leaves it as is in text', () => {
		const rendered = mails.verifyEmail({
			locale: 'en',
			...verifyEmail,
			name: '<script>alert(1)</script>',
		});
		expect(rendered.html).not.toContain('<script>');
		expect(rendered.html).toContain(
			'Hello &lt;script&gt;alert(1)&lt;/script&gt;,',
		);
		expect(rendered.text).toContain('Hello <script>alert(1)</script>,');
	});

	test('escapes quotes in a URL, so it cannot leave its attribute', () => {
		const { html } = mails.verifyEmail({
			locale: 'en',
			...verifyEmail,
			link: 'https://example.com/"onmouseover="alert(1)',
		});
		expect(html).toContain(
			'href="https://example.com/&quot;onmouseover=&quot;alert(1)"',
		);
		expect(html).not.toContain('"onmouseover="');
	});

	test('refuses javascript: in a link, and mailto: in an image', () => {
		expect(() =>
			mails.verifyEmail({
				locale: 'en',
				...verifyEmail,
				link: 'javascript:alert(1)',
			}),
		).toThrow(
			new TypeError(
				'mails.verifyEmail: link must be an http:, https: or mailto: URL',
			),
		);
		expect(() =>
			mails.verifyEmail({
				locale: 'en',
				...verifyEmail,
				link: ' https://x.test',
			}),
		).toThrow(TypeError);
		expect(() =>
			mails.orderPlaced({
				locale: 'en',
				...orderPlaced,
				logo: 'mailto:a@b.test',
			}),
		).toThrow(
			new TypeError('mails.orderPlaced: logo must be an http: or https: URL'),
		);
		expect(
			mails.orderPlaced({
				locale: 'en',
				...orderPlaced,
				orderLink: 'mailto:orders@example.com',
			}).html,
		).toContain('href="mailto:orders@example.com"');
	});

	test('removes a line break from a subject argument', () => {
		const { subject, text } = mails.orderPlaced({
			locale: 'en',
			...orderPlaced,
			reference: 'A-1\r\nBcc: victim@example.com',
		});
		expect(subject).toBe('Order A-1 Bcc: victim@example.com confirmed');
		expect(text).toContain('A-1\r\nBcc: victim@example.com');
	});
});
