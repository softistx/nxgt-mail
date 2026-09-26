import { defineMailConfig } from '../../../src/index';

export default defineMailConfig({
	locales: ['en', 'fr'],
	fallbackLocale: 'en',
	// The golden module the type tests compile against.
	out: '../../types/generated/mail.ts',
});
