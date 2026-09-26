/**
 * Writes samples/: each preset built in each locale with a neutral brand, the
 * HTML `maizzle build` writes for test/fixture, and a README listing them.
 * `src/build.spec.ts` fails when samples/ differs from a fresh build, so run
 * `bun run samples` after changing a template or a message.
 */

import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PRESETS } from '../src/presets';

const root = fileURLToPath(new URL('..', import.meta.url));
const fixture = `${root}test/fixture`;
const samples = `${root}samples`;
const locales = ['en', 'fr'];

const child = Bun.spawn([`${root}node_modules/.bin/maizzle`, 'build'], {
	cwd: fixture,
	stdout: 'inherit',
	stderr: 'inherit',
});
if ((await child.exited) !== 0) process.exit(1);

rmSync(samples, { recursive: true, force: true });
for (const locale of locales) {
	mkdirSync(`${samples}/${locale}`, { recursive: true });
	for (const file of readdirSync(`${fixture}/dist/${locale}`)) {
		if (file.endsWith('.html')) {
			cpSync(
				`${fixture}/dist/${locale}/${file}`,
				`${samples}/${locale}/${file}`,
			);
		}
	}
}

const rows = PRESETS.map(
	(name) =>
		`| \`${name}\` | ${locales.map((locale) => `[${locale}](${locale}/${name}.html)`).join(' · ')} |`,
);
writeFileSync(
	`${samples}/README.md`,
	[
		'# Samples',
		'',
		'Each preset as `maizzle build` writes it, with the brand `Acme` and the',
		'default theme. The `{{ name }}` marks are placeholders, filled when the',
		'e-mail is sent. Written by `bun run samples`; never edited by hand.',
		'',
		'Open a file in a browser to see it — GitHub shows its source.',
		'',
		'| Preset | Built |',
		'| --- | --- |',
		...rows,
		'',
	].join('\n'),
);
console.log(`samples: ${PRESETS.length} presets × ${locales.length} locales`);
