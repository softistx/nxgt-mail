import { beforeAll, describe, expect, test } from 'bun:test';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const fixture = fileURLToPath(new URL('../test/fixture', import.meta.url));
const maizzle = fileURLToPath(
	new URL('../node_modules/.bin/maizzle', import.meta.url),
);

/** Runs `maizzle build` in the fixture project, as a project runs it. */
async function build(...args: string[]): Promise<void> {
	const run = Bun.spawn([maizzle, 'build', ...args], {
		cwd: fixture,
		stdout: 'pipe',
		stderr: 'pipe',
	});
	const [code, stdout, stderr] = await Promise.all([
		run.exited,
		new Response(run.stdout).text(),
		new Response(run.stderr).text(),
	]);
	if (code !== 0) throw new Error(`maizzle build failed:\n${stdout}${stderr}`);
}

const read = (path: string) => Bun.file(`${fixture}/${path}`).text();

describe('a project built with maizzle build', () => {
	let html = '';
	let production = '';

	beforeAll(async () => {
		await rm(`${fixture}/dist`, { recursive: true, force: true });
		await rm(`${fixture}/dist-production`, { recursive: true, force: true });
		await build();
		await build('-c', 'maizzle.config.production.ts');
		html = await read('dist/hello.html');
		production = await read('dist-production/hello.html');
	}, 120_000);

	test("runs both plugins' beforeRender, in order", () => {
		expect(html).toContain('<p>alpha then beta</p>');
		expect(html).not.toContain('[[');
	});

	test('runs every afterTransform, the plugins in order and the project last', () => {
		expect(html.trimEnd()).toEndWith(
			'<!-- alpha --><!-- beta --><!-- project -->',
		);
	});

	test("the project's key wins over a plugin's, and a key only a plugin sets stays", () => {
		expect(html).toContain('<p>from the project / alpha</p>');
	});

	test("keeps both plugins' components, and the project's own", () => {
		expect(html).toContain('<span data-badge="alpha">alpha badge</span>');
		expect(html).toContain('<span data-badge="beta">beta badge</span>');
		expect(html).toContain(
			`<p data-from="project">the project's signature</p>`,
		);
	});

	test('writes a plain-text part next to the HTML', async () => {
		const text = await read('dist/hello.txt');
		expect(text).toContain('alpha then beta');
		expect(text).not.toContain('<');
	});

	test('the plain-text part reads as one: paragraphs, line breaks, no invisible character, a link once', async () => {
		const text = await read('dist/hello.txt');
		expect(text).toContain('alpha then beta\n\n');
		expect(text).toContain('line one\nline two');
		expect(text).not.toMatch(/[\u200B-\u200D\uFEFF]/);
		expect(text).not.toMatch(/\n{3}/);
		expect(text.match(/https:\/\/example\.test\/go/g)).toHaveLength(1);
		expect(text).toEndWith('\n');
		expect(text).not.toStartWith('\n');
	});

	test('joins a long paragraph Maizzle wrapped over several source lines back into one', async () => {
		const html = await read('dist/hello.html');
		// The build itself keeps the source's wrap: prove this is exercised.
		expect(html).toMatch(/If you did not ask for this, you can\nignore/);

		const text = await read('dist/hello.txt');
		expect(text).toContain(
			'If you did not ask for this, you can ignore this e-mail: no changes were made to your account, and nothing else is required of you.\n',
		);
	});

	test('the production config minifies, and keeps every hook', () => {
		expect(html).toContain('</p> <p>');
		expect(production).not.toContain('</p> <p>');
		expect(production.length).toBeLessThan(html.length);
		expect(production).toContain('alpha then beta');
		expect(production.trimEnd()).toEndWith(
			'<!-- alpha --><!-- beta --><!-- project -->',
		);
	});
});
