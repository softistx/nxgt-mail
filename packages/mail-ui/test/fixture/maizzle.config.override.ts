import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui, uiCatalogues } from '../../src/index';

// A token overridden, its dark twins too, and the project's own NxBadge in
// override/components.
export default defineMailConfig({
	plugins: [
		ui({
			brand: { name: 'Acme' },
			theme: {
				'color-primary': '#0f766e',
				'color-primary-dark': '#f4f4f5',
				'color-primary-foreground-dark': '#18181b',
			},
		}),
		i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] }),
	],
	root: 'override',
	output: { path: 'dist-override' },
});
