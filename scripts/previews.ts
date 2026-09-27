#!/usr/bin/env bun

/**
 * Writes the PNG previews the READMEs show: each mail-presets sample in `en`
 * and `fr`, and mail-ui's fixture e-mail, which uses every component.
 *
 * Each built file is filled with example values where its `{{ name }}`
 * placeholders are, as the renderer would at send time, then shot by a
 * headless Chromium at the width a mail client gives an e-mail, and trimmed to
 * the e-mail plus a margin of its background. The fixture's logo points at
 * `acme.example`, which does not exist: it is swapped for an inline wordmark.
 *
 * Screenshots differ from one machine's fonts to another's, so CI never
 * compares them: run `bun run previews` after changing how an e-mail looks,
 * and commit the images. Needs `chromium` (or `CHROMIUM=/path/to/chrome`) and
 * ImageMagick's `magick`.
 */

import {
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const chromium = process.env.CHROMIUM ?? 'chromium';
const width = 680;

/** What the placeholders hold in the previews, per locale. */
const EXAMPLES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	en: {
		name: 'Ada',
		link: 'https://acme.example/verify?token=5f2c9e',
		code: '482 913',
		device: 'Firefox on macOS',
		location: 'Lyon, France',
		time: 'September 26, 2026, 9:14 PM',
		inviter: 'Grace Hopper',
		organization: 'Acme Labs',
		newEmail: 'ada@new.example',
	},
	fr: {
		name: 'Ada',
		link: 'https://acme.example/verify?token=5f2c9e',
		code: '482 913',
		device: 'Firefox sur macOS',
		location: 'Lyon, France',
		time: '26 septembre 2026 à 21:14',
		inviter: 'Grace Hopper',
		organization: 'Acme Labs',
		newEmail: 'ada@new.example',
	},
};

const LOGO = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="28"><text x="0" y="22" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#0f766e">Acme</text></svg>',
)}`;

const escapeHtml = (value: string): string =>
	value.replace(
		/[&<>"']/g,
		(char) =>
			({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
				char
			] ?? char,
	);

function run(command: readonly string[], cwd = root): string {
	const result = Bun.spawnSync([...command], { cwd, stderr: 'pipe' });
	if (result.exitCode !== 0) {
		throw new Error(
			`${command[0]} exited with ${result.exitCode}: ${result.stderr.toString().trim()}`,
		);
	}
	return result.stdout.toString();
}

const scratch = mkdtempSync(join(tmpdir(), 'nxgt-previews-'));

function shoot(html: string, locale: string, out: string): void {
	const values = EXAMPLES[locale] ?? EXAMPLES.en ?? {};
	const filled = html
		.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9]*)\s*\}\}/g, (mark, name: string) => {
			const value = values[name];
			return value === undefined ? mark : escapeHtml(value);
		})
		.replaceAll('https://acme.example/logo.png', LOGO);
	const page = join(scratch, 'page.html');
	const shot = join(scratch, 'shot.png');
	writeFileSync(page, filled);
	run([
		chromium,
		'--headless',
		'--disable-gpu',
		'--hide-scrollbars',
		'--force-device-scale-factor=1',
		`--window-size=${width},4000`,
		`--screenshot=${shot}`,
		`file://${page}`,
	]);
	const background = run([
		'magick',
		shot,
		'-format',
		'%[pixel:p{0,0}]',
		'info:',
	]).trim();
	mkdirSync(join(out, '..'), { recursive: true });
	run([
		'magick',
		shot,
		'-trim',
		'+repage',
		'-bordercolor',
		background,
		'-border',
		'24x24',
		'-strip',
		out,
	]);
	console.log(`previews: ${out.slice(root.length)}`);
}

try {
	const presets = `${root}packages/mail-presets`;
	for (const locale of ['en', 'fr']) {
		for (const file of readdirSync(`${presets}/samples/${locale}`)) {
			if (!file.endsWith('.html')) continue;
			shoot(
				readFileSync(`${presets}/samples/${locale}/${file}`, 'utf8'),
				locale,
				`${presets}/previews/${locale}/${file.replace(/\.html$/, '.png')}`,
			);
		}
	}

	const ui = `${root}packages/mail-ui`;
	run([`${ui}/node_modules/.bin/maizzle`, 'build'], `${ui}/test/fixture`);
	for (const locale of ['en', 'fr']) {
		shoot(
			readFileSync(`${ui}/test/fixture/dist/${locale}/welcome.html`, 'utf8'),
			locale,
			`${ui}/previews/components-${locale}.png`,
		);
	}
} finally {
	rmSync(scratch, { recursive: true, force: true });
}
