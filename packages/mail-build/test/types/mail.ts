/**
 * What a generated `mails` module refuses at COMPILE time.
 *
 * Checked by `tsc --noEmit`, never run. The module is `generated/mail.ts`,
 * built from `test/fixtures/mail` and kept equal to that build by the golden
 * test in `src/templates/mail.spec.ts` — so these refusals measure the real
 * build, not a hand-written module.
 *
 * The calls that **must keep compiling** are here too, unmarked.
 *
 * **Eight plausible mistakes, eight refused.**
 */

import {
	type Locale,
	type MailArgs,
	mails,
	type RenderedMail,
} from './generated/mail';

declare const locale: Locale;
declare const fromRequest: string;
const link = 'https://example.com/verify?token=abc';

// ── Must compile ─────────────────────────────────────────────────────────────

const rendered: RenderedMail = mails.verifyEmail({
	locale,
	name: 'Ada',
	link,
	hours: 24,
});
const { subject, html, text } = rendered;
void [subject, html, text];
mails.orderPlaced({
	locale: 'fr',
	timeZone: 'Europe/Paris',
	name: 'Ada',
	reference: 'A-1042',
	placedAt: new Date(),
	total: 42.5,
	logo: 'https://cdn.example.com/logo.png',
	orderLink: 'mailto:orders@example.com',
});
const args: MailArgs['verifyEmail'] = {
	locale: 'en',
	name: 'Ada',
	link,
	hours: 1,
};
mails.verifyEmail(args);

// ── 1. A locale the build does not hold ──────────────────────────────────────
// @ts-expect-error — 'de' is not a locale of this build.
mails.verifyEmail({ locale: 'de', name: 'Ada', link, hours: 24 });

// ── 2. A locale straight from a request, not picked ──────────────────────────
// @ts-expect-error — a string is not a `Locale`: pick it with `pickLocale`.
mails.verifyEmail({ locale: fromRequest, name: 'Ada', link, hours: 24 });

// ── 3. A misspelled or translated prop ───────────────────────────────────────
// @ts-expect-error — `nom` is not an argument of verifyEmail.
mails.verifyEmail({ locale, nom: 'Ada', link, hours: 24 });

// ── 4. A missing prop ────────────────────────────────────────────────────────
// @ts-expect-error — `hours` is required: its message uses it.
mails.verifyEmail({ locale, name: 'Ada', link });

// ── 5. A string for a plural ─────────────────────────────────────────────────
// @ts-expect-error — `hours` is a number: `{hours, plural, …}`.
mails.verifyEmail({ locale, name: 'Ada', link, hours: '24' });

// ── 6. A string for a date ───────────────────────────────────────────────────
mails.orderPlaced({
	locale,
	name: 'Ada',
	reference: 'A-1042',
	// @ts-expect-error — `placedAt` is a `Date`: `{at, date, long}`.
	placedAt: '2026-09-25',
	total: 42.5,
	logo: 'https://cdn.example.com/logo.png',
	orderLink: 'https://example.com/orders/A-1042',
});

// ── 7. A URL object for a link ───────────────────────────────────────────────
// @ts-expect-error — a link is a string, checked when the e-mail is rendered.
mails.verifyEmail({ locale, name: 'Ada', link: new URL(link), hours: 24 });

// ── 8. An e-mail that has no template ────────────────────────────────────────
// @ts-expect-error — there is no `emails/welcome.vue`.
mails.welcome({ locale });
