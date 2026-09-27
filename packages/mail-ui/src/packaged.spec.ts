import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fileForTag } from './packaged';
import { COMPONENTS_DIR } from './plugin';

const root = fileURLToPath(new URL('../test/.packaged', import.meta.url));
const project = { path: `${root}/project` };
const ours = { path: `${root}/ours`, prefix: 'Nx' };
const builtins = { path: `${root}/builtins` };
const folders = [project, ours, builtins];

function write(path: string): void {
	writeFileSync(path, '<template><slot /></template>\n');
}

describe('fileForTag, which finds the file of a tag in an installed template', () => {
	beforeAll(() => {
		rmSync(root, { recursive: true, force: true });
		for (const { path } of folders) mkdirSync(path, { recursive: true });
		for (const name of [
			'card-header',
			'2fa',
			'code-2',
			'a-b',
			'badge',
			'nx-chip',
		]) {
			write(`${ours.path}/${name}.vue`);
		}
		write(`${builtins.path}/Button.vue`);
		write(`${builtins.path}/NxBadge.vue`);
		write(`${project.path}/NxBadge.vue`);
		write(`${project.path}/nx-card-header.vue`);
		write(`${project.path}/card.vue`);
		write(`${ours.path}/notes.md`);
		mkdirSync(`${project.path}/brand`);
		write(`${project.path}/brand/logo.vue`);
	});
	afterAll(() => rmSync(root, { recursive: true, force: true }));

	test('names a file of a prefixed folder with the prefix, once', () => {
		expect(fileForTag([ours], 'NxCardHeader')).toBe(
			`${ours.path}/card-header.vue`,
		);
		expect(fileForTag([ours], 'NxChip')).toBe(`${ours.path}/nx-chip.vue`);
		expect(fileForTag([ours], 'CardHeader')).toBeUndefined();
	});

	test('finds the names no case conversion of the tag gives back', () => {
		expect(fileForTag([ours], 'Nx2fa')).toBe(`${ours.path}/2fa.vue`);
		expect(fileForTag([ours], 'NxCode2')).toBe(`${ours.path}/code-2.vue`);
		expect(fileForTag([ours], 'NxAB')).toBe(`${ours.path}/a-b.vue`);
	});

	test("finds a Pascal-case file, as Maizzle's built-ins are", () => {
		expect(fileForTag(folders, 'Button')).toBe(`${builtins.path}/Button.vue`);
	});

	test("takes the project's file first, in either case, then ours, then the built-ins", () => {
		expect(fileForTag(folders, 'NxBadge')).toBe(`${project.path}/NxBadge.vue`);
		expect(fileForTag(folders, 'NxCardHeader')).toBe(
			`${project.path}/nx-card-header.vue`,
		);
		expect(fileForTag([ours, builtins], 'NxBadge')).toBe(
			`${ours.path}/badge.vue`,
		);
		// A project's card.vue is <Card>, not ours.
		expect(fileForTag(folders, 'Card')).toBe(`${project.path}/card.vue`);
	});

	test('reads only the top of a folder, only .vue files, and skips a missing folder', () => {
		expect(fileForTag(folders, 'BrandLogo')).toBeUndefined();
		expect(fileForTag(folders, 'NxNotes')).toBeUndefined();
		expect(fileForTag([{ path: `${root}/missing` }, ours], 'Nx2fa')).toBe(
			`${ours.path}/2fa.vue`,
		);
		expect(fileForTag(folders, 'NxUnknown')).toBeUndefined();
	});
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
