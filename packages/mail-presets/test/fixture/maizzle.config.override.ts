import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui, uiCatalogues } from '@nxgt/mail-ui';
import { presets } from '../../src/index';

// Two presets, the project's own welcome.vue in override/, and one message
// of a preset overridden in override-locales/.
const mails = presets({ only: ['welcome', 'sign-in-code'] });

export default defineMailConfig({
	plugins: [
		ui({ brand: { name: 'Acme' } }),
		i18n({
			locales: ['en', 'fr'],
			dir: 'override-locales',
			emails: 'override',
			catalogues: [uiCatalogues, mails.catalogues],
			templates: [mails.templates],
		}),
	],
	output: { path: 'dist-override' },
});
