import { fileURLToPath } from 'node:url';
import { defineMailPlugin } from '../../src/index';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** Rewrites `[[mark]]` to `[[alpha]]`, which only beta knows how to finish. */
export const alpha = defineMailPlugin({
	name: 'alpha',
	components: { source: [{ path: here('./alpha'), prefix: 'Alpha' }] },
	vue: { globalProperties: { greeting: 'from alpha', origin: 'alpha' } },
	beforeRender: ({ template }) =>
		template.source.replace('[[mark]]', '[[alpha]]'),
	afterTransform: ({ html }) => `${html}<!-- alpha -->`,
});

/** Finishes what alpha started: in the other order, `[[alpha]]` stays. */
export const beta = defineMailPlugin({
	name: 'beta',
	components: { source: [{ path: here('./beta'), prefix: 'Beta' }] },
	vue: { globalProperties: { greeting: 'from beta' } },
	beforeRender: ({ template }) =>
		template.source.replace('[[alpha]]', 'alpha then beta'),
	afterTransform: ({ html }) => `${html}<!-- beta -->`,
});
