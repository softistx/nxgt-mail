import { beforeAll, describe, expect, test } from 'bun:test';
import { cpSync, mkdirSync, readdirSync, rmSync, symlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MailRefused } from '@nxgt/mail';
import {
	createMailRenderer,
	MANIFEST_FORMAT as READS,
} from '@nxgt/mail/renderer';
import { MANIFEST_FORMAT as WRITES } from '@nxgt/mail-i18n';
import { PRESETS } from './presets';

const root = fileURLToPath(new URL('..', import.meta.url));
const fixture = `${root}test/fixture`;
const packaged = `${root}test/packaged`;
const maizzle = `${root}node_modules/.bin/maizzle`;

async function build(...args: string[]): Promise<void> {
	await buildIn(fixture, ...args);
}

async function buildIn(cwd: string, ...args: string[]): Promise<void> {
	const child = Bun.spawn([maizzle, 'build', ...args], {
		cwd,
		stdout: 'pipe',
		stderr: 'pipe',
	});
	const [code, stdout, stderr] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	if (code !== 0) throw new Error(`maizzle build failed:\n${stdout}${stderr}`);
}

const read = (path: string) => Bun.file(`${fixture}/${path}`).text();

/**
 * Installs a workspace package in test/packaged/node_modules as npm would: a
 * real folder, not a link to the workspace, with its dependencies beside it.
 */
function install(name: string, files: readonly string[]): void {
	const from = fileURLToPath(new URL(`../../${name}/`, import.meta.url));
	const to = `${packaged}/node_modules/@nxgt/${name}`;
	mkdirSync(to, { recursive: true });
	for (const file of files)
		cpSync(`${from}${file}`, `${to}/${file}`, { recursive: true });
	symlinkSync(`${from}node_modules`, `${to}/node_modules`);
}

