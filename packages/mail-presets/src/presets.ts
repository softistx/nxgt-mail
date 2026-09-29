import { fileURLToPath } from 'node:url';
import {
	type Catalogue,
	type Catalogues,
	emailKey,
	type TemplateSource,
} from '@nxgt/mail-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';

/** Every preset, by the name of its template and of its built file. */
export const PRESETS = [
	'verify-email',
	'reset-password',
	'password-changed',
	'email-changed',
	'account-deleted',
	'sign-in-code',
	'magic-link',
	'new-sign-in',
	'two-factor-enabled',
	'two-factor-disabled',
	'recovery-code-used',
	'confirm-action',
	'welcome',
	'invitation',
	'invitation-accepted',
] as const;

export type PresetName = (typeof PRESETS)[number];

/** The templates, beside `src/` and `dist/` in the package. */
export const TEMPLATES_DIR = fileURLToPath(
	new URL('../emails', import.meta.url),
);

/** `catalogue` and every group in it, frozen: a project reads them, never changes them. */
function freeze(catalogue: Catalogue): Catalogue {
	for (const value of Object.values(catalogue)) {
		if (typeof value === 'object' && value !== null) freeze(value as Catalogue);
	}
	return Object.freeze(catalogue);
}

/** The messages of every preset, in `en` and `fr`, before {@link presets} keeps the ones asked for. */
export const presetCatalogues: Catalogues = Object.freeze({
	en: freeze(en),
	fr: freeze(fr),
});

export interface PresetsOptions {
	/** The presets to build, as `['verify-email', 'reset-password']`. Default every one. */
	readonly only?: readonly [PresetName, ...PresetName[]];
}

/** What {@link presets} answers, for `@nxgt/mail-i18n`. */
export interface Presets {
	/** For `i18n({ templates })`. */
	readonly templates: TemplateSource;
	/** For `i18n({ catalogues })`: the messages of the presets kept, and the shared `presets.*`. */
	readonly catalogues: Catalogues;
}

function checkOnly(
	only: unknown,
): asserts only is readonly [PresetName, ...PresetName[]] {
	if (!Array.isArray(only) || only.length === 0) {
		throw new TypeError(
			"presets: only must list at least one preset, as ['verify-email']",
		);
	}
	for (const name of only) {
		if (!(PRESETS as readonly unknown[]).includes(name)) {
			throw new TypeError(
				`presets: only holds something that is not a preset — name one of ${PRESETS.join(', ')}`,
			);
		}
	}
	if (new Set(only).size !== only.length) {
		throw new TypeError('presets: only holds the same preset twice');
	}
}

/** `catalogue` with only the groups named in `keys`. */
function pick(catalogue: Catalogue, keys: ReadonlySet<string>): Catalogue {
	return Object.fromEntries(
		Object.entries(catalogue).filter(([key]) => keys.has(key)),
	);
}

/**
 * The preset e-mails of `@nxgt/mail-presets`, for `@nxgt/mail-i18n`:
 *
 * ```ts
 * const mails = presets({ only: ['verify-email', 'reset-password'] });
 * i18n({
 *   locales: ['en', 'fr'],
 *   catalogues: [uiCatalogues, mails.catalogues],
 *   templates: [mails.templates],
 * });
 * ```
 *
 * The project builds them with its own `ui({ brand, theme })`. A template of
 * the same name in its `emails/` replaces a preset, and its catalogue
 * overrides any message key by key.
 */
export function presets(options: PresetsOptions = {}): Presets {
	if (
		typeof options !== 'object' ||
		options === null ||
		Array.isArray(options)
	) {
		throw new TypeError(
			"presets: options must be an object, as { only: ['verify-email'] }",
		);
	}
	if (options.only === undefined) {
		return { templates: { dir: TEMPLATES_DIR }, catalogues: presetCatalogues };
	}
	checkOnly(options.only);
	const [first, ...rest] = options.only;
	const keys = new Set(['presets', ...options.only.map(emailKey)]);
	return {
		templates: { dir: TEMPLATES_DIR, emails: [first, ...rest] },
		catalogues: Object.fromEntries(
			Object.entries(presetCatalogues).map(([locale, catalogue]) => [
				locale,
				pick(catalogue, keys),
			]),
		),
	};
}
