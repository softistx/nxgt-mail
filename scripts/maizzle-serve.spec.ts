import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const copies = ['mail-i18n', 'mail-presets', 'mail-ui'];

test('the maizzle serve helper is the same file in every package that uses it', async () => {
	const [first = '', ...others] = await Promise.all(
		copies.map((name) =>
			Bun.file(`${root}packages/${name}/test/maizzle-serve.ts`).text(),
		),
	);
	for (const other of others) expect(other).toBe(first);
});
