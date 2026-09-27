import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	builtinImports,
	duplicateClasses,
	importTarget,
	licenseProblems,
	manifestShapeProblems,
	NOT_A_BUILD_INPUT,
	staleBuilds,
	subpathsOf,
} from './verify-artifacts';

describe('subpathsOf', () => {
	test('names every exported subpath, and not package.json', () => {
		expect(
			subpathsOf('@nxgt/janus', {
				'.': {},
				'./identities': {},
				'./conformance': {},
				'./package.json': './package.json',
			}),
		).toEqual([
			'@nxgt/janus',
			'@nxgt/janus/identities',
			'@nxgt/janus/conformance',
		]);
	});
});

describe('duplicateClasses — the highest packaging risk in AGENTS.md', () => {
	test('finds a class defined in two entry bundles', () => {
		expect(
			duplicateClasses([
				[
					'index.js',
					'class JanusError extends Error {}\nclass StoreFailure {}',
				],
				['identities/index.js', 'class StoreFailure {}'],
			]),
		).toEqual([['StoreFailure', ['index.js', 'identities/index.js']]]);
	});

	test('does not count a shared chunk: that is the fix, not the symptom', () => {
		expect(
			duplicateClasses([
				['chunks/errors-abc.js', 'class StoreFailure {}'],
				['index.js', 'import "./chunks/errors-abc.js";'],
				['identities/index.js', 'import "../chunks/errors-abc.js";'],
			]),
		).toEqual([]);
	});

	test('reads only definitions at the start of a line, not a mention', () => {
		expect(
			duplicateClasses([
				['a.js', 'class Thing {}'],
				['b.js', '// the class Thing lives in a.js\nconst x = new Thing();'],
			]),
		).toEqual([]);
	});

	test('catches what Bun.build does without splitting, and passes what it does with it', async () => {
		// Measured, not assumed: two entry points sharing one class module.
		const dir = await mkdtemp(join(tmpdir(), 'mail-splitting-'));
		await writeFile(
			join(dir, 'errors.ts'),
			'export class StoreFailure extends Error {}\n',
		);
		await writeFile(
			join(dir, 'a.ts'),
			"export { StoreFailure } from './errors';\n",
		);
		await writeFile(
			join(dir, 'b.ts'),
			"export { StoreFailure } from './errors';\n",
		);

		const bundles = async (splitting: boolean) => {
			const out = join(dir, splitting ? 'split' : 'inline');
			const result = await Bun.build({
				entrypoints: [join(dir, 'a.ts'), join(dir, 'b.ts')],
				outdir: out,
				splitting,
				naming: { chunk: 'chunks/[name]-[hash].[ext]' },
			});
			expect(result.success).toBe(true);
			const files: [string, string][] = [];
			for await (const rel of new Bun.Glob('**/*.js').scan({ cwd: out })) {
				files.push([rel, await Bun.file(join(out, rel)).text()]);
			}
			return files;
		};

		expect(duplicateClasses(await bundles(false)).map(([cls]) => cls)).toEqual([
			'StoreFailure',
		]);
		expect(duplicateClasses(await bundles(true))).toEqual([]);
	});
});

describe('manifestShapeProblems', () => {
	const versions = { '@nxgt/janus': '0.2.0', '@nxgt/janus-mongo': '0.1.0' };
	const adapter = (
		peerDependencies: Record<string, string>,
		name = '@nxgt/janus-mongo',
	) => ({
		name,
		peerDependencies,
	});

	test('accepts a caret range on a sibling that includes it', () => {
		expect(
			manifestShapeProblems(
				[{ name: '@nxgt/janus' }, adapter({ '@nxgt/janus': '^0.2.0' })],
				versions,
			),
		).toEqual([]);
	});

	test('refuses an exact pin on a sibling: two copies, two StoreFailure classes', () => {
		const problems = manifestShapeProblems(
			[{ name: '@nxgt/janus' }, adapter({ '@nxgt/janus': '0.2.0' })],
			versions,
		);
		expect(problems).toEqual([
			expect.stringContaining('pins a sibling exactly'),
		]);
	});

	test('refuses a sibling range that leaves out the sibling beside it', () => {
		const problems = manifestShapeProblems(
			[{ name: '@nxgt/janus' }, adapter({ '@nxgt/janus': '^0.1.0' })],
			versions,
		);
		expect(problems).toEqual([
			expect.stringContaining('leaves out @nxgt/janus@0.2.0'),
		]);
	});

	test('refuses a package that lists itself', () => {
		const problems = manifestShapeProblems(
			[{ name: '@nxgt/janus', dependencies: { '@nxgt/janus': '.' } }],
			{},
		);
		expect(problems).toEqual([expect.stringContaining('lists itself')]);
	});

	test('refuses link: and file: where a consumer installs, and not in devDependencies', () => {
		expect(
			manifestShapeProblems(
				[
					{
						name: '@nxgt/janus',
						dependencies: { a: 'link:../a' },
						optionalDependencies: { b: 'file:../b' },
						devDependencies: { c: 'link:../c' },
					},
				],
				{},
			),
		).toEqual([
			'@nxgt/janus: dependencies.a = link:../a',
			'@nxgt/janus: optionalDependencies.b = file:../b',
		]);
	});
});

