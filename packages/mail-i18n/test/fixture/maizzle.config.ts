import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '../../src/index';

export default defineMailConfig({
	plugins: [i18n({ locales: ['en', 'fr'] })],
});
