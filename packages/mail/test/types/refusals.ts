/**
 * What `@nxgt/mail` refuses at COMPILE time.
 *
 * Checked by `tsc --noEmit`, never run. Every `@ts-expect-error` here is a
 * refusal that stops holding the moment the directive goes unused — so a
 * refusal that quietly weakens fails the typecheck instead of passing
 * unnoticed. The count is in the README; a count that goes down is a
 * regression.
 *
 * The calls that **must keep compiling** are here too, unmarked: a refusal
 * that refuses the correct call is a bug.
 *
 * **Twenty-one plausible mistakes, twenty-one refused.**
 */

import type { DeliveredMail, MailerHarness } from '../../src/conformance/index';
import {
	createMemoryMailer,
	type MailAttachment,
	MailError,
	type MailErrorCode,
	type Mailer,
	MailFailure,
	type MailMessage,
	pickLocale,
	type Rendered,
	type SentMail,
} from '../../src/index';
import { createMailRenderer } from '../../src/renderer';

declare const rendered: Rendered;

// ── Must compile ─────────────────────────────────────────────────────────────

const ok: MailMessage = { ...rendered, to: 'ada@example.test' };
const many: MailMessage = {
	...rendered,
	to: ['ada@example.test', { name: 'Grace', address: 'grace@example.test' }],
	from: { name: 'Example', address: 'noreply@example.test' },
	replyTo: 'support@example.test',
	headers: { 'List-Unsubscribe': '<https://example.test/u>' },
};
const memory: Mailer = createMemoryMailer();
const locale: 'en' | 'fr' = pickLocale('fr-CA', ['en', 'fr'], 'en');
const custom: Mailer = { send: async () => ({ messageId: null }) };
void [ok, many, memory, locale, custom];

// ── 1. A message without a recipient ─────────────────────────────────────────
// @ts-expect-error — `to` is required.
const noTo: MailMessage = { ...rendered };

// ── 2. A message without a text part ─────────────────────────────────────────
// @ts-expect-error — every e-mail has a text part; a Rendered always carries one.
const noText: MailMessage = { to: 'a@b.c', subject: 's', html: 'h' };

// ── 3. An address object without its address ────────────────────────────────
// @ts-expect-error — `{ name }` alone is not an address.
const nameOnly: MailMessage = { ...rendered, to: { name: 'Ada' } };

// ── 4. A Mailer missing send ─────────────────────────────────────────────────
// @ts-expect-error — `send` is the port.
const noSend: Mailer = {};

// ── 5. A Mailer whose send answers a boolean ─────────────────────────────────
// A failure throws; it never answers `false`. The port has no room for one.
// @ts-expect-error — `send` answers `SentMail`, not `boolean`.
const answersFalse: Mailer = { send: async () => false };

// ── 6. A SentMail with an undefined id ───────────────────────────────────────
// @ts-expect-error — an absence is `null`, never `undefined`.
const undefinedId: SentMail = { messageId: undefined };

// ── 7. A fallback locale the build does not support ──────────────────────────
// @ts-expect-error — `de` is not one of `supported`.
pickLocale('fr', ['en', 'fr'], 'de');

// ── 8. A code the union does not declare ─────────────────────────────────────
// @ts-expect-error — the codes are MAIL_FAILED and MAIL_REFUSED.
const unknownCode: MailErrorCode = 'MAIL_BOUNCED';

// A conformance harness must open a transport and read back what it delivered.
const harness: MailerHarness = {
	open: async () => ({ mailer: memory, delivered: async () => [] }),
};
void [
	noTo,
	noText,
	nameOnly,
	noSend,
	answersFalse,
	undefinedId,
	unknownCode,
	harness,
];
void new MailFailure('x');

// ── 9. A bare MailError ──────────────────────────────────────────────────────
// It would pass a `code` check and fail `instanceof MailFailure`: a transport
// throws one of the two subclasses.
// @ts-expect-error — MailError is abstract.
void new MailError('x');

// ── The renderer ─────────────────────────────────────────────────────────────
// Must keep compiling: a number is a value, getLanguage may answer a list or
// nothing, and what render answers spreads into a message.
declare const mailer: Mailer;
declare const user: { readonly locale: string | null };
const mails = createMailRenderer({
	dir: 'dist',
	getLanguage: () => [user.locale, 'en'],
});
void mailer.send({
	to: 'ada@example.com',
	...mails.render(
		'sign-in-code',
		{ code: 123456, name: 'Ada' },
		{ locale: 'fr' },
	),
});

// ── 10. A renderer without the build's folder ───────────────────────────────
// @ts-expect-error — dir is required.
createMailRenderer({ getLanguage: () => 'en' });

