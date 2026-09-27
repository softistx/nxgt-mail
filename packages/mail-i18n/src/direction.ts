/** Which way a locale reads: `ltr` (English, French, …) or `rtl` (Arabic, Hebrew, …). */
export type Direction = 'ltr' | 'rtl';

/**
 * The base language subtag of every locale this runtime's `Intl` may get
 * wrong or may not answer at all — checked with Node 22 (`Intl.Locale`'s
 * `textInfo` getter) and Bun 1.4 (its `getTextInfo()` method): a fallback,
 * never the first answer, since a runtime that knows a locale properly
 * (`ar-Latn`, written left to right) must win over it.
 */
const RTL_LANGUAGES = new Set([
	'ar', // Arabic
	'arc', // Aramaic
	'dv', // Divehi
	'fa', // Persian
	'ha', // Hausa, written in Ajami
	'he', // Hebrew
	'khw', // Khowar
	'ks', // Kashmiri
	'ku', // Kurdish, written in Sorani
	'ps', // Pashto
	'sd', // Sindhi
	'syr', // Syriac
	'ug', // Uyghur
	'ur', // Urdu
	'yi', // Yiddish
]);

interface TextInfoLocale {
	/** Bun 1.4: a method. */
	getTextInfo?(): { direction: string };
	/** Node 22: a getter. */
	textInfo?: { direction: string };
}

/**
 * The direction `locale` reads in, for `dir` beside `locale` in a template.
 * Asks the runtime's own `Intl.Locale` first (Bun's `getTextInfo()`, Node's
 * `textInfo`), and only falls back to {@link RTL_LANGUAGES} — by the
 * locale's base language subtag — when neither answers, so a runtime with
 * accurate data always wins.
 */
export function localeDirection(locale: string): Direction {
	try {
		const info = new Intl.Locale(locale) as Intl.Locale & TextInfoLocale;
		const direction =
			info.getTextInfo?.().direction ?? info.textInfo?.direction;
		if (direction === 'rtl' || direction === 'ltr') return direction;
	} catch {
		// Not a locale `Intl` parses: fall through to the fallback list below.
	}
	const base = locale.split('-')[0]?.toLowerCase() ?? '';
	return RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
}
