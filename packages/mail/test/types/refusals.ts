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
 * **Nine plausible mistakes, nine refused.**
 */

import type { MailerHarness } from '../../src/conformance/index';
import {
	createMemoryMailer,
	MailError,
	type MailErrorCode,
	type Mailer,
	MailFailure,
	type MailMessage,
	pickLocale,
	type Rendered,
	type SentMail,
} from '../../src/index';

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
