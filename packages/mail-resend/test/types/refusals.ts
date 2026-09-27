/**
 * What `@nxgt/mail-resend` refuses at COMPILE time.
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
 * **Seven plausible mistakes, seven refused.**
 */

import type { Mailer, MailMessage, SentMail } from '@nxgt/mail';
import {
	createResendMailer,
	formatAddress,
	type ResendMailerOptions,
} from '../../src/index';

declare const message: MailMessage;
declare const env: Readonly<Record<string, string | undefined>>;

// ── Must compile ─────────────────────────────────────────────────────────────
// A key from the environment, with the absence decided; a fetch of your own,
// written as a plain function; every option.
const mailer: Mailer = createResendMailer({ apiKey: env.RESEND_API_KEY ?? '' });
const full: Mailer = createResendMailer({
	apiKey: 're_123',
	from: { name: 'Acme', address: 'noreply@acme.test' },
	baseUrl: 'https://resend.proxy.example',
	fetch: (url, init) => fetch(url, init),
	timeoutMs: 10_000,
});
const sent: Promise<SentMail> = mailer.send(message);
const header: string = formatAddress({
	name: 'Doe, John',
	address: 'john@example.test',
});
void [full, sent, header];

// ── 1. No API key ────────────────────────────────────────────────────────────
// @ts-expect-error — apiKey is required.
createResendMailer({ from: 'noreply@acme.test' });

// ── 2. A key that may be undefined ───────────────────────────────────────────
// An unset variable is decided where it is read, not at the first send.
// @ts-expect-error — string, not string | undefined.
createResendMailer({ apiKey: env.RESEND_API_KEY });

// ── 3. A timeout written as a duration ───────────────────────────────────────
// @ts-expect-error — timeoutMs is a number of milliseconds.
createResendMailer({ apiKey: 're_123', timeoutMs: '30s' });

// ── 4. A default sender without its address ──────────────────────────────────
// @ts-expect-error — `{ name }` alone is not an address.
createResendMailer({ apiKey: 're_123', from: { name: 'Acme' } });

// ── 5. Resend's wire format in the options ───────────────────────────────────
// Options are camelCase; `reply_to` is only written on the wire, per message.
const snake: ResendMailerOptions = {
	apiKey: 're_123',
	// @ts-expect-error — no reply_to option: a message carries its replyTo.
	reply_to: 'x@acme.test',
};

// ── 6. A retry option ────────────────────────────────────────────────────────
// The transport tries once; retrying is the caller's decision.
// @ts-expect-error — there is no retry.
const retrying: ResendMailerOptions = { apiKey: 're_123', retries: 3 };

// ── 7. The message id read as always present ─────────────────────────────────
// @ts-expect-error — an absence is `null`: Resend may answer no id.
const id: string = (await mailer.send(message)).messageId;

void [snake, retrying, id];
