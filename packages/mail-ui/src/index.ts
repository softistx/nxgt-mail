/**
 * `@nxgt/mail-ui` — e-mail components in the style of `@nxgt/material-vue`,
 * for a Maizzle project.
 *
 * ```ts
 * // maizzle.config.ts
 * import { defineMailConfig } from '@nxgt/mail-config';
 * import { i18n } from '@nxgt/mail-i18n';
 * import { ui, uiCatalogues } from '@nxgt/mail-ui';
 *
 * export default defineMailConfig({
 *   plugins: [
 *     ui({ brand: { name: 'Acme', url: 'https://acme.example' } }),
 *     i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] }),
 *   ],
 * });
 * ```
 *
 * A template writes `<NxLayout>`, `<NxButton href="…">`, `<NxCard>`, … with
 * material-vue's variants, colours and sizes, rendered with tables and
 * inlined styles.
 */

import './vue';

export { uiCatalogues } from './catalogues';
export {
	type Brand,
	COMPONENTS_DIR,
	UI_CONTEXT,
	type UiContext,
	type UiOptions,
	ui,
} from './plugin';
export { THEME_FILE } from './theme';
