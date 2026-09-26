import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { cp, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, type MailConfig } from './build';
import { dev } from './dev';

const FIXTURE = join(import.meta.dir, '../test/fixtures/mail');
const GOLDEN = join(import.meta.dir, '../test/types/generated/mail.ts');
const config: MailConfig = { locales: ['en', 'fr'], fallbackLocale: 'en' };

let root: string;
beforeAll(async () => {
	root = await mkdtemp(join(tmpdir(), 'mail-build-project-'));
	await cp(join(FIXTURE, 'emails'), join(root, 'emails'), { recursive: true });
	await cp(join(FIXTURE, 'messages'), join(root, 'messages'), {
		recursive: true,
	});
});
afterAll(() => rm(root, { recursive: true, force: true }));

describe('build', () => {
	test('writes src/generated/mail.ts, then leaves it alone when nothing changed', async () => {
		const first = await build(config, { root });
		expect(first.out).toBe(join(root, 'src/generated/mail.ts'));
		expect(first.written).toBe(true);
		expect(first.emails.map((email) => email.name)).toEqual([
			'orderPlaced',
			'verifyEmail',
		]);
		expect(await readFile(first.out, 'utf8')).toBe(
			await readFile(GOLDEN, 'utf8'),
		);

		const second = await build(config, { root });
		expect(second.written).toBe(false);
	}, 30_000);

	test('a missing templates folder is a wiring mistake', async () => {
		await expect(
			build({ ...config, emails: 'mails' }, { root }),
		).rejects.toThrow(
			new TypeError(
				`build: ${join(root, 'mails')} does not exist — put one .vue template per e-mail there, or set emails in the config`,
			),
		);
	});
});

describe('build refuses a wiring mistake', () => {
	test('no catalogue in the messages folder', async () => {
		await expect(
			build({ ...config, messages: 'nowhere' }, { root }),
		).rejects.toThrow(
			new TypeError(
				`build: ${join(root, 'nowhere')} holds no catalogue — write one <locale>.json per locale there, or set messages in the config`,
			),
		);
	});

	test('no template in the emails folder', async () => {
		await expect(
			build({ ...config, emails: 'messages' }, { root }),
		).rejects.toThrow(
			new TypeError(
				`build: ${join(root, 'messages')} holds no .vue template — put one per e-mail there`,
			),
		);
	});

	test('a config that is not one', async () => {
		await expect(
			build({ fallbackLocale: 'en' } as unknown as MailConfig, { root }),
		).rejects.toThrow(
			new TypeError(
				"build: locales must be a list of locales, as ['en', 'fr']",
			),
		);
		await expect(
			build(undefined as unknown as MailConfig, { root }),
		).rejects.toThrow(
			new TypeError(
				'build: the config must be an object — export default defineMailConfig({ … })',
			),
		);
	});
});

describe('dev', () => {
	test('renders every e-mail in every locale, with an index', async () => {
		const result = await dev(config, { root });
		expect(result.outDir).toBe(join(root, '.nxgt-mail'));
		expect([...result.files].sort()).toEqual([
			'index.html',
			'order-placed.en.html',
			'order-placed.en.txt',
			'order-placed.fr.html',
			'order-placed.fr.txt',
			'verify-email.en.html',
			'verify-email.en.txt',
			'verify-email.fr.html',
			'verify-email.fr.txt',
		]);
		expect((await readdir(result.outDir)).sort()).toEqual(
			[...result.files].sort(),
		);
		const text = await readFile(
			join(result.outDir, 'verify-email.fr.txt'),
			'utf8',
		);
		expect(text).toStartWith('Subject: Confirmez votre adresse e-mail\n\n');
		expect(text).toContain('Bonjour [name],');
		expect(text).toContain('https://example.com/link');
	}, 30_000);
});
