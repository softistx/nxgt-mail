import { describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MailBuildError } from '../errors';
import type { Catalogue } from './catalogue';
import { readCatalogues } from './catalogue';
import { compileMessages, type MessageSource } from './compile';

const FIXTURE = join(import.meta.dir, '../../test/fixtures/basic/messages');
const GOLDEN = join(import.meta.dir, '../../test/types/generated/messages.ts');

const app = (catalogues: Record<string, Catalogue>): MessageSource => ({
	name: 'messages/',
	catalogues,
});

function failure(run: () => unknown): MailBuildError {
	try {
		run();
	} catch (error) {
		if (error instanceof MailBuildError) return error;
		throw error;
	}
	throw new Error('the build did not fail');
}

const en = { greeting: { hello: 'Hello {name}' } };

describe('compileMessages — the module', () => {
	it('emits the module test/types is checked against, byte for byte', async () => {
		// The golden test. The committed module is what `test/types/` compiles
		// against, so the type tests measure real compiler output; this fails
		// when the two drift. Regenerate with UPDATE_GOLDEN=1 bun test.
		const catalogues = await readCatalogues(FIXTURE, ['en', 'fr']);
		const { module } = compileMessages({
			locales: ['en', 'fr'],
			fallbackLocale: 'en',
			sources: [{ name: 'messages/', catalogues }],
		});
		if (process.env.UPDATE_GOLDEN === '1') await Bun.write(GOLDEN, module);

		expect(module).toBe(await Bun.file(GOLDEN).text());
	});

	it('answers the arguments of each key, typed from the fallback locale', () => {
		const { args } = compileMessages({
			locales: ['en'],
			fallbackLocale: 'en',
			sources: [
				app({
					en: {
						a: '{n, plural, one {#} other {#}} {name} {at, date} {g, select, x {} other {}}',
						b: 'nothing',
					},
				}),
			],
		});

		expect(Object.fromEntries(args.get('a') ?? [])).toEqual({
			n: 'number',
			name: 'string',
			at: 'date',
			g: 'string',
		});
		expect(args.get('b')?.size).toBe(0);
	});

	it('types a plain {n} as the number the same message uses it as', () => {
		const { args } = compileMessages({
			locales: ['en'],
			fallbackLocale: 'en',
			sources: [
				app({ en: { a: '{n} ({n, plural, one {one} other {many}})' } }),
			],
		});

		expect(args.get('a')?.get('n')).toBe('number');
	});
});

describe('compileMessages — presets, then the application', () => {
	it('overrides a message one key at a time, never a whole namespace', async () => {
		const { module } = compileMessages({
			locales: ['en'],
			fallbackLocale: 'en',
			sources: [
				{
					name: 'preset a',
					catalogues: { en: { common: { hi: 'Hi', bye: 'Bye' } } },
				},
				{ name: 'preset b', catalogues: { en: { common: { hi: 'Hello' } } } },
				app({ en: { common: { bye: 'Goodbye' } } }),
			],
		});

		expect(module).toContain('"common.hi": (_a, _o) => "Hello"');
		expect(module).toContain('"common.bye": (_a, _o) => "Goodbye"');
	});

	it('lets a source leave a locale out', () => {
		expect(() =>
			compileMessages({
				locales: ['en', 'fr'],
				fallbackLocale: 'en',
				sources: [
					{ name: 'preset', catalogues: { en: { a: 'A' }, fr: null } },
					app({ fr: { a: 'A' } }),
				],
			}),
		).not.toThrow();
	});
});

