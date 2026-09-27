import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { presets } from '@nxgt/mail-presets';
import { ui, uiCatalogues } from '@nxgt/mail-ui';

// One ready e-mail from @nxgt/mail-presets, built beside the project's own.
const mails = presets({ only: ['sign-in-code'] });

export default defineMailConfig({
	plugins: [
		ui({ brand: { name: 'Acme', url: 'https://acme.example' } }),
		i18n({
			locales: ['en', 'fr'],
			catalogues: [uiCatalogues, mails.catalogues],
			templates: [mails.templates],
		}),
	],
});
