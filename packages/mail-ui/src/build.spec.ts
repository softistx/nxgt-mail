import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type MaizzleServer, serveMaizzle } from '../test/maizzle-serve';
import { instanceOf, propsOf, TABLE, tagOf } from '../test/placeholder-props';

const fixture = fileURLToPath(new URL('../test/fixture', import.meta.url));
const cases = fileURLToPath(new URL('../test/.cases', import.meta.url));
const components = fileURLToPath(new URL('../components', import.meta.url));
const maizzle = fileURLToPath(
	new URL('../node_modules/.bin/maizzle', import.meta.url),
);

/** Runs `maizzle <args>` in `cwd`, as a project runs it. */
async function run(cwd: string, ...args: string[]) {
	return runIn(process.env, cwd, ...args);
}

/** Runs `maizzle <args>` in `cwd` with the environment `env`. */
async function runIn(
	env: Record<string, string | undefined>,
	cwd: string,
	...args: string[]
) {
	const child = Bun.spawn([maizzle, ...args], {
		cwd,
		env,
		stdout: 'pipe',
		stderr: 'pipe',
	});
	const [code, stdout, stderr] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	return { code, output: stdout + stderr };
}

async function build(cwd: string, ...args: string[]): Promise<void> {
	const { code, output } = await run(cwd, 'build', ...args);
	if (code !== 0) throw new Error(`maizzle build failed:\n${output}`);
}

const read = (path: string) => Bun.file(`${fixture}/${path}`).text();

/** The inline `style` of the `tag` around the first `text`: a button's `<a>`. */
function styleOf(html: string, text: string, tag = ''): string {
	const at = html.indexOf(`>${text}<`);
	const open = html.lastIndexOf(`<${tag}`, at);
	return /style="([^"]*)"/.exec(html.slice(open, at))?.[1] ?? '';
}

