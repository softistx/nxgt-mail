import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixture = fileURLToPath(new URL('../test/fixture', import.meta.url));
const cases = fileURLToPath(new URL('../test/.cases', import.meta.url));
const maizzle = fileURLToPath(
	new URL('../node_modules/.bin/maizzle', import.meta.url),
);

/** Runs `maizzle <args>` in `cwd`, as a project runs it. */
async function run(cwd: string, ...args: string[]) {
	const child = Bun.spawn([maizzle, ...args], {
		cwd,
		stdout: 'pipe',
		stderr: 'pipe',
	});
	const [code, stdout, stderr] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	return { code, output: stdout + stderr };
}

async function build(cwd: string, ...args: string[]): Promise<void> {
	const { code, output } = await run(cwd, 'build', ...args);
	if (code !== 0) throw new Error(`maizzle build failed:\n${output}`);
}

const read = (path: string) => Bun.file(`${fixture}/${path}`).text();

/** The inline `style` of the `tag` around the first `text`: a button's `<a>`. */
function styleOf(html: string, text: string, tag = ''): string {
	const at = html.indexOf(`>${text}<`);
	const open = html.lastIndexOf(`<${tag}`, at);
	return /style="([^"]*)"/.exec(html.slice(open, at))?.[1] ?? '';
}

