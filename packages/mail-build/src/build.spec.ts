import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
	cp,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, compileProject, type MailConfig } from './build';
import { dev } from './dev';
import { definePreset } from './presets';

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

describe('build with presets', () => {
	const preset = definePreset({
		name: 'acme',
		theme: { color: { brand: '#e11d48' } },
		components: {
			'Brand.vue': '<template><p class="text-brand">preset</p></template>',
		},
		messages: { en: { a: { subject: 'From the preset' } } },
	});

	test("renders a preset's component with its tokens, and lets the application replace it", async () => {
		const dir = await mkdtemp(join(tmpdir(), 'mail-build-presets-'));
		try {
			await mkdir(join(dir, 'emails'));
			await writeFile(
				join(dir, 'emails', 'a.vue'),
				`<template>
  <Html :lang="lang">
    <Head><style>@import "@maizzle/tailwindcss"; @import "./theme.css";</style></Head>
    <Body><Brand /></Body>
  </Html>
</template>
`,
			);
			const presetOnly = {
				locales: ['en'],
				fallbackLocale: 'en',
				presets: [preset],
			};
			const first = await compileProject(presetOnly, { root: dir });
			expect(first.module).toContain('color: #e11d48');
			expect(first.module).toContain('>preset</p>');
			expect(first.module).toContain('From the preset');

			await mkdir(join(dir, 'components'));
			await writeFile(
				join(dir, 'components', 'Brand.vue'),
				'<template><p class="text-brand">application</p></template>',
			);
			const second = await compileProject(presetOnly, { root: dir });
			expect(second.module).toContain('>application</p>');
			expect(second.module).not.toContain('>preset</p>');

			await mkdir(join(dir, 'components', 'nested'));
			await expect(compileProject(presetOnly, { root: dir })).rejects.toThrow(
				new TypeError(
					`build: ${join(dir, 'components', 'nested')} is a folder — put each component directly in ${join(dir, 'components')}`,
				),
			);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	}, 30_000);
});

describe('a component is held to what it renders', () => {
	test('a value it moves into style fails the build', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'mail-build-component-'));
		try {
			await mkdir(join(dir, 'emails'));
			await writeFile(
				join(dir, 'emails', 'a.vue'),
				`<script setup>
defineProps(['colour']);
</script>

<template>
  <Html :lang="lang"><Body><Paint :colour="colour" /></Body></Html>
</template>
`,
			);
			await expect(
				compileProject(
					{
						locales: ['en'],
						fallbackLocale: 'en',
						presets: [
							definePreset({
								name: 'acme',
								components: {
									'Paint.vue': `<script setup>
defineProps(['colour']);
</script>

<template><p :style="{ color: colour }">x</p></template>
`,
								},
								messages: { en: { a: { subject: 'A' } } },
							}),
						],
					},
					{ root: dir },
				),
			).rejects.toThrow(
				'templates: a.vue: the prop colour lands in the style attribute',
			);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	}, 30_000);
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

	test('a components folder the config names, which does not exist', async () => {
		await expect(
			build({ ...config, components: 'parts' }, { root }),
		).rejects.toThrow(
			new TypeError(
				`build: ${join(root, 'parts')} does not exist — put the application's components there, or leave components out of the config`,
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
		await expect(build({} as MailConfig, { root })).rejects.toThrow(
			new TypeError(
				'build: the config has no locales — is it the default export? export default defineMailConfig({ … })',
			),
		);
		await expect(
			build({ locales: ['en'], fallbackLocale: 'fr' }, { root }),
		).rejects.toThrow(
			new TypeError("build: fallbackLocale must be one of locales, as 'en'"),
		);
		await expect(
			build({ ...config, presets: {} } as unknown as MailConfig, { root }),
		).rejects.toThrow(
			new TypeError(
				'build: presets must be a list, as [nxgtPreset()], or left out',
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
