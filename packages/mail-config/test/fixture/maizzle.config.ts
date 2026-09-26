import { defineMailConfig } from '../../src/index';
import { alpha, beta } from './plugins';

export default defineMailConfig({
	plugins: [alpha, beta],
	vue: { globalProperties: { greeting: 'from the project' } },
	afterTransform: ({ html }) => `${html}<!-- project -->`,
});
