import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui, uiCatalogues } from '../../src/index';

// One token overridden, and the project's own NxBadge in override/components.
export default defineMailConfig({
	plugins: [
		ui({ brand: { name: 'Acme' }, theme: { 'color-primary': '#0f766e' } }),
		i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] }),
	],
	root: 'override',
	output: { path: 'dist-override' },
});
