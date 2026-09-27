import type {
	LanguageProvider,
	MessageArgs,
	Translate,
} from '@nxgt/i18n-vue/core';
import {
	createFormatter,
	createTranslator as createTranslatorCore,
} from '@nxgt/i18n-vue/core';
import type { Catalogues } from './catalogues';

// `createFormatter`, `createTranslator` and the types below are `@nxgt/i18n`'s
// conventions verbatim — `@nxgt/i18n-vue/core` publishes the same functions,
// checked against this package's own `translator.spec.ts` — so this package
// uses those instead of its own copies.
export type { LanguageProvider, MessageArgs, Translate };
export { createFormatter };

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
	return createTranslatorCore(catalogues, getLanguage);
}
