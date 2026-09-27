import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '../../src/index';

// Every template in its own worker: each loads this file again.
export default defineMailConfig({
	plugins: [i18n({ locales: ['en', 'fr'], rendererTypes: false })],
	output: { path: 'dist-parallel' },
	parallel: { workers: 2, threshold: 0 },
});