describe('licenseProblems', () => {
	test('wants MIT and a LICENSE in the tarball itself', () => {
		expect(
			licenseProblems({ name: 'x', license: 'MIT' }, ['package/LICENSE']),
		).toEqual([]);
		expect(licenseProblems({ name: 'x', license: 'ISC' }, [])).toEqual([
			'x: license is ISC, not MIT',
			'x: the tarball has no LICENSE',
		]);
	});
});

describe('staleBuilds', () => {
	test('reports a missing dist/, and a src/ newer than dist/', async () => {
		const root = await mkdtemp(join(tmpdir(), 'mail-stale-'));
		const pkg = (name: string) => ({ name, dir: join(root, name) });

		for (const name of ['fresh', 'stale', 'unbuilt']) {
			await mkdir(join(root, name, 'src'), { recursive: true });
			await writeFile(join(root, name, 'src', 'index.ts'), '');
		}
		for (const name of ['fresh', 'stale']) {
			await mkdir(join(root, name, 'dist'), { recursive: true });
			await writeFile(join(root, name, 'dist', 'index.js'), '');
		}
		const old = new Date('2026-01-01T00:00:00Z');
		const later = new Date('2026-01-01T00:01:00Z');
		await utimes(join(root, 'fresh', 'src', 'index.ts'), old, old);
		await utimes(join(root, 'fresh', 'dist', 'index.js'), later, later);
		await utimes(join(root, 'stale', 'dist', 'index.js'), old, old);
		await utimes(join(root, 'stale', 'src', 'index.ts'), later, later);

		expect(
			await staleBuilds([pkg('fresh'), pkg('stale'), pkg('unbuilt')]),
		).toEqual(['stale: src/ is 60s newer than dist/', 'unbuilt: no dist/']);
	});

	test('does not count a spec or a snapshot as a build input', () => {
		// CI runs the tests between the build and this script, and `bun test`
		// rewrites a snapshot's mtime: counting them failed a green pipeline.
		expect(NOT_A_BUILD_INPUT.test('identities/create.spec.ts')).toBe(true);
		expect(NOT_A_BUILD_INPUT.test('__snapshots__/a.snap')).toBe(true);
		expect(NOT_A_BUILD_INPUT.test('identities/create.ts')).toBe(false);
	});
});

describe('builtinImports — what an edge runtime refuses', () => {
	const files = (entries: Record<string, string>) =>
		new Map(Object.entries(entries));

	test('finds a built-in reached through a chunk the entry shares', () => {
		expect(
			builtinImports(
				'dist/index.js',
				files({
					'dist/index.js': 'import { a } from "./chunks/a.js";',
					'dist/chunks/a.js':
						'import { b } from "./b.js";\nexport const a = 1;',
					'dist/chunks/b.js': 'import { readFileSync } from "node:fs";',
				}),
			),
		).toEqual(['dist/chunks/b.js: node:fs']);
	});

	test('counts a bare built-in, a subpath of one, bun:, a re-export and a dynamic import', () => {
		expect(
			builtinImports(
				'index.js',
				files({
					'index.js': [
						"import 'fs';",
						"export { join } from 'path/posix';",
						"const t = await import('bun:test');",
						"const u = await import ('node:url');",
					].join('\n'),
				}),
			),
		).toEqual([
			'index.js: fs',
			'index.js: path/posix',
			'index.js: bun:test',
			'index.js: node:url',
		]);
	});

	test('does not follow a dependency, nor count one', () => {
		expect(
			builtinImports(
				'index.js',
				files({
					'index.js': 'import { Resend } from "resend";\nimport "@nxgt/mail";',
				}),
			),
		).toEqual([]);
	});

	test('passes what @nxgt/mail builds: the root free, the renderer not', () => {
		const built = files({
			'dist/index.js': 'import { x } from "./chunks/errors.js";',
			'dist/renderer.js':
				'import { x } from "./chunks/errors.js";\nimport { join } from "node:path";',
			'dist/chunks/errors.js': 'export class MailError extends Error {}',
		});
		expect(builtinImports('dist/index.js', built)).toEqual([]);
		expect(builtinImports('./dist/renderer.js', built)).toEqual([
			'dist/renderer.js: node:path',
		]);
	});

	test('survives an import cycle', () => {
		expect(
			builtinImports(
				'a.js',
				files({ 'a.js': 'import "./b.js";', 'b.js': 'import "./a.js";' }),
			),
		).toEqual([]);
	});
});

describe('importTarget', () => {
	test('reads the import condition, then default, then a bare string', () => {
		expect(
			importTarget({ types: './dist/i.d.ts', import: './dist/i.js' }),
		).toBe('dist/i.js');
		expect(importTarget({ default: './dist/d.js' })).toBe('dist/d.js');
		expect(importTarget('./dist/s.js')).toBe('dist/s.js');
	});

	test('is null for what is not JavaScript, or not there', () => {
		expect(importTarget('./package.json')).toBeNull();
		expect(importTarget('./dist/theme.css')).toBeNull();
		expect(importTarget(undefined)).toBeNull();
	});
});
