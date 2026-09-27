import { IntlMessageFormat } from 'intl-messageformat';
import type { Catalogue, Catalogues } from './catalogues';

/** The values a message's arguments take: `{ name: 'Ada', count: 3 }`. */
export type MessageArgs = Readonly<Record<string, string | number | Date>>;

/** A locale, or a function that answers it at each call — as in `@nxgt/i18n`. */
export type LanguageProvider = string | (() => string);

/** `t(key, args?, language?)`: the message `key`, formatted in the language. */
export type Translate = (
	key: string,
	args?: MessageArgs,
	language?: LanguageProvider,
) => string;

function lookup(catalogue: Catalogue, key: string): string | null {
	let node: string | Catalogue | undefined = catalogue;
	for (const segment of key.split('.')) {
		if (typeof node !== 'object' || !Object.hasOwn(node, segment)) return null;
		node = node[segment];
	}
	return typeof node === 'string' ? node : null;
}

const resolveLanguage = (language: LanguageProvider): unknown =>
	typeof language === 'function' ? language() : language;

/**
 * Formats with a cache of compiled messages, one per locale and key. A
 * message that does not format **throws**, the formatter's error as the
 * cause.
 */
export function createFormatter(prefix: string) {
	const compiled = new Map<string, IntlMessageFormat>();
	return (locale: string, key: string, text: string, args?: MessageArgs) => {
		const id = `${locale}\u0000${key}`;
		try {
			let format = compiled.get(id);
			if (format === undefined) {
				format = new IntlMessageFormat(text, locale, undefined, {
					ignoreTag: true,
				});
				compiled.set(id, format);
			}
			return String(format.format(args));
		} catch (cause) {
			throw new Error(`${prefix}: ${locale}: ${key} could not be formatted`, {
				cause,
			});
		}
	};
}

/**
 * The translator of `@nxgt/i18n`, for mail: `createTranslator(catalogues,
 * getLanguage)` answers `t(key, args?, language?)`.
 *
 * Where `@nxgt/i18n` answers the key, this **throws**: a key the language's
 * catalogue does not have, a language with no catalogue, and a message that
 * does not format. An e-mail is not sent with a key in it.
 *
 * ```ts
 * import en from './locales/en.json';
 * import fr from './locales/fr.json';
 *
 * const t = createTranslator({ en, fr }, () => pickLocale(user.locale, ['en', 'fr'], 'en'));
 * t('verify-email.subject');
 * ```
 */
export function createTranslator(
	catalogues: Catalogues,
	getLanguage: LanguageProvider,
): Translate {
	if (typeof catalogues !== 'object' || catalogues === null) {
		throw new TypeError(
			'createTranslator: catalogues must be an object of catalogues by locale, as { en, fr }',
		);
	}
	if (typeof getLanguage !== 'string' && typeof getLanguage !== 'function') {
		throw new TypeError(
			'createTranslator: getLanguage must be a locale or a function that answers one',
		);
	}
	const format = createFormatter('t');
	return (key, args, language = getLanguage) => {
		const locale = resolveLanguage(language);
		if (typeof locale !== 'string' || !Object.hasOwn(catalogues, locale)) {
			throw new Error(
				't: the language is not a locale of the catalogues — pick one with pickLocale',
			);
		}
		const text = lookup(catalogues[locale] as Catalogue, key);
		if (text === null) throw new Error(`t: ${locale}: ${key} is not a key`);
		return format(locale, key, text, args);
	};
}
