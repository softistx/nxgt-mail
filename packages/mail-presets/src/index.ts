/**
 * `@nxgt/mail-presets` — ready transactional e-mails for a Maizzle project
 * built with `@nxgt/mail-ui` and `@nxgt/mail-i18n`: verify-email,
 * reset-password, password-changed, email-changed, account-deleted,
 * sign-in-code, magic-link, new-sign-in, two-factor-enabled,
 * two-factor-disabled, recovery-code-used, welcome, invitation and
 * invitation-accepted, in `en` and `fr`.
 *
 * ```ts
 * // maizzle.config.ts
 * import { defineMailConfig } from '@nxgt/mail-config';
 * import { i18n } from '@nxgt/mail-i18n';
 * import { presets } from '@nxgt/mail-presets';
 * import { ui, uiCatalogues } from '@nxgt/mail-ui';
 *
 * const mails = presets();
 *
 * export default defineMailConfig({
 *   plugins: [
 *     ui({ brand: { name: 'Acme', url: 'https://acme.example' } }),
 *     i18n({
 *       locales: ['en', 'fr'],
 *       catalogues: [uiCatalogues, mails.catalogues],
 *       templates: [mails.templates],
 *     }),
 *   ],
 * });
 * ```
 *
 * The built samples are in the package's `samples/` folder, on GitHub.
 */

export {
	PRESETS,
	type PresetName,
	type Presets,
	type PresetsOptions,
	presetCatalogues,
	presets,
	TEMPLATES_DIR,
} from './presets';
