#!/usr/bin/env bun

/**
 * Writes the PNG previews the READMEs show: each mail-presets sample in `en`
 * and `fr`, and mail-ui's fixture e-mails, which use every component.
 *
 * Each built file is filled with example values where its `{{ name }}`
 * placeholders are, as the renderer would at send time, then shot by a
 * headless Chromium at the width a mail client gives an e-mail, and trimmed to
 * the e-mail plus a margin of its background. The fixture's logo and avatar
 * point at `acme.example`, which does not exist: they are swapped for inline
 * pictures, as are the content e-mail's chart and gear.
 *
 * It first builds the packages and rewrites mail-presets' `samples/`, so the
 * pictures are of the current look. A placeholder with no example value, or an
 * e-mail taller than the window, fails the run rather than drawing a wrong
 * picture.
 *
 * Screenshots differ from one machine's fonts to another's, so CI never
 * compares them: run `bun run previews` after changing how an e-mail looks,
 * and commit the images. Needs Chromium (`CHROMIUM=/path/to/chrome`, default
 * `chromium`) and ImageMagick 7 (`MAGICK`, default `magick`); tried on Linux.
 *
 * One extra shot, `components-en-dark.png`, forces Chromium's
 * `prefers-color-scheme` to `dark` (`--blink-settings=preferredColorScheme=0`,
 * this build's `kDark`; Playwright's `colorScheme: 'dark'` sets the same
 * Blink preference through the DevTools protocol instead) to show
 * `@nxgt/mail-ui`'s dark styles — the media-query part of the technique
 * only; a browser has no `[data-ogsc]`/`[data-ogsb]` of its own to shoot.
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
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const chromium = process.env.CHROMIUM ?? 'chromium';
const magick = process.env.MAGICK ?? 'magick';
const width = 680;
const height = 4000;

/** The `link` each e-mail shows, by file name; any other gets `example.link`. */
const LINKS: Readonly<Record<string, string>> = {
	'verify-email': 'https://acme.example/verify?token=5f2c9e',
	'reset-password': 'https://acme.example/reset?token=5f2c9e',
	'password-changed': 'https://acme.example/security',
	'email-changed': 'https://acme.example/security',
	'magic-link': 'https://acme.example/sign-in?token=5f2c9e',
	'new-sign-in': 'https://acme.example/security',
	welcome: 'https://acme.example/start',
	invitation: 'https://acme.example/join?invite=5f2c9e',
};

/** The `expiresIn` of an e-mail whose token lives longer than `EXAMPLES`' hour, per locale. */
const EXPIRES_IN: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	invitation: { en: '7 days', fr: '7 jours' },
};

/** What the placeholders hold in the previews, per locale. */
const EXAMPLES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	en: {
		name: 'Ada',
		link: 'https://acme.example/verify?token=5f2c9e',
		code: '482 913',
		expiresIn: '1 hour',
		device: 'Firefox on macOS',
		location: 'Lyon, France',
		time: 'September 26, 2026, 9:14 PM',
		inviter: 'Grace Hopper',
		organization: 'Acme Labs',
		newEmail: 'ada@new.example',
		badgeSize: '84 KB',
		email: 'support@acme.example',
		mobile: '+33 6 12 34 56 78',
		site: 'https://portal.acme.example',
	},
	fr: {
		name: 'Ada',
		link: 'https://acme.example/verify?token=5f2c9e',
		code: '482 913',
		expiresIn: '1 heure',
		device: 'Firefox sur macOS',
		location: 'Lyon, France',
		time: '26 septembre 2026 à 21:14',
		inviter: 'Grace Hopper',
		organization: 'Acme Labs',
		newEmail: 'ada@new.example',
		badgeSize: '84 Ko',
		email: 'support@acme.example',
		mobile: '+33 6 12 34 56 78',
		site: 'https://portal.acme.example',
	},
};

const LOGO = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="28"><text x="0" y="22" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#0f766e">Acme</text></svg>',
)}`;

const AVATAR = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#0f766e"/><text x="24" y="31" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff">A</text></svg>',
)}`;

const CHART = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="534" height="200"><rect width="534" height="200" fill="#f6f6fa"/>' +
		[40, 90, 70, 130, 110, 60, 150]
			.map(
				(bar, index) =>
					`<rect x="${37 + index * 70}" y="${180 - bar}" width="40" height="${bar}" rx="4" fill="#485096"/>`,
			)
			.join('') +
		'</svg>',
)}`;

const GEAR = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="5" fill="none" stroke="#020918" stroke-width="2"/><circle cx="8" cy="8" r="1.5" fill="#020918"/></svg>',
)}`;