describe('the presets, built by a project', () => {
	beforeAll(async () => {
		for (const dir of ['dist', 'dist-override', '.maizzle']) {
			rmSync(`${fixture}/${dir}`, { recursive: true, force: true });
		}
		await build();
		await build('-c', 'maizzle.config.override.ts');
	}, 180_000);

	test('samples/ is what the build writes — run `bun run samples` after a change', async () => {
		for (const locale of ['en', 'fr']) {
			const built = readdirSync(`${fixture}/dist/${locale}`)
				.filter((file) => file.endsWith('.html'))
				.sort();
			expect(built).toEqual(PRESETS.map((name) => `${name}.html`).sort());
			expect(readdirSync(`${root}samples/${locale}`).sort()).toEqual(built);
			for (const file of built) {
				expect({ file, html: await read(`dist/${locale}/${file}`) }).toEqual({
					file,
					html: await Bun.file(`${root}samples/${locale}/${file}`).text(),
				});
			}
		}
	});

	test('writes each preset in each locale, with its placeholders kept', async () => {
		const fr = await read('dist/fr/new-sign-in.html');
		expect(fr).toContain('<html lang="fr"');
		expect(fr).toContain('Nouvelle connexion à votre compte');
		expect(fr).toContain('>{{ device }}</td>');
		expect(fr).toContain('href="{{ link }}"');
		expect(await read('dist/en/sign-in-code.html')).toContain(
			'{{ code }}</td>',
		);
	});

	test('the manifest names each preset, its variables and its subject', async () => {
		const { emails } = JSON.parse(await read('dist/mail-manifest.json'));
		expect(Object.keys(emails).sort()).toEqual([...PRESETS].sort());
		expect(emails.invitation.variables).toEqual([
			'expiresIn',
			'inviter',
			'link',
			'organization',
		]);
		expect(emails.invitation.subject.fr).toBe(
			'{{ inviter }} vous invite à rejoindre {{ organization }}',
		);
		expect(emails['sign-in-code'].urlVariables).toEqual([]);
	});

	test('each preset whose link or code expires takes expiresIn, in its HTML and its text', async () => {
		const { emails } = JSON.parse(await read('dist/mail-manifest.json'));
		const expiring = Object.keys(emails)
			.filter((name) => emails[name].variables.includes('expiresIn'))
			.sort();
		expect(expiring).toEqual([
			'invitation',
			'magic-link',
			'reset-password',
			'sign-in-code',
			'verify-email',
		]);
		expect(await read('dist/en/magic-link.html')).toContain(
			'This link expires in {{ expiresIn }}.',
		);
		expect(await read('dist/fr/sign-in-code.txt')).toContain(
			'Ce code expire dans {{ expiresIn }}.',
		);
	});

	test("builds only the presets asked for, the project's template replacing one", async () => {
		const { emails } = JSON.parse(
			await read('dist-override/mail-manifest.json'),
		);
		expect(Object.keys(emails).sort()).toEqual(['sign-in-code', 'welcome']);
		expect(await read('dist-override/en/welcome.html')).toContain(
			'data-welcome="project"',
		);
	});

	test("the project's catalogue overrides a preset's message, key by key", async () => {
		const en = await read('dist-override/en/sign-in-code.html');
		expect(en).toContain('Here is your code');
		expect(en).toContain('Enter this code to sign in to Acme. It works once.');
		expect(await read('dist-override/fr/sign-in-code.html')).toContain(
			'Votre code de connexion',
		);
	});

	test('the renderer reads the manifest format the plugin writes: the two copies of MANIFEST_FORMAT agree', () => {
		expect(READS).toBe(WRITES);
	});

	test('@nxgt/mail renders the build in both locales, filling and escaping each value', () => {
		const mails = createMailRenderer({ dir: `${fixture}/dist` });
		expect(mails.emails).toEqual([...PRESETS].sort());
		const variables = {
			inviter: 'Grace <script>',
			organization: 'Analytical & Co',
			link: 'https://acme.example/join?token=t0k&x=1',
			expiresIn: '7 days',
		};
		const en = mails.render('invitation', variables);
		expect(en.subject).toBe(
			'Grace <script> invited you to join Analytical & Co',
		);
		expect(en.html).toContain('<html lang="en"');
		expect(en.html).toContain('Grace &lt;script&gt;');
		expect(en.html).toContain(
			'href="https://acme.example/join?token=t0k&amp;x=1"',
		);
		expect(en.html).not.toContain('{{');
		expect(en.text).toContain(
			'Grace <script> invited you to join Analytical & Co',
		);
		expect(en.html).toContain('This invitation expires in 7 days.');
		expect(en.text).toContain('This invitation expires in 7 days.');
		const fr = mails.render('invitation', variables, { locale: 'fr' });
		expect(fr.subject).toBe(
			'Grace <script> vous invite à rejoindre Analytical & Co',
		);
		expect(fr.html).toContain('<html lang="fr"');
		expect(fr.text).toContain('Cette invitation expire dans 7 days.');
		expect(fr.text).not.toContain('{{');
		expect(() =>
			mails.render('magic-link', {
				link: 'javascript:alert(1)',
				expiresIn: '1 hour',
			}),
		).toThrow(MailRefused);
		const code = mails.render(
			'sign-in-code',
			{ code: '621739', expiresIn: '10 minutes' },
			{ locale: 'fr' },
		);
		expect(code.html).toContain('Ce code expire dans 10 minutes.');
		expect(code.text).toContain('Ce code expire dans 10 minutes.');
		expect(() =>
			mails.render('magic-link', { link: 'https://acme.example/in' }),
		).toThrow('render: magic-link needs the variable expiresIn');
	});

	test('caniemail reports for Gmail, Outlook and Apple Mail only the known partial support', async () => {
		const port = 39_000 + Math.floor(Math.random() * 900);
		const child = Bun.spawn([maizzle, 'serve', '--port', String(port)], {
			cwd: fixture,
			stdout: 'ignore',
			stderr: 'ignore',
		});
		try {
			const base = `http://localhost:${port}/__maizzle/compatibility`;
			for (let attempt = 0; attempt < 60; attempt++) {
				const up = await fetch(`http://localhost:${port}/__maizzle/templates`)
					.then((response) => response.ok)
					.catch(() => false);
				if (up) break;
				await Bun.sleep(500);
			}
			for (const name of PRESETS) {
				// The endpoint takes the file's path after its own, so an absolute
				// one follows a second slash.
				const issues: { slug: string }[] = await fetch(
					`${base}/${root}emails/${name}.vue`,
				).then((response) => response.json());
				expect({ name, slugs: issues.map((issue) => issue.slug) }).toEqual({
					name,
					slugs: ['html-align'],
				});
			}
		} finally {
			child.kill();
			await child.exited;
		}
	}, 90_000);
});

describe('the presets, installed from npm', () => {
	beforeAll(async () => {
		for (const dir of [
			'dist',
			'dist-project',
			'components',
			'node_modules',
			'.maizzle',
		]) {
			rmSync(`${packaged}/${dir}`, { recursive: true, force: true });
		}
		// Maizzle leaves unresolved every tag of a file under node_modules: the
		// e-mails would build empty unless ui() resolves them itself.
		install('mail-ui', ['package.json', 'dist', 'components', 'theme.css']);
		install('mail-presets', ['package.json', 'dist', 'emails']);
		await buildIn(packaged);
		mkdirSync(`${packaged}/components`);
		await Bun.write(
			`${packaged}/components/nx-button.vue`,
			'<template><a data-project-button><slot /></a></template>\n',
		);
		await buildIn(packaged, '-c', 'maizzle.config.project.ts');
	}, 240_000);

	test('builds what the workspace builds, byte for byte', async () => {
		for (const locale of ['en', 'fr']) {
			for (const name of PRESETS) {
				const file = `${locale}/${name}.html`;
				expect({
					file,
					html: await Bun.file(`${packaged}/dist/${file}`).text(),
				}).toEqual({
					file,
					html: await Bun.file(`${root}samples/${file}`).text(),
				});
			}
		}
	});

	test("the project's components/nx-button.vue replaces ours in an installed template", async () => {
		expect(
			await Bun.file(`${packaged}/dist-project/en/magic-link.html`).text(),
		).toContain('data-project-button');
	});
});
