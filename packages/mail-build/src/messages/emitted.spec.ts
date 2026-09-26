import { describe, expect, it } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileMessages } from './compile';

const GOLDEN = join(import.meta.dir, '../../test/types/generated/messages.ts');
// The module a whole build writes: the messages, and `mails`.
const GOLDEN_MAIL = join(import.meta.dir, '../../test/types/generated/mail.ts');
const TSC = Bun.resolveSync('typescript/bin/tsc', import.meta.dir);

/** Compiles one catalogue and writes the module to a temporary folder. */
async function emit(dir: string, name: string, en: Record<string, string>) {
	const { module } = compileMessages({
		locales: ['en'],
		fallbackLocale: 'en',
		sources: [{ name: 'messages/', catalogues: { en } }],
	});
	const path = join(dir, `${name}.ts`);
	await writeFile(path, module);
	return path;
}

describe('the emitted module, as a consumer compiles it', () => {
	it('passes the strictest compiler options a consumer may turn on', async () => {
		// The consumer's compiler checks this file: ignoring the folder in a
		// linter does not help. Measured before the fix: 26 unused parameters,
		// 4 unused helpers, 2 dotted index accesses, and Object.hasOwn below
		// ES2022.
		const dir = await mkdtemp(join(tmpdir(), 'mail-build-strict-'));
		const files = [
			GOLDEN,
			GOLDEN_MAIL,
			await emit(dir, 'plain', { a: 'Hello', b: 'Hi {name}' }),
			await emit(dir, 'dates', { a: '{at, date, short}' }),
		];
		const run = Bun.spawnSync([
			process.execPath,
			TSC,
			'--ignoreConfig',
			'--noEmit',
			'--strict',
			'--exactOptionalPropertyTypes',
			'--noUncheckedIndexedAccess',
			'--noUnusedLocals',
			'--noUnusedParameters',
			'--noPropertyAccessFromIndexSignature',
			'--noImplicitReturns',
			'--target',
			'es2020',
			'--lib',
			'es2020',
			'--module',
			'esnext',
			'--moduleResolution',
			'bundler',
			...files,
		]);
		await rm(dir, { recursive: true });

		expect(run.stdout.toString()).toBe('');
		expect(run.exitCode).toBe(0);
	});

	it('emits only the helpers the messages call', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'mail-build-helpers-'));
		const path = await emit(dir, 'plain', { a: 'Hello {name}' });
		const module = await Bun.file(path).text();
		await rm(dir, { recursive: true });

		for (const helper of ['formatNumber', 'formatDate', 'plural', 'select']) {
			expect(module).not.toContain(`function ${helper}`);
		}
	});

	it('can choose a select branch named __proto__', async () => {
		// A plain "__proto__": key in an object literal sets the prototype
		// instead of adding a branch; the emitted keys are computed.
		const dir = await mkdtemp(join(tmpdir(), 'mail-build-proto-'));
		const path = await emit(dir, 'proto', {
			a: '{kind, select, __proto__ {proto} constructor {ctor} other {other}}',
		});
		const { t } = await import(path);
		await rm(dir, { recursive: true });

		expect(t('en', 'a', { kind: '__proto__' })).toBe('proto');
		expect(t('en', 'a', { kind: 'constructor' })).toBe('ctor');
		expect(t('en', 'a', { kind: 'toString' })).toBe('other');
	});
});