describe('compileMessages — every build failure names the locale and the key', () => {
	it.each([
		[
			'a message that does not parse',
			{ en: { greeting: { hello: 'Hello {name' } } },
			'MESSAGE_UNPARSABLE',
			'messages: en: greeting.hello is not a valid ICU message (EXPECT_ARGUMENT_CLOSING_BRACE)',
		],
		[
			'a snake_case key',
			// A catalogue is JSON, and the casing rule does not reach into JSON.
			{ en: JSON.parse('{ "verify_email": { "title": "x" } }') },
			'KEY_NOT_CAMEL_CASE',
			'messages: en: verify_email in messages/ is not camelCase — every segment of a key is camelCase, as verifyEmail.title',
		],
		[
			'a snake_case argument',
			{ en: { a: 'Hi {first_name}' } },
			'KEY_NOT_CAMEL_CASE',
			'messages: en: a uses {first_name}, which is not camelCase — an argument is a camelCase name, as {firstName}',
		],
		[
			'an argument used as two kinds in one message',
			{ en: { a: '{x, number} {x, date}' } },
			'ARGUMENT_TYPE_MISMATCH',
			'messages: en: a uses {x} as number and as date',
		],
		[
			'a catalogue whose root is a string',
			{ en: 'Hello' as unknown as Catalogue },
			'CATALOGUE_INVALID',
			'messages: en: (root) in messages/ must be an object of messages',
		],
		[
			'an unsupported number style',
			{ en: { a: '{n, number, currency}' } },
			'MESSAGE_UNSUPPORTED',
			'messages: en: a uses the number style currency, which is not supported',
		],
		[
			'an unsupported date style',
			{ en: { a: '{at, date, weekday}' } },
			'MESSAGE_UNSUPPORTED',
			'messages: en: a uses the date style weekday, which is not supported',
		],
		[
			'a skeleton option Intl does not read',
			{ en: { a: '{n, number, ::percent scale/100}' } },
			'MESSAGE_UNSUPPORTED',
			'messages: en: a uses a number skeleton option Intl does not read (scale), which is not supported',
		],
		[
			'an ES2023 rounding option',
			{ en: { a: '{n, number, ::.00 rounding-mode-floor}' } },
			'MESSAGE_UNSUPPORTED',
			'messages: en: a uses a number skeleton option Intl does not read (roundingMode), which is not supported',
		],
		[
			'a currency skeleton without a currency',
			{ en: { a: '{n, number, ::currency}' } },
			'MESSAGE_UNSUPPORTED',
			'messages: en: a uses a number skeleton Intl refuses in en, which is not supported',
		],
		[
			'a leaf that is not a string',
			{ en: { a: { b: 42 } } as unknown as Catalogue },
			'CATALOGUE_INVALID',
			'messages: en: a.b in messages/ must be a message (a string) or an object of messages',
		],
		[
			'a key with a dot in it',
			{ en: JSON.parse('{ "verifyEmail.title": "x" }') },
			'KEY_NOT_CAMEL_CASE',
			'messages: en: verifyEmail.title in messages/ holds a dot — nest it instead, one object per segment',
		],
	])('refuses %s', (_, catalogues, code, message) => {
		const error = failure(() =>
			compileMessages({
				locales: ['en'],
				fallbackLocale: 'en',
				sources: [app(catalogues)],
			}),
		);

		expect(error.code).toBe(code as MailBuildError['code']);
		expect(error.message).toBe(message);
		expect(error.locale).toBe('en');
	});

	it.each([
		[
			'a key missing in a locale',
			{ en, fr: { greeting: {} } },
			'KEY_MISSING',
			'messages: fr: greeting.hello is missing — en, the fallback locale, has it',
		],
		[
			'a key the fallback locale does not have',
			{ en, fr: { greeting: { hello: 'Salut {name}', bye: 'Au revoir' } } },
			'KEY_UNKNOWN',
			'messages: fr: greeting.bye is not a key of en, the fallback locale',
		],
		[
			'an argument the fallback locale does not declare',
			{ en, fr: { greeting: { hello: 'Salut {nom}' } } },
			'ARGUMENT_UNDECLARED',
			'messages: fr: greeting.hello uses {nom}, which en does not declare',
		],
		[
			'an argument of another kind',
			{
				en: { a: '{n, plural, one {# day} other {# days}}' },
				fr: { a: '{n} jours' },
			},
			'ARGUMENT_TYPE_MISMATCH',
			'messages: fr: a uses {n} as string, and en declares it as number',
		],
	])('refuses %s', (_, catalogues, code, message) => {
		const error = failure(() =>
			compileMessages({
				locales: ['en', 'fr'],
				fallbackLocale: 'en',
				sources: [app(catalogues as Record<string, Catalogue>)],
			}),
		);

		expect(error.code).toBe(code as MailBuildError['code']);
		expect(error.message).toBe(message);
		expect(error.locale).toBe('fr');
	});

	it('lets a translation leave out an argument the fallback locale uses', () => {
		expect(() =>
			compileMessages({
				locales: ['en', 'fr'],
				fallbackLocale: 'en',
				sources: [app({ en, fr: { greeting: { hello: 'Salut' } } })],
			}),
		).not.toThrow();
	});

	it('refuses a namespace a later source turns into a message', () => {
		const error = failure(() =>
			compileMessages({
				locales: ['en'],
				fallbackLocale: 'en',
				sources: [
					{ name: 'preset', catalogues: { en: { common: { hi: 'Hi' } } } },
					app({ en: { common: 'Hi' } }),
				],
			}),
		);

		expect(error.code).toBe('KEY_CONFLICT');
		expect(error.message).toBe(
			'messages: en: common is a namespace in preset and a message in messages/ — a later catalogue overrides a message, never a namespace',
		);
	});

	it('refuses a message a later source turns into a namespace', () => {
		const error = failure(() =>
			compileMessages({
				locales: ['en'],
				fallbackLocale: 'en',
				sources: [
					{ name: 'preset', catalogues: { en: { common: 'Hi' } } },
					app({ en: { common: { hi: 'Hi' } } }),
				],
			}),
		);

		expect(error.code).toBe('KEY_CONFLICT');
		expect(error.message).toBe(
			'messages: en: common is a message in preset and a namespace in messages/ — a later catalogue overrides a message, never a namespace',
		);
	});

	it('never puts the text of a message in an error', () => {
		const error = failure(() =>
			compileMessages({
				locales: ['en'],
				fallbackLocale: 'en',
				sources: [app({ en: { a: 'secret-7f3a {oops' } })],
			}),
		);

		expect(error.message).not.toContain('secret-7f3a');
		// The parser's own error holds the text, so it is not the cause.
		expect(error.cause).toBeUndefined();
	});
});

