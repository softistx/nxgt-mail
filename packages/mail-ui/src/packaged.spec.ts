import { afterAll, describe, expect, test } from 'bun:test';
import {
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { maizzleComponents } from './packaged';
import { COMPONENTS_DIR } from './plugin';

const api = (tag: string) => ({
	findComponent: async (name: string) =>
		name === tag ? { as: name, from: `/${tag}.vue` } : undefined,
});

describe("maizzleComponents, which finds Maizzle's resolver", () => {
	test('takes the instance that is not ours', async () => {
		const ours = api('Ours');
		const found = maizzleComponents(
			[
				{ name: 'vite:vue' },
				{ name: 'unplugin-vue-components', api: ours },
				{ name: 'unplugin-vue-components', api: api('Button') },
			],
			ours,
		);
		expect(await found?.findComponent('Button')).toEqual({
			as: 'Button',
			from: '/Button.vue',
		});
	});

	test('is null without one', () => {
		expect(maizzleComponents([{ name: 'vite:vue' }], undefined)).toBeNull();
	});
});

const root = fileURLToPath(new URL('../test/.packaged', import.meta.url));
const maizzle = fileURLToPath(
	new URL('../node_modules/.bin/maizzle', import.meta.url),
);

describe('a component installed from npm', () => {
	afterAll(() => rmSync(root, { recursive: true, force: true }));

	test("resolves its tags as the project's would: subfolders, components.source and the built-ins", async () => {
		rmSync(root, { recursive: true, force: true });
		const files: Record<string, string> = {
			'maizzle.config.ts': [
				"import { defineMailConfig } from '@nxgt/mail-config';",
				"import { ui } from '../../src/index';",
				'export default defineMailConfig({',
				"  plugins: [ui({ brand: { name: 'Acme' } })],",
				"  components: { source: [{ path: 'shared', prefix: 'Acme' }] },",
				'});',
			].join('\n'),
			'emails/welcome.vue': [
				'<script setup>',
				"import Card from 'acme-mails/card.vue';",
				'</script>',
				'<template><NxLayout><Card /></NxLayout></template>',
			].join('\n'),
			'components/brand/logo.vue': '<template><p>Brand logo</p></template>',
			'shared/box.vue': '<template><p>Acme box</p></template>',
			'node_modules/acme-mails/package.json':
				'{ "name": "acme-mails", "version": "1.0.0", "type": "module" }',
			'node_modules/acme-mails/card.vue':
				'<template><NxCard><BrandLogo /><AcmeBox /><Spacer height="8px" /></NxCard></template>',
		};
		for (const [path, content] of Object.entries(files)) {
			mkdirSync(dirname(`${root}/${path}`), { recursive: true });
			writeFileSync(`${root}/${path}`, content);
		}
		const child = Bun.spawn([maizzle, 'build'], {
			cwd: root,
			stdout: 'pipe',
			stderr: 'pipe',
		});
		const [code, stdout, stderr] = await Promise.all([
			child.exited,
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
		]);
		expect({ code, output: code === 0 ? '' : stdout + stderr }).toEqual({
			code: 0,
			output: '',
		});
		const html = await Bun.file(`${root}/dist/welcome.html`).text();
		expect(html).toContain('Brand logo');
		expect(html).toContain('Acme box');
	}, 60_000);
});

describe("the package's components", () => {
	test('none uses its own name as a tag, which Vue would read as the file itself', () => {
		const offenders = readdirSync(COMPONENTS_DIR)
			.filter((file) => file.endsWith('.vue'))
			.filter((file) => {
				const self = file
					.slice(0, -'.vue'.length)
					.replace(/(^|-)(.)/g, (_, _dash: string, c: string) =>
						c.toUpperCase(),
					);
				return new RegExp(`<${self}[\\s/>]`).test(
					readFileSync(`${COMPONENTS_DIR}/${file}`, 'utf8'),
				);
			});
		expect(offenders).toEqual([]);
	});
});
