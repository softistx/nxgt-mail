import type { LanguageProvider, MessageArgs } from '@nxgt/i18n-vue/core';
import { createFormatter } from '@nxgt/i18n-vue/core';
import type { Catalogue, Catalogues } from './catalogues';

// `createFormatter` and the two types below are `@nxgt/i18n`'s conventions
// verbatim — `@nxgt/i18n-vue/core` publishes the same function, so this
// package uses it instead of its own copy.
//
// `createTranslator` stays this package's own function, and `Translate`
// stays a plain, non-generic type, for two reasons `@nxgt/i18n-vue/core`'s
// own versions do not hold:
//
// - Its `Translate<K = MessageKey>` defaults its key type from
//   `@nxgt/i18n-vue`'s own augmentable `I18nMessages` — a *different*,
//   global interface than this package's `TemplateMessages` (see `vue.ts`).
//   Re-exporting that generic type unparametrised would have this package's
//   `t()` silently pick up whatever keys an unrelated app registered with
//   `@nxgt/i18n-vue` in the same TypeScript program.
// - Its `lookup` matches a key across both conventions at the call site
//   (`t('linkExpires')` would now find a catalogue's `link-expires`) — the
//   same leniency this package deliberately does not want in
//   `checkCatalogues`, for the same reason: it would revive an old-key
//   override outside a template's build-time check, which stays exact
//   (`template.ts`'s own `Map.get`), quietly, at send time.
export type { LanguageProvider, MessageArgs };
export { createFormatter };

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