/** WCAG relative luminance of a `#rrggbb` colour. */
function relativeLuminance(hex: string): number {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	const linear = (channel: number) => {
		const c = channel / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** The WCAG contrast ratio between two `#rrggbb` colours, from 1 to 21. */
function contrastRatio(a: string, b: string): number {
	const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
	const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
	return (lighter + 0.05) / (darker + 0.05);
}

describe('a project built with the ui plugin', () => {
	beforeAll(async () => {
		for (const dir of ['dist', 'dist-override', '.maizzle']) {
			rmSync(`${fixture}/${dir}`, { recursive: true, force: true });
		}
		await build(fixture);
		await build(fixture, '-c', 'maizzle.config.override.ts');
	}, 120_000);

	test("renders material-vue's colours as hex, with nothing a client must resolve", async () => {
		for (const email of [
			'welcome',
			'gallery',
			'sequence',
			'summary',
			'content',
			'details',
		]) {
			const html = await read(`dist/en/${email}.html`);
			expect({ email, oklch: html.includes('oklch(') }).toEqual({
				email,
				oklch: false,
			});
			expect({ email, var: html.includes('var(--') }).toEqual({
				email,
				var: false,
			});
			expect({ email, mix: html.includes('color-mix(') }).toEqual({
				email,
				mix: false,
			});
		}
		expect(
			styleOf(await read('dist/en/welcome.html'), 'Open my account', 'a '),
		).toContain('background-color: #485096;');
	});

	test('writes the types of brand for the editor, in .maizzle/ where the starter looks', async () => {
		expect(await read('.maizzle/nxgt-mail-ui.d.ts')).toContain(
			"import type {} from '@nxgt/mail-ui';",
		);
	});

	test('mixes a tint over the background, where a client would drop an alpha', async () => {
		const html = await read('dist/en/welcome.html');
		// material-vue's bg-primary/15, and border-error/50.
		expect(styleOf(html, 'Tonal', 'a ')).toContain(
			'background-color: #e4e5ef;',
		);
		expect(styleOf(html, 'Outlined', 'a ')).toContain(
			'border: 1px solid #f27f8a;',
		);
	});

	test("pads a button with Maizzle's Outlook fallbacks, by its size", async () => {
		const html = await read('dist/en/welcome.html');
		expect(html).toContain(
			'<!--[if mso]><i style="mso-font-width: 114%; mso-text-raise: 19px;" hidden>',
		);
		expect(html).toContain('<span style="mso-text-raise: 8px;">Tonal</span>');
	});

	test("shows the brand's logo, linked, and its name in the footer", async () => {
		const html = await read('dist/en/welcome.html');
		expect(html).toContain(
			'<a href="https://acme.example" class="nx-dark-text-foreground" style="font-size: 18px;',
		);
		expect(html).toContain(
			'<img src="https://acme.example/logo.png" width="96" alt="Acme"',
		);
		expect(html).toContain('underline;">Acme</a>');
	});

	test("writes the ui's messages in each locale, under the project's", async () => {
		const en = await read('dist/en/welcome.html');
		const fr = await read('dist/fr/welcome.html');
		// common.greeting is the project's in en, the ui's in fr.
		expect(en).toContain('>Hi {{ name }},</p>');
		expect(fr).toContain('>Bonjour {{ name }},</p>');
		expect(en).toContain(
			'You received this e-mail because you have an account with Acme.',
		);
		expect(fr).toContain(
			'Vous recevez cet e-mail parce que vous avez un compte chez Acme.',
		);
		expect(fr).toContain('<html lang="fr"');
	});

	test('leaves out a summary row without a value, but not 0', async () => {
		const html = await read('dist/en/welcome.html');
		expect(html).toContain('>Trial</td>');
		expect(html).not.toContain('>Coupon</td>');
		expect(styleOf(html, 'Seats')).toContain('border-bottom: 1px solid;');
	});

	test('an overridden token wins, and its tints follow it', async () => {
		const html = await read('dist-override/en/welcome.html');
		expect(html).not.toContain('#485096');
		expect(styleOf(html, 'Open my account', 'a ')).toContain(
			'background-color: #0f766e;',
		);
		expect(styleOf(html, 'Tonal', 'a ')).toContain(
			'background-color: #dbeae9;',
		);
	});

	test('primary keeps its light value in the dark rules, unless a project sets a dark one', async () => {
		const html = await read('dist/en/welcome.html');
		expect(html).toContain(
			'.nx-dark-bg-primary {\n  background-color: #485096 !important;\n  background-color: lab(36.0601% 12.8744 -40.3318) !important;\n}',
		);
		expect(html).toContain(
			'.nx-dark-text-primary-foreground {\n  color: #f8fafc !important;\n  color: lab(98.1434% -.369519 -1.05966) !important;\n}',
		);
	});

	test('shows a project-set dark primary in the dark rules, not the light one', async () => {
		const html = await read('dist-override/en/welcome.html');
		expect(html).toContain(
			'.nx-dark-bg-primary {\n  background-color: #f4f4f5 !important;\n}',
		);
		expect(html).toContain(
			'.nx-dark-text-primary-foreground {\n  color: #18181b !important;\n}',
		);
		// The light value, from `color-primary`, is unaffected by the dark one.
		expect(styleOf(html, 'Open my account', 'a ')).toContain(
			'background-color: #0f766e;',
		);
	});

	test('keeps the default dark tints and paper unchanged with no dark primary', async () => {
		const html = await read('dist/en/welcome.html');
		expect(html).toContain(
			'.nx-dark-bg-paper {\n  background-color: #060c1e !important;\n}',
		);
		expect(html).toContain(
			'.nx-dark-bg-primary-15 {\n  background-color: #e4e5ef !important;\n}',
		);
		expect(html).toContain(
			'.nx-dark-bg-primary-20 {\n  background-color: #dadcea !important;\n}',
		);
		expect(html).toContain(
			'.nx-dark-border-primary-40 {\n  border-color: #b6b9d5 !important;\n}',
		);
		expect(html).toContain(
			'.nx-dark-border-primary-50 {\n  border-color: #a4a7cb !important;\n}',
		);
	});

	test('derives a dark tint from a project-set dark primary, at readable contrast', async () => {
		const html = await read('dist-override/en/welcome.html');
		// `color-primary-dark: #f4f4f5` mixed at the light tints' own
		// percentages over `color-background-dark`, not aliased to the light
		// tint (`#dbeae9`, mixed from `color-primary` over the *light*
		// background) any more.
		expect(html).toContain(
			'.nx-dark-bg-primary-15 {\n  background-color: #272c39 !important;\n}',
		);
		expect(html).toContain(
			'.nx-dark-bg-primary-20 {\n  background-color: #333844 !important;\n}',
		);
		expect(html).toContain(
			'.nx-dark-border-primary-40 {\n  border-color: #636770 !important;\n}',
		);
		expect(html).toContain(
			'.nx-dark-border-primary-50 {\n  border-color: #7b7e86 !important;\n}',
		);
		// A tonal chip: `color-primary-dark` (#f4f4f5) as text, on
		// `color-primary-15-dark`. A WCAG AA body-text minimum, 4.5:1.
		expect(contrastRatio('#f4f4f5', '#272c39')).toBeGreaterThanOrEqual(4.5);
		// An outlined chip's border, against the dark card. WCAG's
		// non-text minimum, 3:1.
		expect(contrastRatio('#636770', '#0f172b')).toBeGreaterThanOrEqual(3);
		expect(contrastRatio('#7b7e86', '#0f172b')).toBeGreaterThanOrEqual(3);
	});

	test('keeps paper mixing the light primary, not the dark one, so it never moves the page ground', async () => {
		const html = await read('dist-override/en/welcome.html');
		// `color-primary-dark: #f4f4f5` (near white) would otherwise wash
		// `paper-dark` towards white; it stays `color-primary` (#0f766e)
		// mixed 5% over `color-background-dark`, same contrast against the
		// card as the default build's paper (~1.09:1), not the ~1.02:1 a
		// near-white primary-dark would give it.
		expect(html).toContain(
			'.nx-dark-bg-paper {\n  background-color: #030e1c !important;\n}',
		);
		expect(contrastRatio('#030e1c', '#0f172b')).toBeCloseTo(
			contrastRatio('#060c1e', '#0f172b'),
			1,
		);
	});

	test('derives a dark muted pair from a project-set colour, at readable contrast', async () => {
		const defaultHtml = await read('dist/en/welcome.html');
		// No override: `bg-muted`/`text-muted-foreground` alias their light
		// value in dark mode too, unchanged.
		expect(defaultHtml).toContain(
			'.nx-dark-bg-muted {\n  background-color: #f1f5f9 !important;\n  background-color: lab(96.286% -.852436 -2.46847) !important;\n}',
		);
		expect(defaultHtml).toContain(
			'.nx-dark-text-muted-foreground {\n  color: #62748e !important;\n  color: lab(48.0876% -2.03595 -16.5814) !important;\n}',
		);

		const html = await read('dist-override/en/welcome.html');
		// `color-muted-dark: #1e293b`, `color-muted-foreground-dark: #e2e8f0`:
		// shown as set, not the light pair, exactly like `color-primary-dark`.
		expect(html).toContain(
			'.nx-dark-bg-muted {\n  background-color: #1e293b !important;\n}',
		);
		expect(html).toContain(
			'.nx-dark-text-muted-foreground {\n  color: #e2e8f0 !important;\n}',
		);
		// WCAG AA body-text minimum, 4.5:1.
		expect(contrastRatio('#e2e8f0', '#1e293b')).toBeGreaterThanOrEqual(4.5);
		// A visible step above the dark card, not just the border.
		expect(contrastRatio('#1e293b', '#0f172b')).toBeGreaterThan(1);
	});

	test('shows the name, unlinked, for a brand without a URL or logo', async () => {
		const html = await read('dist-override/en/welcome.html');
		expect(html).toMatch(
			/<span class="nx-dark-text-foreground" style="[^"]*">Acme<\/span>/,
		);
		expect(html).not.toContain('<a href="https://acme.example"');
	});

	test('holds the card at its width in Outlook, which ignores max-width', async () => {
		expect(await read('dist/en/welcome.html')).toContain(
			'<!--[if mso]><table role="none" cellpadding="0" cellspacing="0" style="width: 600px" align="center">',
		);
	});

	test("a project's own NxBadge replaces the ui's", async () => {
		expect(await read('dist-override/en/welcome.html')).toContain(
			'<span data-badge="project"',
		);
		expect(await read('dist/en/welcome.html')).not.toContain('data-badge');
	});

	test('rules a table with borders a client keeps, its footer on a muted ground', async () => {
		const html = await read('dist/en/gallery.html');
		// A data table, which a screen reader reads as one, not a layout's role="none".
		expect(html).toContain(
			'<table class="nx-dark-text-foreground" role="table"',
		);
		expect(styleOf(html, 'Pro plan', 'td')).toContain(
			'border-bottom-width: 1px; border-bottom-style: solid; border-color: #e2e8f0;',
		);
		// A head in the footer takes the footer's line and ground too.
		expect(styleOf(html, 'Total', 'th')).toContain('border-top-width: 1px;');
		expect(styleOf(html, 'Total', 'th')).not.toContain('border-bottom');
		expect(styleOf(html, 'Total', 'th')).toContain(
			'background-color: #f1f5f9;',
		);
		expect(styleOf(html, '$30.00', 'td')).toContain('border-top-style: solid;');
		expect(html).toContain(
			'<caption align="bottom" class="nx-dark-text-muted-foreground" style="caption-side: bottom;',
		);
		expect(html).toContain(
			'<td colspan="2" class="nx-dark-text-foreground" style="padding: 40px 16px;',
		);
	});

	test('leaves out a description without a value, but not 0', async () => {
		const html = await read('dist/en/gallery.html');
		expect(html).toContain('>Credits left</p>');
		expect(html).not.toContain('>Coupon</p>');
	});

	test('rings a selected list tile with a border, and links its title', async () => {
		const html = await read('dist/en/gallery.html');
		expect(html).toContain(
			'border-radius: 4px; border: 1px solid #b6b9d5; background-color: #e4e5ef;',
		);
		expect(html).toContain('<a href="https://acme.example/team/ada"');
		// A disabled tile's title is text, muted.
		expect(styleOf(html, 'Grace Hopper', 'span')).toContain('color: #62748e;');
		// And not a link, though it has an href.
		expect(html).not.toContain('https://acme.example/team/grace');
	});

	test('colours a chip by its variant, and an active one as filled', async () => {
		const html = await read('dist/en/gallery.html');
		expect(styleOf(html, ' Outlined ', 'span')).toContain(
			'border: 1px solid #a4a7cb;',
		);
		expect(styleOf(html, ' Active ', 'span')).toContain(
			'background-color: #d9efed;',
		);
		const active = html.slice(html.indexOf(' Outlined '));
		expect(styleOf(active, ' Active ', 'span')).toContain(
			'background-color: #485096;',
		);
	});

	test('sizes the avatars of a group, and counts the ones past max', async () => {
		const html = await read('dist/en/gallery.html');
		expect(html).toContain(
			'<img src="https://acme.example/ada.png" alt="Ada" width="40" height="40"',
		);
		expect(html).toContain('title="2 more" role="img" aria-label="2 more"');
		expect(await read('dist/fr/gallery.html')).toContain(
			'aria-label="2 autres"',
		);
		expect(styleOf(html, '+2', 'span')).toContain('line-height: 40px;');
		expect(html).not.toContain('>AT<');
		// An avatar out of a group takes its own size.
		expect(html).toContain('alt="Ada" width="48" height="48"');
	});

	test('lays out a group from a v-for, all of it with a max under 1', async () => {
		const html = await read('dist/en/gallery.html');
		for (const initials of ['AB', 'CD', 'EF']) {
			expect(styleOf(html, initials, 'span')).toContain('line-height: 24px;');
		}
	});

	test('sizes an avatar in a chip to 20px, and pulls nothing with a negative margin', async () => {
		const html = await read('dist/en/gallery.html');
		// The chip's GH comes first; the group's is 40px.
		expect(styleOf(html, 'GH', 'span')).toContain(
			'width: 20px; height: 20px; line-height: 20px;',
		);
		expect(html).not.toMatch(/margin[a-z-]*: -/);
	});

	test('fills a progress bar to its share, on a track at 20% of the primary', async () => {
		const html = await read('dist/en/sequence.html');
		/** The cells of the bar whose aria-valuenow is `now` (and max, if given). */
		const bar = (now: string, max = '100') => {
			const at = html.indexOf(
				`aria-valuenow="${now}" aria-valuemin="0" aria-valuemax="${max}"`,
			);
			expect(at).toBeGreaterThan(-1);
			const table = html.slice(
				html.lastIndexOf('<table', at),
				html.indexOf('</table>', at),
			);
			return { table, cells: table.match(/<td[^>]*>/g) ?? [] };
		};
		const twoThirds = bar('2', '3');
		expect(twoThirds.table).toContain('background-color: #dadcea;');
		expect(twoThirds.cells).toHaveLength(2);
		expect(twoThirds.cells[0]).toContain('width: 67%;');
		expect(twoThirds.cells[0]).toContain('background-color: #485096;');
		expect(twoThirds.cells[0]).toContain(
			'height: 8px; line-height: 8px; font-size: 8px; mso-line-height-rule: exactly;',
		);
		// Empty, full, and kept between 0 and 100: the track's cell or the fill's alone.
		for (const [now, max, fill] of [
			['0', '100', false],
			['-5', '100', false],
			['5', '0', false],
			['100', '100', true],
			['150', '100', true],
		] as const) {
			const { cells } = bar(now, max);
			expect({ now, max, cells: cells.length }).toEqual({ now, max, cells: 1 });
			expect(cells[0]?.includes('width: 100%;')).toBe(fill);
		}
		expect(bar('30').cells[0]).toContain('height: 4px;');
		// Nothing of a bar is in the plain-text version.
		expect(await read('dist/en/sequence.txt')).toStartWith(
			'Your setup, step by step\n\nhttps://acme.example\n\nSetup\n\n1\n\nCreate your account\n\nDone',
		);
	});

	test('numbers the steps in order unless one says its index, and joins all but the last', async () => {
		const html = await read('dist/en/sequence.html');
		for (const index of ['1', '2', '7']) {
			expect(styleOf(html, index, 'span')).toContain(
				'border: 1px solid #d1d3e5;',
			);
		}
		// The index slot, a star, in place of the fourth number.
		expect(html).toMatch(/>(&#9733;|★)<\/span>/);
		expect(html).not.toContain('>4</span>');
		const steps = html.slice(
			html.indexOf('>1</span>'),
			html.indexOf('>Signed in<'),
		);
		expect(steps.match(/border-right-width: 1px/g)).toHaveLength(3);
		// Space under every step's text but the last's.
		expect(steps.match(/padding-bottom: 32px/g)).toHaveLength(3);
	});

	test('tones a timeline marker, writes its time as given, and joins all but the last', async () => {
		const html = await read('dist/en/sequence.html');
		expect(html).toContain('>{{ time }}</td>');
		expect(html).toContain(
			'border: 1px solid #99d5d0; background-color: #d9efed;',
		);
		const events = html.slice(html.indexOf('>Signed in<'));
		expect(events.match(/border-right-width: 1px/g)).toHaveLength(2);
		expect(html).toContain('>Nothing this week</p>');
	});

	test("writes a timeline's default empty text, in each locale", async () => {
		expect(await read('dist/en/sequence.html')).toContain(
			'>No activity yet</p>',
		);
		expect(await read('dist/fr/sequence.html')).toContain(
			'>Aucune activité pour le moment</p>',
		);
	});

	test('arrows a delta by its tone, coloured, and leaves the arrow out of the text', async () => {
		const html = await read('dist/en/summary.html');
		const arrow = (glyph: string, label: string) =>
			`<span aria-hidden="true">${glyph}</span> ${label}<`;
		expect(html).toContain(arrow('▲', '+12'));
		// A fall the card says is good: up, whatever its sign.
		expect(html).toContain(arrow('▲', '-2'));
		expect(html).toContain(arrow('–', 'flat'));
		expect(html).toContain(arrow('▲', '+42'));
		expect(html).toMatch(
			/color: #009588;[^>]*>\s*<span aria-hidden="true">▲<\/span> \+12</,
		);
		expect(html).toMatch(
			/color: #62748e;[^>]*>\s*<span aria-hidden="true">–<\/span> flat</,
		);
		const text = await read('dist/en/summary.txt');
		expect(text).toContain(
			'Revenue\n\n$12,400\n\n+12 vs last month\n\nRefunds\n\n3\n\n-2',
		);
		expect(text).not.toMatch(/[▲▼↗↖]/);
	});

	test('heads an e-mail with a hero, and an entity with its status and metadata', async () => {
		const html = await read('dist/en/summary.html');
		expect(html).toContain('text-transform: uppercase;">September</p>');
		expect(html).toContain('>Your month at Acme</h1>');
		expect(html).toContain('background-color: #f6f6fa;');
		expect(await read('dist/en/summary.txt')).toContain(
			'🏢\n\nAcme Labs Active\n\nPlan: Pro Seats: 12\n\nSettings',
		);
	});

	test("writes a metric card's shared words in each locale", async () => {
		const en = await read('dist/en/summary.html');
		const fr = await read('dist/fr/summary.html');
		for (const words of ['>of 24<', '>This period<', '>Last period<']) {
			expect(en).toContain(words);
		}
		for (const words of [
			'>sur 24<',
			'>Cette période<',
			'>Période précédente<',
		]) {
			expect(fr).toContain(words);
		}
	});

	test('fills a goal, a ratio and a breakdown with a bar, a breakdown rounding its share', async () => {
		const html = await read('dist/en/summary.html');
		expect(html).toContain(
			'aria-valuenow="18" aria-valuemin="0" aria-valuemax="24"',
		);
		expect(html).toContain(
			'aria-valuenow="72" aria-valuemin="0" aria-valuemax="100"',
		);
		for (const share of ['54%', '16%']) {
			expect(html).toContain(`>${share}</td>`);
			expect(html).toContain(`style="width: ${share}; height: 6px;`);
		}
		// A value, when given, in place of the share.
		expect(html).toContain('>1,204</td>');
		expect(html).not.toContain('>30%</td>');
	});

	test('heads a see-also with the shared words, and writes nothing for one with no links', async () => {
		const en = await read('dist/en/summary.html');
		expect(en).toContain('uppercase;">See also</p>');
		expect(en.match(/>See also</g)).toHaveLength(1);
		expect(en).toContain('<a href="https://acme.example/team"');
		expect(await read('dist/fr/summary.html')).toContain(
			'uppercase;">Voir aussi</p>',
		);
	});

	test("spaces by the theme's steps, on Maizzle's Spacer", async () => {
		const html = await read('dist/en/content.html');
		expect(html).toContain('<div role="separator" style="line-height: 32px;">');
		expect(html).toContain('<div role="separator" style="line-height: 24px;">');
	});

	test('underlines an extended label with a bar, left out of the plain text, and its trailing slot on the right', async () => {
		const html = await read('dist/en/content.html');
		expect(html).toMatch(
			/<h3 class="nx-dark-text-foreground" style="margin: 0; font-size: 18px;[^>]*font-weight: 600;[^>]*>\s*Your inbox\s*<\/h3>/,
		);
		expect(html).toContain(
			'<td height="4" style="height: 4px; line-height: 4px; font-size: 4px; mso-line-height-rule: exactly; width: 56px; border-radius: 4px; background-color: #485096;',
		);
		expect(styleOf(html, 'Unread', 'td')).toContain(
			'text-align: right; vertical-align: bottom;',
		);
	});

	test('counts in a badge after its content, 99+ past max, nothing at 0, named in each locale', async () => {
		const html = await read('dist/en/content.html');
		expect(html).toContain(
			'>Unread</a><span role="img" title="3 notifications" aria-label="3 notifications"',
		);
		expect(styleOf(html, '3', 'span')).toContain('background-color: #e40014;');
		expect(styleOf(html, '99+', 'span')).toContain(
			'background-color: #54a2ff;',
		);
		expect(html).toContain('<span>none </span>');
		expect(await read('dist/fr/content.html')).toContain(
			'aria-label="120 notifications"',
		);
		const text = await read('dist/en/content.txt');
		expect(text).toContain('https://acme.example/inbox\n\n(3)\n');
		expect(text).toContain('Mentions in threads (99+) and none');
	});

	test('marks each match of a query, whatever its case, and never inside a placeholder', async () => {
		const html = await read('dist/en/content.html');
		const mark = (text: string) =>
			`<mark style="border-radius: 4px; background-color: #dadcea; color: inherit;">${text}</mark>`;
		expect(html).toContain(
			`<span>${mark('Acme')} invoices for {{ name }}, and ${mark('acme')} receipts</span>`,
		);
		expect(await read('dist/en/content.txt')).toContain(
			'Results for Acme invoices for {{ name }}, and acme receipts',
		);
	});

	test('writes a key in monospace on the muted background', async () => {
		const html = await read('dist/en/content.html');
		for (const key of ['Ctrl', 'K']) {
			expect(styleOf(html, key, 'kbd')).toContain('background-color: #f1f5f9;');
			expect(styleOf(html, key, 'kbd')).toContain('font-family: ui-monospace,');
		}
		expect(await read('dist/en/content.txt')).toContain(
			'Press Ctrl + K to search.',
		);
	});

	test('rings an active action card, ticks its indicator, links its title, and leaves the indicator out of the text', async () => {
		const html = await read('dist/en/content.html');
		expect(html).toContain(
			'<td class="nx-dark-border-border nx-dark-bg-card nx-dark-text-card-foreground" style="border-radius: 8px; border: 1px solid #a4a7cb;',
		);
		expect(html).toContain(
			'<a href="https://acme.example/digest" class="nx-dark-text-card-foreground" style="color: #020618;',
		);
		expect(styleOf(html, '✓', 'span')).toContain('background-color: #485096;');
		// Two indicators: the active card's, and the md card's; none for with-indicator false.
		expect(
			html.match(/border-radius: 9999px; border-color: #(485096|62748e);/g),
		).toHaveLength(2);
		// The md card's icon above its title.
		expect(html.indexOf('📱')).toBeLessThan(html.indexOf('>Mobile</h3>'));
		const text = await read('dist/en/content.txt');
		expect(text).toContain(
			'Weekly digest\n\nhttps://acme.example/digest\n\nOne e-mail each Monday.',
		);
		expect(text).not.toContain('✓');
	});

	test("frames a figure's image at the card's width, its caption under it", async () => {
		const html = await read('dist/en/content.html');
		expect(html).toMatch(
			/<img src="https:\/\/acme\.example\/chart\.png" alt="Messages per day" class="nx-dark-border-border" style="display: block;[^"]*border-radius: 14px;[^"]*" height="auto" width="534">/,
		);
		expect(styleOf(html, 'Your messages this week', 'td')).toContain(
			'text-align: center;',
		);
		expect(await read('dist/en/content.txt')).toContain(
			'Your messages this week',
		);
	});

	test('sets a group of buttons on one row, rounded and tonal, the active one filled', async () => {
		const html = await read('dist/en/content.html');
		const group = html.slice(
			html.indexOf('>Inbox<') - 2000,
			html.indexOf('gear.png'),
		);
		const row = group.slice(group.lastIndexOf('<tr>'));
		expect(
			row.match(/<td style="padding-right: 4px; vertical-align: middle;">/g),
		).toHaveLength(3);
		expect(styleOf(html, 'Inbox', 'a ')).toContain(
			'border-radius: 4px; background-color: #485096;',
		);
		expect(styleOf(html, 'Archive', 'a ')).toContain(
			'border-radius: 4px; background-color: #e4e5ef;',
		);
		// A button that says its variant keeps it.
		expect(html).toContain(
			'<a aria-label="Settings" style="display: inline-block; border-radius: 4px; border: 1px solid #81848b;',
		);
	});

	test('draws an icon button round, its icon an image or a character, named for a reader and in the text', async () => {
		const html = await read('dist/en/content.html');
		expect(html).toContain(
			'<img src="https://acme.example/gear.png" width="16" height="16" alt="Settings" style="display: block;">',
		);
		expect(html).toContain(
			'<a title="Help" aria-label="Help" style="display: inline-block; border-radius: 9999px; background-color: #e4e5ef; padding: 10px;',
		);
		expect(styleOf(html, '★', 'span')).toContain('width: 16px;');
		const text = await read('dist/en/content.txt');
		for (const name of ['Starred', 'Settings', 'Help']) {
			expect(text).toContain(`${name}\n\nhttps://acme.example/`);
		}
		expect(text).not.toContain('★');
	});

	test('opens a link button at `to`, drawn as a link unless its variant says otherwise', async () => {
		const html = await read('dist/en/content.html');
		expect(styleOf(html, 'Manage your preferences', 'a ')).not.toContain(
			'padding',
		);
		expect(html).toContain(
			'href="https://acme.example/preferences" class="nx-dark-text-primary">Manage your preferences</a>',
		);
		expect(styleOf(html, 'Unsubscribe', 'span')).toBe('mso-text-raise: 8px;');
		expect(html).toMatch(
			/border: 1px solid #f27f8a;[^>]*href="https:\/\/acme\.example\/unsubscribe"/,
		);
	});

	test('tints an event chip by its colour, a hex one mixed at 18%, and hides the time of an all-day one', async () => {
		const html = await read('dist/en/details.html');
		const chip = (title: string) =>
			html.slice(
				html.lastIndexOf('<table', html.indexOf(`>${title}<`)),
				html.indexOf(`>${title}<`),
			);
		// The theme's primary, its bar and its 20% ground.
		expect(chip('Onboarding call')).toContain('background-color: #485096;');
		expect(chip('Onboarding call')).toContain('background-color: #dadcea;');
		expect(chip('Onboarding call')).toContain('>{{ time }}</p>');
		// #0f766e at 18% over white, square on the right where it continues.
		expect(chip('Team offsite')).toContain('background-color: #0f766e;');
		expect(chip('Team offsite')).toContain('background-color: #d4e6e5;');
		expect(chip('Team offsite')).not.toContain('border-top-right-radius');
		expect(html).not.toContain('>All day<');
		// Selected: a border where material-vue draws a ring.
		// #0f7 as #00ff77, at 18%; a compact title muted, as material-vue's caption.
		expect(chip('Standup')).toContain('background-color: #d1ffe7;');
		expect(chip('Standup')).toMatch(
			/font-size: 10px;[^>]*color: #62748e;[^>]*$/,
		);
		expect(chip('Review')).toContain(
			'border-color: #485096; border-style: solid; border-width: 1px;',
		);
		expect(await read('dist/en/details.txt')).toStartWith(
			'Your booking at Acme Labs\n\nhttps://acme.example\n\nYour booking\n\n{{ time }}\n\nOnboarding call\n\nTeam offsite\n\n14:00\n\nReview',
		);
	});

	test('lists attributes by their values, a default and a unit, and leaves out one without a value', async () => {
		const html = await read('dist/en/details.html');
		expect(html).toMatch(/>\s*Attributes\s*<\/h3>/);
		expect(html.match(/>Attributes</g)).toHaveLength(1);
		expect(html).not.toContain('>Parking<');
		expect(html).not.toContain('>Note<');
		expect(await read('dist/fr/details.html')).toMatch(
			/>\s*Attributs\s*<\/h3>/,
		);
		expect(await read('dist/en/details.txt')).toContain(
			'Attributes\n\nRoom\n\nLovelace\n\nSeats\n\n0\n\nArea\n\n42 m²\n\nEquipment\n\nScreen, Whiteboard\n\nFloor\n\nGround\n\n',
		);
	});

	test('writes a postal address as material-vue, the country named in each locale', async () => {
		const en = await read('dist/en/details.txt');
		expect(en).toContain(
			'Address\n\n12 rue de la Paix\n\n75002 Paris · France\n\n',
		);
		expect(en).toContain('Warehouse\n\nPotsdam\n\nBrandenburg · Germany\n\n');
		// A region alone is the title, written once.
		expect(en).toContain('Depot\n\nBrandenburg\n\nOpening hours');
		expect(await read('dist/fr/details.txt')).toContain(
			'Adresse\n\n12 rue de la Paix\n\n75002 Paris · France\n\nWarehouse\n\nPotsdam\n\nBrandenburg · Allemagne\n\n',
		);
		// Heads it with a bar, left out of the plain text.
		expect(await read('dist/en/details.html')).toMatch(
			/<h3 class="nx-dark-text-foreground" style="margin: 0; font-size: 18px;[^>]*>\s*Address\s*<\/h3>/,
		);
	});

	test('orders opening hours by day, in each locale, with a closed day and a missing time', async () => {
		expect(await read('dist/en/details.txt')).toContain(
			'Opening hours\n\nMonday\n\n09:00 – 18:00\n\nTuesday\n\n09:00 – —\n\nSaturday\n\nClosed all day\n\n',
		);
		expect(await read('dist/fr/details.txt')).toContain(
			"Horaires d'ouverture\n\nLundi\n\n09:00 – 18:00\n\nMardi\n\n09:00 – —\n\nSamedi\n\nFermé toute la journée\n\n",
		);
	});

	test('links a contact where a client can follow it, titled by its label or its type', async () => {
		const html = await read('dist/en/details.html');
		expect(html).toContain('<a href="mailto:hello@acme.example"');
		expect(html).toContain('<a href="tel:+33 1 23 45 67 89"');
		expect(html).toContain(
			'<a href="https://acme.example" style="font-size: 14px;',
		);
		expect(html).not.toContain('tel:+33 1 23 45 67 90');
		expect(await read('dist/en/details.txt')).toContain(
			'Reach us\n\nE-mail\n\nmailto:hello@acme.example\n\nhello@acme.example\n\nFront desk\n\n',
		);
		expect(html).not.toContain('>Contacts<');
		expect(await read('dist/fr/details.txt')).toContain(
			'Reach us\n\nE-mail\n\nmailto:hello@acme.example\n\nhello@acme.example\n\nFront desk\n\ntel:+33 1 23 45 67 89\n\n+33 1 23 45 67 89\n\nFax\n\n+33 1 23 45 67 90\n\nSite web\n\n',
		);
		expect(await read('dist/fr/details.txt')).toContain(
			'Mobile\n\ntel:{{ mobile }}',
		);
		// A placeholder after the scheme is filled bare; one that starts a
		// website's href is a URL the renderer checks at send time.
		expect(html).toContain('<a href="mailto:{{ email }}"');
		expect(html).toContain('<a href="tel:{{ mobile }}"');
		expect(html).toContain('>Mobile</a>');
		expect(html).toContain('<a href="{{ site }}"');
		const manifest = JSON.parse(await read('dist/mail-manifest.json'));
		expect(manifest.emails.details.urlVariables).toEqual(['site']);
	});

	test('lists files with their size by locale, their extension, and a download link but for a disabled one', async () => {
		const html = await read('dist/en/details.html');
		expect(html.match(/>Download</g)).toHaveLength(1);
		expect(html).not.toContain('https://acme.example/files/badge');
		for (const extension of ['PDF', 'PNG']) {
			expect(html).toContain(`>${extension}</span>`);
		}
		expect(styleOf(html, 'badge.pkpass', 'span')).toContain('color: #62748e;');
		expect(await read('dist/en/details.txt')).toContain(
			'agenda.pdf\n\n1.5 MB\n\nDownload\n\nhttps://acme.example/files/agenda.pdf\n\nmap\n\n512 B\n\nnotes.txt\n\n84.0 KB\n\nphotos.zip\n\n3.0 GB\n\nbadge.pkpass\n\n{{ badgeSize }}\n\nNo files\n\nNothing attached',
		);
		expect(await read('dist/fr/details.txt')).toContain(
			'agenda.pdf\n\n1,5 Mo\n\nTélécharger\n\nhttps://acme.example/files/agenda.pdf\n\nmap\n\n512 o\n\nnotes.txt\n\n84,0 Ko\n\nphotos.zip\n\n3,0 Go\n\nbadge.pkpass\n\n{{ badgeSize }}\n\nAucun fichier',
		);
	});

	test('draws a rating as stars, and a review request as a link per star, read as "4 of 5"', async () => {
		const html = await read('dist/en/details.html');
		expect(html).toContain('<p role="img" aria-label="4 of 5"');
		// Four stars in the warning colour, one muted.
		expect(html.match(/color: #f05100;[^>]*>★</g)).toHaveLength(4);
		for (const star of [1, 2, 3, 4, 5]) {
			expect(html).toContain(
				`<a href="https://acme.example/review?rating=${star}" class="nx-dark-text-foreground-25" title="${star} of 5" aria-label="${star} of 5"`,
			);
		}
		expect(await read('dist/fr/details.html')).toContain(
			'aria-label="4 sur 5"',
		);
		const text = await read('dist/en/details.txt');
		expect(text).toContain(
			'Your last visit\n\n4 of 5\n\nRated on 2 September.',
		);
		expect(text).toContain(
			'How was it?\n\n1 of 5\n\nhttps://acme.example/review?rating=1\n\n2 of 5',
		);
		expect(text).not.toContain('★');
	});

	describe('under maizzle serve', () => {
		let server: MaizzleServer;
		beforeAll(async () => {
			server = await serveMaizzle(maizzle, fixture);
		}, 120_000);
		afterAll(() => server?.stop());

		test.each([
			['welcome.vue', ['html-align', 'html-aria-hidden']],
			// The caption's caption-side falls back on its align="bottom".
			['gallery.vue', ['css-caption-side', 'html-align', 'html-align']],
			['sequence.vue', ['html-align', 'html-aria-hidden']],
			// An action card's indicator, hidden from a reader; an icon button named by its aria-label.
			['content.vue', ['html-align', 'html-aria-hidden', 'html-aria-label']],
			// A delta's arrow in each card, and a see-also's, hidden from a reader.
			[
				'summary.vue',
				[
					'html-align',
					'html-aria-hidden',
					'html-aria-hidden',
					'html-aria-hidden',
				],
			],
			['details.vue', ['html-align', 'html-aria-hidden']],
		])(
			'caniemail reports for Gmail, Outlook and Apple Mail only the known partial support of %s',
			async (email, known) => {
				const response = await fetch(
					`${server.origin}/__maizzle/compatibility/emails/${email}`,
				);
				expect(response.status).toBe(200);
				const issues: {
					kind: string;
					slug: string;
					severity?: string;
					supportLevel?: string;
				}[] = await response.json();
				// Everything reported is partial support with a fallback, and known:
				// a new finding shows up here as a diff.
				expect(issues.map((issue) => issue.slug).sort()).toEqual(known);
				expect(
					issues.filter(
						(issue) =>
							issue.supportLevel === 'unsupported' ||
							issue.severity === 'error',
					),
				).toEqual([]);
			},
		);
	});
});

describe.each([
	[
		'progress-placeholder',
		'<NxProgress model-value="{{ share }}" />',
		'NxProgress: modelValue must be a number known when the e-mail is built — a placeholder is filled only when it is sent',
	],
	[
		'count-badge-placeholder',
		'<NxCountBadge count="{{ unread }}">Inbox</NxCountBadge>',
		'NxCountBadge: count must be a number known when the e-mail is built — a placeholder is filled only when it is sent',
	],
	[
		'highlight-text-placeholder',
		'<NxHighlightText text="Acme invoices" query="{{ search }}" />',
		'NxHighlightText: query must be text known when the e-mail is built — a placeholder is filled only when it is sent',
	],
	[
		'icon-button-placeholder',
		'<NxIconButton href="https://acme.example" icon="{{ iconUrl }}" aria-label="Open" />',
		'NxIconButton: icon must be known when the e-mail is built — a placeholder is filled only when it is sent',
	],
])(
	'a component given a value the build cannot know (%s)',
	(name, tag, message) => {
		afterAll(() =>
			rmSync(`${cases}/${name}`, { recursive: true, force: true }),
		);

		test('fails the build, naming the component and the prop', async () => {
			const root = `${cases}/${name}`;
			rmSync(root, { recursive: true, force: true });
			const files: Record<string, string> = {
				'maizzle.config.ts': [
					"import { defineMailConfig } from '@nxgt/mail-config';",
					"import { ui } from '../../../src/index';",
					"export default defineMailConfig({ plugins: [ui({ brand: { name: 'Acme' } })] });",
				].join('\n'),
				'emails/welcome.vue': `<template><NxLayout>${tag}</NxLayout></template>`,
			};
			for (const [path, content] of Object.entries(files)) {
				mkdirSync(dirname(`${root}/${path}`), { recursive: true });
				writeFileSync(`${root}/${path}`, content);
			}
			const { code, output } = await run(root, 'build');
			expect(code).not.toBe(0);
			expect(output).toContain(message);
		}, 60_000);
	},
);

describe('a data component given what the build cannot draw', () => {
	afterAll(() =>
		rmSync(`${cases}/data-refused`, { recursive: true, force: true }),
	);

	test.each([
		[
			'<NxRating :model-value="placeholder(\'stars\')" />',
			'NxRating: modelValue must be a number known when the e-mail is built — a placeholder is filled only when it is sent',
		],
		[
			'<NxRating :max="placeholder(\'max\')" />',
			'NxRating: max must be a number known when the e-mail is built — a placeholder is filled only when it is sent',
		],
		[
			'<NxEventChip title="Call" color="var(--color-primary)" />',
			'NxEventChip: color must be a colour of the theme, as success, or a hex colour, as #0f766e — the build mixes its tint',
		],
		[
			'<NxOpeningHours :data="[{ dayOfWeek: 7 }]" />',
			'NxOpeningHours: dayOfWeek must be a whole number from 0 (Sunday) to 6 (Saturday)',
		],
		[
			'<NxOpeningHours :data="[{ dayOfWeek: 1.5 }]" />',
			'NxOpeningHours: dayOfWeek must be a whole number from 0 (Sunday) to 6 (Saturday)',
		],
		[
			"<NxContacts :data=\"[{ type: 'email', value: 'a@acme.example' }]\" />",
			'NxContacts: type must be EMAIL, FAX, MOBILE, PHONE or WEBSITE',
		],
	])(
		'%s fails the build, naming the component and the prop',
		async (tag, message) => {
			const root = `${cases}/data-refused`;
			rmSync(root, { recursive: true, force: true });
			const files: Record<string, string> = {
				'maizzle.config.ts': [
					"import { defineMailConfig } from '@nxgt/mail-config';",
					"import { i18n } from '@nxgt/mail-i18n';",
					"import { ui, uiCatalogues } from '../../../src/index';",
					"export default defineMailConfig({ plugins: [ui({ brand: { name: 'Acme' } }), i18n({ locales: ['en'], catalogues: [uiCatalogues] })] });",
				].join('\n'),
				'locales/en.json': '{ "welcome": { "subject": "Welcome" } }',
				'emails/welcome.vue': `<template><NxLayout>${tag}</NxLayout></template>`,
			};
			for (const [path, content] of Object.entries(files)) {
				mkdirSync(dirname(`${root}/${path}`), { recursive: true });
				writeFileSync(`${root}/${path}`, content);
			}
			const { code, output } = await run(root, 'build');
			expect(code).not.toBe(0);
			expect(output).toContain(message);
		},
		60_000,
	);
});

describe('a component without the ui plugin', () => {
	afterAll(() => rmSync(cases, { recursive: true, force: true }));

	test('fails the build, naming the component and the fix', async () => {
		const root = `${cases}/without-ui`;
		rmSync(root, { recursive: true, force: true });
		const files: Record<string, string> = {
			'maizzle.config.ts': [
				"import { COMPONENTS_DIR } from '../../../src/index';",
				"export default { components: { source: [{ path: COMPONENTS_DIR, prefix: 'Nx' }] } };",
			].join('\n'),
			'emails/welcome.vue': '<template><NxLayout>Hello</NxLayout></template>',
		};
		for (const [path, content] of Object.entries(files)) {
			mkdirSync(dirname(`${root}/${path}`), { recursive: true });
			writeFileSync(`${root}/${path}`, content);
		}
		const { code, output } = await run(root, 'build');
		expect(code).not.toBe(0);
		expect(output).toContain(
			'NxLayout: ui() is not in the plugins of defineMailConfig',
		);
	}, 60_000);
});

describe('a tag that resolves to no component', () => {
	const root = `${cases}/unresolved`;
	const write = (files: Record<string, string>) => {
		rmSync(root, { recursive: true, force: true });
		for (const [path, content] of Object.entries(files)) {
			mkdirSync(dirname(`${root}/${path}`), { recursive: true });
			writeFileSync(`${root}/${path}`, content);
		}
	};
	const config = (vue = '') =>
		[
			"import { defineMailConfig } from '@nxgt/mail-config';",
			"import { ui } from '../../../src/index';",
			`export default defineMailConfig({ plugins: [ui({ brand: { name: 'Acme' } })]${vue} });`,
		].join('\n');
	afterAll(() => rmSync(root, { recursive: true, force: true }));

	for (const mode of ['development', 'production']) {
		test(`fails the build when nested in a card, naming the tag and the template, under NODE_ENV=${mode}`, async () => {
			write({
				'maizzle.config.ts': config(),
				'emails/welcome.vue':
					'<template><NxLayout><NxCard><NxButon href="https://acme.example">Go</NxButon></NxCard></NxLayout></template>',
			});
			const { code, output } = await runIn(
				// biome-ignore lint/style/useNamingConvention: an environment variable.
				{ ...process.env, NODE_ENV: mode },
				root,
				'build',
			);
			expect(code).not.toBe(0);
			expect(output).toContain(
				'ui: <NxButon> in emails/welcome.vue is no component — check its name, or add the plugin or the components folder that brings it',
			);
		}, 60_000);
	}

	test('fails the build on the literal is of <component>, quoted either way', async () => {
		for (const is of ['is="NxButon"', `:is="'NxButon'"`]) {
			write({
				'maizzle.config.ts': config(),
				'emails/welcome.vue': `<template><NxLayout><component ${is} /></NxLayout></template>`,
			});
			const { code, output } = await run(root, 'build');
			expect({ is, code: code === 0 }).toEqual({ is, code: false });
			expect(output).toContain('ui: <NxButon> in emails/welcome.vue');
		}
	}, 60_000);

	test("passes Maizzle's own components, one the app registers, and HTML Vue does not know", async () => {
		write({
			'maizzle.config.ts': config(
				", vue: { plugins: [{ install: (app) => app.component('Greeting', { render: () => 'Hello from the app' }) }] }",
			),
			'emails/welcome.vue': [
				'<template><NxLayout><NxCard>',
				'<Button href="https://acme.example">Maizzle</Button><Spacer size="8" /><Greeting />',
				'<center><big>Old HTML</big></center>',
				'</NxCard></NxLayout></template>',
			].join(''),
		});
		const { code, output } = await run(root, 'build');
		expect({ code, output }).toEqual({ code: 0, output: expect.any(String) });
		const html = await Bun.file(`${root}/dist/welcome.html`).text();
		expect(html).toContain('https://acme.example');
		expect(html).toContain('Hello from the app');
		expect(html).toContain('<center>');
	}, 60_000);
});

/**
 * A generic spec suggested by an earlier review: every prop of every
 * `@nxgt/mail-ui` component, given `placeholder('x')` (`{{ x }}`), reaches
 * one of the two outcomes `test/placeholder-props.ts` declares — the table
 * itself is read from each component's `defineProps`, so a new component or
 * prop with no declared expectation fails the first test below.
 */
describe('the generic placeholder spec of every component and every prop', () => {
	test("every component's props all have a declared expectation", () => {
		const problems: string[] = [];
		for (const file of readdirSync(components).sort()) {
			if (!file.endsWith('.vue')) continue;
			const tag = tagOf(file);
			const found = propsOf(readFileSync(`${components}/${file}`, 'utf8'));
			const declared = Object.keys(TABLE[tag] ?? {});
			for (const name of found) {
				if (!declared.includes(name)) {
					problems.push(
						`${tag}.${name} (in ${file}) has no entry in test/placeholder-props.ts`,
					);
				}
			}
			for (const name of declared) {
				if (!found.includes(name)) {
					problems.push(
						`${tag}.${name} in test/placeholder-props.ts is not a prop of ${file}`,
					);
				}
			}
		}
		expect(problems).toEqual([]);
	});

	const passCases = Object.entries(TABLE).flatMap(([tag, props]) =>
		Object.entries(props)
			.filter(([, entry]) => entry.expect.kind === 'passes')
			.map(([name]) => instanceOf(tag, name)),
	);

	describe('a prop that is plain text or a URL, built once for every one of them', () => {
		const root = `${cases}/placeholder-pass`;
		beforeAll(async () => {
			rmSync(root, { recursive: true, force: true });
			const files: Record<string, string> = {
				'maizzle.config.ts': [
					"import { defineMailConfig } from '@nxgt/mail-config';",
					"import { i18n } from '@nxgt/mail-i18n';",
					"import { ui, uiCatalogues } from '../../../src/index';",
					"export default defineMailConfig({ plugins: [ui({ brand: { name: 'Acme' } }), i18n({ locales: ['en'], catalogues: [uiCatalogues] })] });",
				].join('\n'),
				'locales/en.json': '{ "welcome": { "subject": "Welcome" } }',
				'emails/welcome.vue': [
					'<template><NxLayout :lang="placeholder(\'layoutLang\')" :preheader="placeholder(\'layoutPreheader\')">',
					...passCases.map((each) => each.markup),
					'</NxLayout></template>',
				].join('\n'),
			};
			for (const [path, content] of Object.entries(files)) {
				mkdirSync(dirname(`${root}/${path}`), { recursive: true });
				writeFileSync(`${root}/${path}`, content);
			}
			await build(root);
		}, 120_000);
		afterAll(() => rmSync(root, { recursive: true, force: true }));

		test.each([
			...passCases.map((each) => each.name),
			'layoutLang',
			'layoutPreheader',
		])('%s reaches the built file as {{ %s }}', async (name) => {
			const html = await Bun.file(`${root}/dist/en/welcome.html`).text();
			expect(html).toContain(`{{ ${name} }}`);
		});
	});

	describe('a prop the build must compute, each its own build', () => {
		const failCases = Object.entries(TABLE).flatMap(([tag, props]) =>
			Object.entries(props)
				.filter(
					(
						entry,
					): entry is [
						string,
						(typeof props)[string] & {
							expect: { kind: 'fails'; message: string };
						},
					] => entry[1].expect.kind === 'fails',
				)
				.map(([name, entry]) => ({
					tag,
					name,
					message: entry.expect.message,
					markup:
						tag === 'NxLayout'
							? instanceOf(tag, name).markup
							: `<NxLayout>${instanceOf(tag, name).markup}</NxLayout>`,
				})),
		);
		afterAll(() =>
			rmSync(`${cases}/placeholder-fails`, { recursive: true, force: true }),
		);

		test.each(
			failCases.map(({ tag, name, message, markup }) => [
				`${tag}.${name}`,
				markup,
				message,
			]),
		)(
			'%s fails the build, naming the component and the prop',
			async (label, markup, message) => {
				// Its own directory: bun runs these cases concurrently.
				const root = `${cases}/placeholder-fails/${label}`;
				rmSync(root, { recursive: true, force: true });
				const files: Record<string, string> = {
					'maizzle.config.ts': [
						"import { defineMailConfig } from '@nxgt/mail-config';",
						"import { i18n } from '@nxgt/mail-i18n';",
						"import { ui, uiCatalogues } from '../../../../src/index';",
						"export default defineMailConfig({ plugins: [ui({ brand: { name: 'Acme' } }), i18n({ locales: ['en'], catalogues: [uiCatalogues] })] });",
					].join('\n'),
					'locales/en.json': '{ "welcome": { "subject": "Welcome" } }',
					'emails/welcome.vue': `<template>${markup}</template>`,
				};
				for (const [path, content] of Object.entries(files)) {
					mkdirSync(dirname(`${root}/${path}`), { recursive: true });
					writeFileSync(`${root}/${path}`, content);
				}
				const { code, output } = await run(root, 'build');
				expect(code).not.toBe(0);
				expect(output).toContain(message);
			},
			60_000,
		);
	});
});

describe('a right-to-left locale', () => {
	const root = `${cases}/rtl`;
	afterAll(() => rmSync(root, { recursive: true, force: true }));

	beforeAll(async () => {
		rmSync(root, { recursive: true, force: true });
		const files: Record<string, string> = {
			'maizzle.config.ts': [
				"import { defineMailConfig } from '@nxgt/mail-config';",
				"import { i18n } from '@nxgt/mail-i18n';",
				"import { ui } from '../../../src/index';",
				"export default defineMailConfig({ plugins: [ui({ brand: { name: 'Acme' } }), i18n({ locales: ['en', 'ar'] })] });",
			].join('\n'),
			// A small catalogue for this fixture alone: mail-ui's shared messages
			// (uiCatalogues) ship en/fr only — see docs/guide/right-to-left.md —
			// so this project writes its own common.footer.why, as one adding ar
			// would too.
			'locales/en.json': JSON.stringify({
				welcome: { subject: 'Welcome' },
				common: { footer: { why: 'You have an account with {brand}.' } },
			}),
			'locales/ar.json': JSON.stringify({
				welcome: { subject: 'أهلا' },
				common: { footer: { why: 'لديك حساب لدى {brand}.' } },
			}),
			'emails/welcome.vue': [
				'<template>',
				'  <NxLayout>',
				'    <NxAlert variant="error" title="Oops"><template #icon>!</template></NxAlert>',
				'    <NxCompareCard label="Sales" :current="{ value: \'120\', label: \'Now\' }" :previous="{ value: \'100\', label: \'Before\' }" :delta="12" />',
				'    <NxStatCard label="Users" value="42" :delta="5"><template #icon>i</template></NxStatCard>',
				"    <NxTimeline :items=\"[{ id: '1', title: 'Signed in', timestampLabel: 'Today' }, { id: '2', title: 'Second' }]\" />",
				"    <NxSeeAlso label=\"Links\" :items=\"[{ id: 'a', title: 'Docs', href: 'https://acme.example/docs' }]\" />",
				'    <NxListTile title="Item"><template #trailing>X</template></NxListTile>',
				'    <NxEntityHeader title="Header"><template #actions>A</template></NxEntityHeader>',
				"    <NxSummaryData :data=\"[{ label: 'L', value: 'V' }]\" />",
				'    <NxSteps><NxStepsItem title="Step 1" /><NxStepsItem title="Step 2" /></NxSteps>',
				'  </NxLayout>',
				'</template>',
			].join('\n'),
		};
		for (const [path, content] of Object.entries(files)) {
			mkdirSync(dirname(`${root}/${path}`), { recursive: true });
			writeFileSync(`${root}/${path}`, content);
		}
		await build(root);
	}, 60_000);

	test('writes dir="rtl" on <html> and the body, dir="ltr" for an ltr locale', async () => {
		const ar = await Bun.file(`${root}/dist/ar/welcome.html`).text();
		const en = await Bun.file(`${root}/dist/en/welcome.html`).text();
		expect(ar).toContain('lang="ar" dir="rtl"');
		expect(ar).toMatch(/<body[^>]*dir="rtl"/);
		expect(en).toContain('lang="en" dir="ltr"');
	});

	test("mirrors an alert's accent bar and icon padding", async () => {
		const ar = await Bun.file(`${root}/dist/ar/welcome.html`).text();
		const en = await Bun.file(`${root}/dist/en/welcome.html`).text();
		expect(ar).toContain('border-right-style: solid; border-right-width: 8px');
		expect(ar).toContain(
			'padding-left: 8px; vertical-align: top; color: #e40014',
		);
		expect(en).toContain('border-left-style: solid; border-left-width: 8px');
		expect(en).toContain(
			'padding-right: 8px; vertical-align: top; color: #e40014',
		);
	});

	test("mirrors a compare card's delta and its two boxes", async () => {
		const ar = await Bun.file(`${root}/dist/ar/welcome.html`).text();
		expect(ar).toContain('padding-right: 8px; text-align: left');
		expect(ar).toContain('padding-left: 6px; vertical-align: top');
		expect(ar).toContain('padding-right: 6px; vertical-align: top');
	});

	test("mirrors a stat card's icon and delta", async () => {
		const ar = await Bun.file(`${root}/dist/ar/welcome.html`).text();
		expect(ar).toContain('padding-right: 12px; text-align: left');
		expect(ar).toContain('padding-left: 8px; font-weight: 500');
	});

	test("mirrors a timeline's side: its line, its title's gap and its time", async () => {
		const ar = await Bun.file(`${root}/dist/ar/welcome.html`).text();
		const en = await Bun.file(`${root}/dist/en/welcome.html`).text();
		expect(ar).toContain('border-left-style: solid');
		expect(en).toContain('border-right-style: solid');
		expect(ar).toContain('padding-right: 12px; text-align: left');
		expect(en).toContain('padding-left: 12px; text-align: right');
	});

	test("mirrors a see-also's arrow, pointing away from the text either way", async () => {
		const ar = await Bun.file(`${root}/dist/ar/welcome.html`).text();
		const en = await Bun.file(`${root}/dist/en/welcome.html`).text();
		expect(ar).toContain('<span aria-hidden="true">↖</span>');
		expect(en).toContain('<span aria-hidden="true">↗</span>');
	});

	test("mirrors a list tile's trailing gap, an entity header's actions, a summary row and steps' line", async () => {
		const ar = await Bun.file(`${root}/dist/ar/welcome.html`).text();
		const en = await Bun.file(`${root}/dist/en/welcome.html`).text();
		expect(ar).toContain('padding-right: 16px; text-align: left');
		expect(en).toContain('padding-left: 16px; text-align: right');
		expect(ar).toContain('padding-bottom: 8px; text-align: left');
		expect(en).toContain('padding-bottom: 8px; text-align: right');
		expect(ar).toContain('border-left-width: 1px; border-left-style: solid');
		expect(en).toContain('border-right-width: 1px; border-right-style: solid');
	});

	test('keeps the plain-text part readable, without the mirrored glyph', async () => {
		const text = await Bun.file(`${root}/dist/ar/welcome.txt`).text();
		expect(text).toContain('Oops');
		expect(text).toContain('Signed in');
		expect(text).not.toMatch(/[▲▼↗↖]/);
	});
});
