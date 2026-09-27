import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	appendChangesetsOutput,
	changesetsGitTagEvent,
	DEVELOP_FILES,
	inDependencyOrder,
	type Pkg,
	pinDocs,
	pinPackageDocs,
	readPackages,
} from './publish';

describe('changesets/action@v2 output', () => {
	test('emits one NDJSON git-tag event per line', () => {
		const line = changesetsGitTagEvent('@nxgt/shared', '@nxgt/shared@1.2.3');
		expect(line.endsWith('\n')).toBe(true);
		expect(JSON.parse(line)).toEqual({
			type: 'git-tag',
			tag: '@nxgt/shared@1.2.3',
			packageName: '@nxgt/shared',
		});
	});

	test('appends events so a second publish does not clobber the first', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'changesets-output-'));
		const path = join(dir, 'output.ndjson');
		await appendChangesetsOutput(path, '@nxgt/i18n', '@nxgt/i18n@1.0.3');
		await appendChangesetsOutput(path, '@nxgt/shared', '@nxgt/shared@1.0.4');
		const raw = await readFile(path, 'utf8');
		const events = raw
			.trim()
			.split('\n')
			.map((line) => JSON.parse(line));
		expect(events).toEqual([
			{
				type: 'git-tag',
				tag: '@nxgt/i18n@1.0.3',
				packageName: '@nxgt/i18n',
			},
			{
				type: 'git-tag',
				tag: '@nxgt/shared@1.0.4',
				packageName: '@nxgt/shared',
			},
		]);
	});
});

describe('inDependencyOrder', () => {
	const pkg = (name: string, deps: string[] = []): Pkg => ({
		name,
		version: '1.0.0',
		dir: `/packages/${name}`,
		deps: new Set(deps),
	});

	test('publishes a dependency before the package that needs it', () => {
		const order = inDependencyOrder([
			pkg('@nxgt/app', ['@nxgt/core']),
			pkg('@nxgt/core'),
			pkg('@nxgt/plugin', ['@nxgt/app']),
		]);
		expect(order.map((p) => p.name)).toEqual([
			'@nxgt/core',
			'@nxgt/app',
			'@nxgt/plugin',
		]);
	});

	test('a dependency outside the workspace waits for nothing', () => {
		const order = inDependencyOrder([pkg('@nxgt/one', ['@nxgt/elsewhere'])]);
		expect(order.map((p) => p.name)).toEqual(['@nxgt/one']);
	});

	test('names the packages in a cycle rather than looping', () => {
		expect(() =>
			inDependencyOrder([
				pkg('@nxgt/a', ['@nxgt/b']),
				pkg('@nxgt/b', ['@nxgt/a']),
			]),
		).toThrow('dependency cycle between: @nxgt/a, @nxgt/b');
	});
});

describe('readPackages', () => {
	test('skips a private package: nothing publishes until v0.1, and the flag is how', async () => {
		const root = await mkdtemp(join(tmpdir(), 'mail-publish-'));
		const manifest = (dir: string, body: Record<string, unknown>) =>
			Bun.write(
				join(root, 'packages', dir, 'package.json'),
				JSON.stringify(body),
			);
		await manifest('janus', {
			name: '@nxgt/janus',
			version: '0.0.0',
			private: true,
		});
		await manifest('janus-mongo', {
			name: '@nxgt/janus-mongo',
			version: '0.1.0',
			peerDependencies: { '@nxgt/janus': '^0.1.0', mongodb: '>=7' },
		});

		const pkgs = await readPackages(root);

		expect(pkgs.map((p) => p.name)).toEqual(['@nxgt/janus-mongo']);
		expect([...(pkgs[0]?.deps ?? [])]).toEqual(['@nxgt/janus']);
	});
});

describe('the docs a release publishes', () => {
	const tag =
		'https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-ui@0.2.0/';

	test('pinDocs points every raw file on develop at the release tag', () => {
		expect(
			pinDocs(
				`<img src="${DEVELOP_FILES}packages/mail-ui/previews/a.png"> ${DEVELOP_FILES}b.png`,
				'@nxgt/mail-ui',
				'0.2.0',
			),
		).toBe(`<img src="${tag}packages/mail-ui/previews/a.png"> ${tag}b.png`);
	});

	test('pinPackageDocs pins the README and docs/, then puts them back', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'mail-pin-'));
		await mkdir(join(dir, 'docs', 'guide'), { recursive: true });
		const readme = `![a](${DEVELOP_FILES}a.png)\n`;
		const guide = `![b](${DEVELOP_FILES}b.png)\n`;
		await writeFile(join(dir, 'README.md'), readme);
		await writeFile(join(dir, 'docs', 'guide', 'x.md'), guide);
		const restore = await pinPackageDocs(dir, '@nxgt/mail-ui', '0.2.0');
		expect(await readFile(join(dir, 'README.md'), 'utf8')).toBe(
			`![a](${tag}a.png)\n`,
		);
		expect(await readFile(join(dir, 'docs', 'guide', 'x.md'), 'utf8')).toBe(
			`![b](${tag}b.png)\n`,
		);
		await restore();
		expect(await readFile(join(dir, 'README.md'), 'utf8')).toBe(readme);
		expect(await readFile(join(dir, 'docs', 'guide', 'x.md'), 'utf8')).toBe(
			guide,
		);
	});

	test('no doc in the repository pins a release tag by hand', async () => {
		const root = join(import.meta.dir, '..');
		const pinned: string[] = [];
		const docs = [
			...new Bun.Glob('packages/*/README.md').scanSync(root),
			...new Bun.Glob('packages/*/docs/**/*.md').scanSync(root),
		];
		expect(docs.length).toBeGreaterThan(7);
		for (const rel of docs) {
			const text = await readFile(join(root, rel), 'utf8');
			if (text.includes('softistx/nxgt-mail/refs/tags/')) pinned.push(rel);
		}
		expect(pinned).toEqual([]);
	});
});
