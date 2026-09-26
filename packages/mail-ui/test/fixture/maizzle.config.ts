import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui, uiCatalogues } from '../../src/index';

export default defineMailConfig({
	plugins: [
		ui({
			brand: {
				name: 'Acme',
				url: 'https://acme.example',
				logo: { src: 'https://acme.example/logo.png', width: 96 },
			},
		}),
		i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] }),
	],
	// The caniemail check of maizzle serve, which the build spec reads.
	server: { checks: { clients: ['gmail', 'outlook', 'apple-mail'] } },
});