describe('compileMessages — wiring mistakes are TypeErrors', () => {
	it.each([
		[
			{ locales: [], fallbackLocale: 'en' },
			'compileMessages: locales must hold at least one locale',
		],
		[
			{ locales: ['en', 'en'], fallbackLocale: 'en' },
			'compileMessages: locales holds the same locale twice',
		],
		[
			{ locales: ['en'], fallbackLocale: 'fr' },
			'compileMessages: fallbackLocale must be one of locales',
		],
		[
			{ locales: ['en_US'], fallbackLocale: 'en_US' },
			'compileMessages: en_US is not a locale — write it as a BCP 47 tag, as en or pt-BR',
		],
	])('%o', (options, message) => {
		expect(() => compileMessages({ ...options, sources: [] })).toThrow(
			new TypeError(message),
		);
	});
});

describe('readCatalogues', () => {
	it('lets a file-system error other than a missing file through', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'mail-build-dir-'));
		await mkdir(join(dir, 'en.json'));
		const error = await readCatalogues(dir, ['en']).then(
			() => null,
			(e: unknown) => e as NodeJS.ErrnoException,
		);
		await rm(dir, { recursive: true });

		expect(error?.code).toBe('EISDIR');
	});

	it('answers null for a locale without a file', async () => {
		expect(await readCatalogues(FIXTURE, ['en', 'de'])).toMatchObject({
			de: null,
		});
	});

	it('fails the build on a file that is not JSON', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'mail-build-broken-'));
		await writeFile(join(dir, 'en.json'), '{ "a": ');
		const error = await readCatalogues(dir, ['en']).then(
			() => null,
			(e: unknown) => e,
		);
		await rm(dir, { recursive: true });

		expect(error).toBeInstanceOf(MailBuildError);
		expect((error as MailBuildError).code).toBe('CATALOGUE_INVALID');
		expect((error as MailBuildError).message).toBe(
			`messages: en: ${join(dir, 'en.json')} is not valid JSON`,
		);
	});
});