describe('a project built with the ui plugin', () => {
	beforeAll(async () => {
		for (const dir of ['dist', 'dist-override', '.maizzle']) {
			rmSync(`${fixture}/${dir}`, { recursive: true, force: true });
		}
		await build(fixture);
		await build(fixture, '-c', 'maizzle.config.override.ts');
	}, 120_000);

	test("renders material-vue's colours as hex, with nothing a client must resolve", async () => {
		const html = await read('dist/en/welcome.html');
		expect(html).not.toContain('oklch(');
		expect(html).not.toContain('var(--');
		expect(html).not.toContain('color-mix(');
		expect(styleOf(html, 'Open my account', 'a ')).toContain(
			'background-color: #485096;',
		);
	});

	test('writes the types of brand for the editor, in .maizzle/ where the starter looks', async () => {
		expect(await read('.maizzle/nxgt-mail-ui.d.ts')).toContain(
			"import type {} from '@nxgt/mail-ui';",
		);
	});

	test('mixes a tint over the background, where a client would drop an alpha', async () => {
		const html = await read('dist/en/welcome.html');
		// material-vue's bg-primary/15, and border-error/50.
		expect(styleOf(html, 'Tonal', 'a ')).toContain(
			'background-color: #e4e5ef;',
		);
		expect(styleOf(html, 'Outlined', 'a ')).toContain(
			'border: 1px solid #f27f8a;',
		);
	});

	test("pads a button with Maizzle's Outlook fallbacks, by its size", async () => {
		const html = await read('dist/en/welcome.html');
		expect(html).toContain(
			'<!--[if mso]><i style="mso-font-width: 114%; mso-text-raise: 19px;" hidden>',
		);
		expect(html).toContain('<span style="mso-text-raise: 8px;">Tonal</span>');
	});

	test("shows the brand's logo, linked, and its name in the footer", async () => {
		const html = await read('dist/en/welcome.html');
		expect(html).toContain(
			'<a href="https://acme.example" style="font-size: 18px;',
		);
		expect(html).toContain(
			'<img src="https://acme.example/logo.png" width="96" alt="Acme"',
		);
		expect(html).toContain('underline;">Acme</a>');
	});

	test("writes the ui's messages in each locale, under the project's", async () => {
		const en = await read('dist/en/welcome.html');
		const fr = await read('dist/fr/welcome.html');
		// common.greeting is the project's in en, the ui's in fr.
		expect(en).toContain('>Hi {{ name }},</p>');
		expect(fr).toContain('>Bonjour {{ name }},</p>');
		expect(en).toContain(
			'You received this e-mail because you have an account with Acme.',
		);
		expect(fr).toContain(
			'Vous recevez cet e-mail parce que vous avez un compte chez Acme.',
		);
		expect(fr).toContain('<html lang="fr"');
	});

	test('leaves out a summary row without a value, but not 0', async () => {
		const html = await read('dist/en/welcome.html');
		expect(html).toContain('>Trial</td>');
		expect(html).not.toContain('>Coupon</td>');
		expect(styleOf(html, 'Seats')).toContain('border-bottom: 1px solid;');
	});

	test('an overridden token wins, and its tints follow it', async () => {
		const html = await read('dist-override/en/welcome.html');
		expect(html).not.toContain('#485096');
		expect(styleOf(html, 'Open my account', 'a ')).toContain(
			'background-color: #0f766e;',
		);
		expect(styleOf(html, 'Tonal', 'a ')).toContain(
			'background-color: #dbeae9;',
		);
	});

	test('shows the name, unlinked, for a brand without a URL or logo', async () => {
		const html = await read('dist-override/en/welcome.html');
		expect(html).toMatch(/<span style="[^"]*">Acme<\/span>/);
		expect(html).not.toContain('<a href="https://acme.example"');
	});

	test('holds the card at its width in Outlook, which ignores max-width', async () => {
		expect(await read('dist/en/welcome.html')).toContain(
			'<!--[if mso]><table role="none" cellpadding="0" cellspacing="0" style="width: 600px" align="center">',
		);
	});

	test("a project's own NxBadge replaces the ui's", async () => {
		expect(await read('dist-override/en/welcome.html')).toContain(
			'<span data-badge="project"',
		);
		expect(await read('dist/en/welcome.html')).not.toContain('data-badge');
	});

	test('rules a table with borders a client keeps, its footer on a muted ground', async () => {
		const html = await read('dist/en/gallery.html');
		// A data table, which a screen reader reads as one, not a layout's role="none".
		expect(html).toContain('<table role="table"');
		expect(styleOf(html, 'Pro plan', 'td')).toContain(
			'border-bottom-width: 1px; border-bottom-style: solid; border-color: #e2e8f0;',
		);
		// A head in the footer takes the footer's line and ground too.
		expect(styleOf(html, 'Total', 'th')).toContain('border-top-width: 1px;');
		expect(styleOf(html, 'Total', 'th')).not.toContain('border-bottom');
		expect(styleOf(html, 'Total', 'th')).toContain(
			'background-color: #f1f5f9;',
		);
		expect(styleOf(html, '$30.00', 'td')).toContain('border-top-style: solid;');
		expect(html).toContain(
			'<caption align="bottom" style="caption-side: bottom;',
		);
		expect(html).toContain('<td colspan="2" style="padding: 40px 16px;');
	});

	test('leaves out a description without a value, but not 0', async () => {
		const html = await read('dist/en/gallery.html');
		expect(html).toContain('>Credits left</p>');
		expect(html).not.toContain('>Coupon</p>');
	});

	test('rings a selected list tile with a border, and links its title', async () => {
		const html = await read('dist/en/gallery.html');
		expect(html).toContain(
			'border-radius: 4px; border: 1px solid #b6b9d5; background-color: #e4e5ef;',
		);
		expect(html).toContain('<a href="https://acme.example/team/ada"');
		// A disabled tile's title is text, muted.
		expect(styleOf(html, 'Grace Hopper', 'span')).toContain('color: #62748e;');
		// And not a link, though it has an href.
		expect(html).not.toContain('https://acme.example/team/grace');
	});

	test('colours a chip by its variant, and an active one as filled', async () => {
		const html = await read('dist/en/gallery.html');
		expect(styleOf(html, ' Outlined ', 'span')).toContain(
			'border: 1px solid #a4a7cb;',
		);
		expect(styleOf(html, ' Active ', 'span')).toContain(
			'background-color: #d9efed;',
		);
		const active = html.slice(html.indexOf(' Outlined '));
		expect(styleOf(active, ' Active ', 'span')).toContain(
			'background-color: #485096;',
		);
	});

	test('sizes the avatars of a group, and counts the ones past max', async () => {
		const html = await read('dist/en/gallery.html');
		expect(html).toContain(
			'<img src="https://acme.example/ada.png" alt="Ada" width="40" height="40"',
		);
		expect(html).toContain('title="2 more" role="img" aria-label="2 more"');
		expect(await read('dist/fr/gallery.html')).toContain(
			'aria-label="2 autres"',
		);
		expect(styleOf(html, '+2', 'span')).toContain('line-height: 40px;');
		expect(html).not.toContain('>AT<');
		// An avatar out of a group takes its own size.
		expect(html).toContain('alt="Ada" width="48" height="48"');
	});

	test('lays out a group from a v-for, all of it with a max under 1', async () => {
		const html = await read('dist/en/gallery.html');
		for (const initials of ['AB', 'CD', 'EF']) {
			expect(styleOf(html, initials, 'span')).toContain('line-height: 24px;');
		}
	});

	test('sizes an avatar in a chip to 20px, and pulls nothing with a negative margin', async () => {
		const html = await read('dist/en/gallery.html');
		// The chip's GH comes first; the group's is 40px.
		expect(styleOf(html, 'GH', 'span')).toContain(
			'width: 20px; height: 20px; line-height: 20px;',
		);
		expect(html).not.toMatch(/margin[a-z-]*: -/);
	});

	test('fills a progress bar to its share, on a track at 20% of the primary', async () => {
		const html = await read('dist/en/sequence.html');
		expect(html).toContain(
			'<table role="progressbar" aria-valuenow="2" aria-valuemin="0" aria-valuemax="3"',
		);
		expect(html).toContain('background-color: #dadcea;');
		expect(html).toMatch(
			/<td height="8" style="width: 67%;[^"]*background-color: #485096;/,
		);
		// Empty and full: one cell each, the track's or the fill's.
		expect(html).toMatch(
			/aria-valuenow="0"[^>]*><tr> <td height="8" style="height: 8px;/,
		);
		expect(html).toMatch(
			/aria-valuenow="100"[^>]*><tr><td height="8" style="width: 100%;/,
		);
	});

	test('numbers the steps in order unless one says its index, and joins all but the last', async () => {
		const html = await read('dist/en/sequence.html');
		for (const index of ['1', '2', '7']) {
			expect(styleOf(html, index, 'span')).toContain(
				'border: 1px solid #d1d3e5;',
			);
		}
		const steps = html.slice(
			html.indexOf('>1</span>'),
			html.indexOf('>Signed in<'),
		);
		expect(steps.match(/border-right-width: 1px/g)).toHaveLength(2);
	});

	test('tones a timeline marker, writes its time as given, and joins all but the last', async () => {
		const html = await read('dist/en/sequence.html');
		expect(html).toContain('>{{ time }}</td>');
		expect(html).toContain(
			'border: 1px solid #99d5d0; background-color: #d9efed;',
		);
		const events = html.slice(html.indexOf('>Signed in<'));
		expect(events.match(/border-right-width: 1px/g)).toHaveLength(2);
		expect(html).toContain('>No activity yet</p>');
	});

	test.each([
		['welcome.vue', ['html-align', 'html-aria-hidden']],
		// The caption's caption-side falls back on its align="bottom".
		['gallery.vue', ['css-caption-side', 'html-align', 'html-align']],
		['sequence.vue', ['html-align', 'html-aria-hidden']],
	])(
		'caniemail reports for Gmail, Outlook and Apple Mail only the known partial support of %s',
		async (email, known) => {
			const port = 39_000 + Math.floor(Math.random() * 900);
			const child = Bun.spawn([maizzle, 'serve', '--port', String(port)], {
				cwd: fixture,
				stdout: 'ignore',
				stderr: 'ignore',
			});
			try {
				const url = `http://localhost:${port}/__maizzle/compatibility/emails/${email}`;
				let issues:
					| {
							kind: string;
							slug: string;
							severity?: string;
							supportLevel?: string;
					  }[]
					| null = null;
				for (let attempt = 0; attempt < 60 && issues === null; attempt++) {
					issues = await fetch(url)
						.then((response) => (response.ok ? response.json() : null))
						.catch(() => Bun.sleep(500).then(() => null));
				}
				// Everything reported is partial support with a fallback, and known:
				// a new finding shows up here as a diff.
				expect(issues?.map((issue) => issue.slug).sort()).toEqual(known);
				expect(
					issues?.filter(
						(issue) =>
							issue.supportLevel === 'unsupported' ||
							issue.severity === 'error',
					),
				).toEqual([]);
			} finally {
				child.kill();
				await child.exited;
			}
		},
		60_000,
	);
});

describe('a component without the ui plugin', () => {
	afterAll(() => rmSync(cases, { recursive: true, force: true }));

	test('fails the build, naming the component and the fix', async () => {
		const root = `${cases}/without-ui`;
		rmSync(root, { recursive: true, force: true });
		const files: Record<string, string> = {
			'maizzle.config.ts': [
				"import { COMPONENTS_DIR } from '../../../src/index';",
				"export default { components: { source: [{ path: COMPONENTS_DIR, prefix: 'Nx' }] } };",
			].join('\n'),
			'emails/welcome.vue': '<template><NxLayout>Hello</NxLayout></template>',
		};
		for (const [path, content] of Object.entries(files)) {
			mkdirSync(dirname(`${root}/${path}`), { recursive: true });
			writeFileSync(`${root}/${path}`, content);
		}
		const { code, output } = await run(root, 'build');
		expect(code).not.toBe(0);
		expect(output).toContain(
			'NxLayout: ui() is not in the plugins of defineMailConfig',
		);
	}, 60_000);
});
