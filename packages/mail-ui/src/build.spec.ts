import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixture = fileURLToPath(new URL('../test/fixture', import.meta.url));
const cases = fileURLToPath(new URL('../test/.cases', import.meta.url));
const maizzle = fileURLToPath(
	new URL('../node_modules/.bin/maizzle', import.meta.url),
);

/** Runs `maizzle <args>` in `cwd`, as a project runs it. */
async function run(cwd: string, ...args: string[]) {
	const child = Bun.spawn([maizzle, ...args], {
		cwd,
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
			'<a href="https://acme.example" style="font-size: 18px;',
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

	test('shows the name, unlinked, for a brand without a URL or logo', async () => {
		const html = await read('dist-override/en/welcome.html');
		expect(html).toMatch(/<span style="[^"]*">Acme<\/span>/);
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
		expect(html).toContain('<table role="table"');
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
			'<caption align="bottom" style="caption-side: bottom;',
		);
		expect(html).toContain('<td colspan="2" style="padding: 40px 16px;');
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
		expect(text).not.toMatch(/[▲▼↗]/);
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
			/<h3 style="margin: 0; font-size: 18px;[^>]*font-weight: 600;[^>]*>\s*Your inbox\s*<\/h3>/,
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
			'<td style="border-radius: 8px; border: 1px solid #a4a7cb;',
		);
		expect(html).toContain(
			'<a href="https://acme.example/digest" style="color: #020618;',
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
			/<img src="https:\/\/acme\.example\/chart\.png" alt="Messages per day" style="display: block;[^"]*border-radius: 14px;[^"]*" height="auto" width="534">/,
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
			'href="https://acme.example/preferences">Manage your preferences</a>',
		);
		expect(styleOf(html, 'Unsubscribe', 'span')).toBe('mso-text-raise: 8px;');
		expect(html).toMatch(
			/border: 1px solid #f27f8a;[^>]*href="https:\/\/acme\.example\/unsubscribe"/,
		);
	});

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
	])(
		'caniemail reports for Gmail, Outlook and Apple Mail only the known partial support of %s',
		async (email, known) => {
			const port = 39_000 + Math.floor(Math.random() * 900);
			const child = Bun.spawn([maizzle, 'serve', '--port', String(port)], {
				cwd: fixture,
				stdout: 'ignore',
				stderr: 'ignore',
			});
			try {
				const url = `http://localhost:${port}/__maizzle/compatibility/emails/${email}`;
				let issues:
					| {
							kind: string;
							slug: string;
							severity?: string;
							supportLevel?: string;
					  }[]
					| null = null;
				for (let attempt = 0; attempt < 60 && issues === null; attempt++) {
					issues = await fetch(url)
						.then((response) => (response.ok ? response.json() : null))
						.catch(() => Bun.sleep(500).then(() => null));
				}
				// Everything reported is partial support with a fallback, and known:
				// a new finding shows up here as a diff.
				expect(issues?.map((issue) => issue.slug).sort()).toEqual(known);
				expect(
					issues?.filter(
						(issue) =>
							issue.supportLevel === 'unsupported' ||
							issue.severity === 'error',
					),
				).toEqual([]);
			} finally {
				child.kill();
				await child.exited;
			}
		},
		60_000,
	);
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
