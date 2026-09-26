import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui, uiCatalogues } from '@nxgt/mail-ui';
import { presets } from '../../src/index';

// Every preset with a neutral brand: what `bun run samples` copies to samples/.
const mails = presets();

export default defineMailConfig({
	plugins: [
		ui({ brand: { name: 'Acme', url: 'https://acme.example' } }),
		i18n({
			locales: ['en', 'fr'],
			catalogues: [uiCatalogues, mails.catalogues],
			templates: [mails.templates],
		}),
	],
	server: { checks: { clients: ['gmail', 'outlook', 'apple-mail'] } },
});