// The renderer's own filling, copied from packages/mail/src/renderer.ts
// (PLACEHOLDER and its escaping): change them together.
const PLACEHOLDER = /\{\{\s*([a-z][a-zA-Z0-9]*)\s*\}\}/g;

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

function shoot(
	html: string,
	locale: string,
	email: string,
	out: string,
	dark = false,
): void {
	const values: Record<string, string | undefined> = {
		...EXAMPLES[locale],
		...(LINKS[email] && { link: LINKS[email] }),
		...(EXPIRES_IN[email]?.[locale] && {
			expiresIn: EXPIRES_IN[email][locale],
		}),
	};
	const missing = new Set<string>();
	const filled = html
		.replace(PLACEHOLDER, (mark, name: string) => {
			const value = values[name];
			if (value === undefined) missing.add(name);
			return value === undefined ? mark : escapeHtml(value);
		})
		.replaceAll('https://acme.example/logo.png', LOGO)
		.replaceAll('https://acme.example/ada.png', AVATAR)
		.replaceAll('https://acme.example/chart.png', CHART)
		.replaceAll('https://acme.example/gear.png', GEAR);
	if (missing.size > 0) {
		throw new Error(
			`previews: ${locale}/${email} has placeholders with no example value: ${[...missing].join(', ')} — add them to EXAMPLES`,
		);
	}
	const page = join(scratch, 'page.html');
	const shot = join(scratch, 'shot.png');
	writeFileSync(page, filled);
	run([
		chromium,
		'--headless',
		'--disable-gpu',
		'--hide-scrollbars',
		'--force-device-scale-factor=1',
		...(dark ? ['--blink-settings=preferredColorScheme=0'] : []),
		`--user-data-dir=${join(scratch, 'profile')}`,
		`--window-size=${width},${height}`,
		`--screenshot=${shot}`,
		pathToFileURL(page).href,
	]);
	const background = run([
		magick,
		shot,
		'-format',
		'%[pixel:p{0,0}]',
		'info:',
	]).trim();
	const bottom = run([
		magick,
		shot,
		'-format',
		`%[pixel:p{0,${height - 1}}]`,
		'info:',
	]).trim();
	if (bottom !== background) {
		throw new Error(
			`previews: ${locale}/${email} is taller than ${height}px — raise the window height`,
		);
	}
	mkdirSync(join(out, '..'), { recursive: true });
	run([
		magick,
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
	run(['bun', 'run', 'build']);
	run(['bun', 'run', 'samples'], `${root}packages/mail-presets`);
	const presets = `${root}packages/mail-presets`;
	for (const locale of ['en', 'fr']) {
		for (const file of readdirSync(`${presets}/samples/${locale}`)) {
			if (!file.endsWith('.html')) continue;
			const email = file.replace(/\.html$/, '');
			shoot(
				readFileSync(`${presets}/samples/${locale}/${file}`, 'utf8'),
				locale,
				email,
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
			'welcome',
			`${ui}/previews/components-${locale}.png`,
		);
	}
	// Dark mode, English only: what `@media (prefers-color-scheme: dark)` shows.
	shoot(
		readFileSync(`${ui}/test/fixture/dist/en/welcome.html`, 'utf8'),
		'en',
		'welcome',
		`${ui}/previews/components-en-dark.png`,
		true,
	);
	// The data, sequence, summary, content and details components' e-mails are in English only.
	shoot(
		readFileSync(`${ui}/test/fixture/dist/en/gallery.html`, 'utf8'),
		'en',
		'gallery',
		`${ui}/previews/data-components.png`,
	);
	shoot(
		readFileSync(`${ui}/test/fixture/dist/en/sequence.html`, 'utf8'),
		'en',
		'sequence',
		`${ui}/previews/sequence-components.png`,
	);
	shoot(
		readFileSync(`${ui}/test/fixture/dist/en/summary.html`, 'utf8'),
		'en',
		'summary',
		`${ui}/previews/summary-components.png`,
	);
	shoot(
		readFileSync(`${ui}/test/fixture/dist/en/content.html`, 'utf8'),
		'en',
		'content',
		`${ui}/previews/content-components.png`,
	);
	shoot(
		readFileSync(`${ui}/test/fixture/dist/en/details.html`, 'utf8'),
		'en',
		'details',
		`${ui}/previews/details-components.png`,
	);
} finally {
	rmSync(scratch, { recursive: true, force: true });
}
