import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fileForTag } from './packaged';

const root = fileURLToPath(new URL('../test/.packaged', import.meta.url));
const project = `${root}/project`;
const ours = `${root}/ours`;
const builtins = `${root}/builtins`;
const dirs = [project, ours, builtins];

function write(path: string): void {
	writeFileSync(path, '<template><slot /></template>\n');
}

describe('fileForTag, which finds the file of a tag in an installed template', () => {
	beforeAll(() => {
		rmSync(root, { recursive: true, force: true });
		for (const dir of dirs) mkdirSync(dir, { recursive: true });
		for (const name of [
			'nx-card-header',
			'nx-2fa',
			'nx-code-2',
			'nx-a-b',
			'nx-badge',
		]) {
			write(`${ours}/${name}.vue`);
		}
		write(`${builtins}/Button.vue`);
		write(`${builtins}/NxBadge.vue`);
		write(`${project}/NxBadge.vue`);
		write(`${project}/nx-card-header.vue`);
		write(`${ours}/notes.md`);
		mkdirSync(`${project}/brand`);
		write(`${project}/brand/logo.vue`);
	});
	afterAll(() => rmSync(root, { recursive: true, force: true }));

	test('finds a kebab-case file as Maizzle names it', () => {
		expect(fileForTag([ours], 'NxCardHeader')).toBe(
			`${ours}/nx-card-header.vue`,
		);
	});

	test('finds the names no case conversion of the tag gives back', () => {
		expect(fileForTag([ours], 'Nx2fa')).toBe(`${ours}/nx-2fa.vue`);
		expect(fileForTag([ours], 'NxCode2')).toBe(`${ours}/nx-code-2.vue`);
		expect(fileForTag([ours], 'NxAB')).toBe(`${ours}/nx-a-b.vue`);
	});

	test("finds a Pascal-case file, as Maizzle's built-ins are", () => {
		expect(fileForTag(dirs, 'Button')).toBe(`${builtins}/Button.vue`);
	});

	test("takes the project's file first, in either case, then ours, then the built-ins", () => {
		expect(fileForTag(dirs, 'NxBadge')).toBe(`${project}/NxBadge.vue`);
		expect(fileForTag(dirs, 'NxCardHeader')).toBe(
			`${project}/nx-card-header.vue`,
		);
		expect(fileForTag([ours, builtins], 'NxBadge')).toBe(
			`${ours}/nx-badge.vue`,
		);
	});

	test('reads only the top of a folder, only .vue files, and skips a missing folder', () => {
		expect(fileForTag(dirs, 'BrandLogo')).toBeUndefined();
		expect(fileForTag(dirs, 'Notes')).toBeUndefined();
		expect(fileForTag([`${root}/missing`, ours], 'Nx2fa')).toBe(
			`${ours}/nx-2fa.vue`,
		);
		expect(fileForTag(dirs, 'NxUnknown')).toBeUndefined();
	});
});