// ── 11. getLanguage given as a locale ────────────────────────────────────────
// It is asked at each render, so a user's locale is read when they are sent to.
// @ts-expect-error — a function answering the wanted locales.
createMailRenderer({ dir: 'dist', getLanguage: 'en' });

// ── 12. A value that is not text ─────────────────────────────────────────────
// An object would render as [object Object], a boolean as true.
// @ts-expect-error — a string or a number.
mails.render('verify-email', { link: new URL('https://app.example') });

// ── The renderer, given the build's MailEmails ───────────────────────────────
// As @nxgt/mail-i18n writes it in generated/mail.ts for test/built, plus an
// e-mail that takes no variable.
interface MailEmails {
	'sign-in-code': { readonly code: string | number };
	'verify-email': { readonly link: string; readonly name: string | number };
	welcome: Readonly<Record<string, never>>;
}
const typed = createMailRenderer<MailEmails>({ dir: 'dist' });
// Must keep compiling: a number for a variable that is not a URL, options, an
// e-mail without variables called without them, and the build's names.
void typed.render('sign-in-code', { code: 123456 }, { locale: 'fr' });
void typed.render('verify-email', { link: 'https://app.example', name: 'Ada' });
void typed.render('welcome');
const names: readonly ('sign-in-code' | 'verify-email' | 'welcome')[] =
	typed.emails;
void names;

// ── 13. An e-mail the build does not have ────────────────────────────────────
// @ts-expect-error — one of MailEmails' names.
typed.render('verify-emial', { link: 'https://app.example', name: 'Ada' });

// ── 14. A variable the e-mail does not take ──────────────────────────────────
// @ts-expect-error — sign-in-code takes code only.
typed.render('sign-in-code', { code: 1, name: 'Ada' });

// ── 15. A variable left out ──────────────────────────────────────────────────
// @ts-expect-error — verify-email needs its name.
typed.render('verify-email', { link: 'https://app.example' });

// ── 16. The variables left out altogether ────────────────────────────────────
// @ts-expect-error — sign-in-code needs its code.
typed.render('sign-in-code');

// ── 17. A number for a URL ───────────────────────────────────────────────────
// A URL variable decides a link's scheme: it is a string, checked at render.
// @ts-expect-error — link is a string.
typed.render('verify-email', { link: 42, name: 'Ada' });

// ── Attachments ──────────────────────────────────────────────────────────────
// Must keep compiling: bytes from anywhere — a Uint8Array, a Buffer, what
// fetch answers — and a harness that reads them back, or one written before
// attachments, which leaves them out.
declare const pdf: Uint8Array;
const invoice: MailAttachment = {
	filename: 'invoice-42.pdf',
	content: pdf,
	contentType: 'application/pdf',
};
const withFiles: MailMessage = {
	...rendered,
	to: 'ada@example.test',
	attachments: [
		invoice,
		{
			filename: 'notes.txt',
			content: Buffer.from('notes'),
			contentType: 'text/plain',
		},
		{
			filename: 'logo.png',
			content: new Uint8Array(await new Response('png').arrayBuffer()),
			contentType: 'image/png',
		},
	],
};
const readBack: DeliveredMail = {
	to: ['ada@example.test'],
	subject: 's',
	html: 'h',
	text: 't',
	attachments: [invoice],
};
const olderHarness: DeliveredMail = {
	to: ['ada@example.test'],
	subject: 's',
	html: 'h',
	text: 't',
};
void [withFiles, readBack, olderHarness];

// ── 18. An attachment's content as text ──────────────────────────────────────
// A string would be sent in some encoding the transport picks: bytes only.
const asText: MailAttachment = {
	filename: 'notes.txt',
	// @ts-expect-error — content is a Uint8Array.
	content: 'notes',
	contentType: 'text/plain',
};

// ── 19. An attachment given as a path ────────────────────────────────────────
// No transport reads a file or a URL for you: read it, and pass its bytes.
const asPath: MailMessage = {
	...rendered,
	to: 'ada@example.test',
	attachments: [
		{
			filename: 'invoice.pdf',
			// @ts-expect-error — no path, no URL: content is the file's bytes.
			path: '/srv/invoices/42.pdf',
			contentType: 'application/pdf',
		},
	],
};

// ── 20. An attachment without its content type ───────────────────────────────
// Nothing guesses it from the file name.
// @ts-expect-error — contentType is required.
const untyped: MailAttachment = { filename: 'invoice.pdf', content: pdf };

// ── 21. One attachment, not in a list ────────────────────────────────────────
const single: MailMessage = {
	...rendered,
	to: 'ada@example.test',
	// @ts-expect-error — attachments is a list, even of one.
	attachments: invoice,
};
void [asText, asPath, untyped, single];
