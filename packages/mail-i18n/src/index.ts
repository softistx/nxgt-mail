/**
 * `@nxgt/mail-i18n` — i18n for a Maizzle project, shaped like `@nxgt/i18n`.
 *
 * ```ts
 * // maizzle.config.ts
 * import { defineMailConfig } from '@nxgt/mail-config';
 * import { i18n } from '@nxgt/mail-i18n';
 *
 * export default defineMailConfig({
 *   plugins: [i18n({ locales: ['en', 'fr'] })],
 * });
 * ```
 *
 * A template writes `{{ t('verifyEmail.title') }}`; `maizzle build` writes
 * `dist/en/verify-email.html`, `dist/fr/verify-email.html` and
 * `dist/mail-manifest.json`.
 */

import './vue';

export type {
	ArgumentKind,
	Catalogue,
	Catalogues,
} from './catalogues';
export {
	emailKey,
	type Manifest,
	type ManifestEmail,
} from './manifest';
export {
	type I18nOptions,
	i18n,
	MANIFEST_FILE,
	type TemplateSource,
	WRAPPERS_DIR,
} from './plugin';
export {
	createTranslator,
	type LanguageProvider,
	type MessageArgs,
	type Translate,
} from './translator';
export type { Layout } from './wrappers';
