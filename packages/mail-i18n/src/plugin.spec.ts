import { describe, expect, test } from 'bun:test';
import { i18n } from './plugin';

const refuses = (options: unknown, message: string) =>
	expect(() => i18n(options as never)).toThrow(new TypeError(message));

describe('i18n — wiring mistakes', () => {
	test('refuses options that are not an object', () => {
		refuses(
			undefined,
			"i18n: options must be an object, as { locales: ['en', 'fr'] }",
		);
	});

	test('refuses locales that are not a list of locales', () => {
		const empty =
			"i18n: locales must hold at least one locale, as ['en', 'fr']";
		refuses({}, empty);
		refuses({ locales: [] }, empty);
		refuses({ locales: 'en' }, empty);
		const tag =
			'i18n: locales holds something that is not a locale — write each as a BCP 47 tag, as en or pt-BR';
		refuses({ locales: ['EN'] }, tag);
		refuses({ locales: ['en_US'] }, tag);
		refuses({ locales: [1] }, tag);
		refuses(
			{ locales: ['en', 'en'] },
			'i18n: locales holds the same locale twice',
		);
	});

	test('refuses a fallback locale outside the locales', () => {
		refuses(
			{ locales: ['en'], fallbackLocale: 'fr' },
			'i18n: fallbackLocale must be one of locales',
		);
	});

	test('refuses a folder that is not one, and an unknown layout', () => {
		refuses(
			{ locales: ['en'], dir: '' },
			'i18n: dir must be a folder of the project',
		);
		refuses(
			{ locales: ['en'], emails: 1 },
			'i18n: emails must be a folder of the project',
		);
		refuses(
			{ locales: ['en'], layout: 'tree' },
			"i18n: layout must be 'nested' or 'flat'",
		);
	});

	test('refuses catalogues that are not a list of catalogues by locale', () => {
		const message =
			'i18n: catalogues must be a list of catalogues by locale, as [{ en: {...}, fr: {...} }]';
		refuses({ locales: ['en'], catalogues: { en: {} } }, message);
		refuses({ locales: ['en'], catalogues: [null] }, message);
		refuses({ locales: ['en'], catalogues: [{ en: 'Hello' }] }, message);
	});
});
