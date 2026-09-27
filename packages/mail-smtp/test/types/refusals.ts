/**
 * What `@nxgt/mail-smtp` refuses at COMPILE time.
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
 * **Six plausible mistakes, six refused.**
 */

import type { Mailer, MailMessage, SentMail } from '@nxgt/mail';
import nodemailer from 'nodemailer';
import { createSmtpMailer, type SmtpMailerOptions } from '../../src/index';

declare const message: MailMessage;

// ── Must compile ─────────────────────────────────────────────────────────────
// What nodemailer.createTransport answers is a transporter, with no cast —
// from an options object or from an SMTP URL.
const transporter = nodemailer.createTransport({
	host: 'smtp.example.com',
	port: 587,
	auth: { user: 'acme', pass: 'secret' },
});
const mailer: Mailer = createSmtpMailer({ transporter });
const withFrom: Mailer = createSmtpMailer({
	transporter: nodemailer.createTransport(
		'smtps://acme:secret@smtp.example.com',
	),
	from: { name: 'Acme', address: 'noreply@acme.test' },
});
const bareFrom: Mailer = createSmtpMailer({
	transporter,
	from: 'noreply@acme.test',
});
const sent: Promise<SentMail> = mailer.send(message);
// An attachment is bytes: a Buffer read from disk is one.
const withFile: Promise<SentMail> = mailer.send({
	...message,
	attachments: [
		{
			filename: 'invoice.pdf',
			content: Buffer.from('%PDF-1.7'),
			contentType: 'application/pdf',
		},
	],
});
void [withFrom, bareFrom, sent, withFile];

// ── 1. No transporter ────────────────────────────────────────────────────────
// @ts-expect-error — the transporter is required: the application configures nodemailer.
createSmtpMailer({ from: 'noreply@acme.test' });

// ── 2. nodemailer's options instead of its transporter ───────────────────────
// @ts-expect-error — pass nodemailer.createTransport(…), not what it takes.
createSmtpMailer({ transporter: { host: 'smtp.example.com', port: 587 } });

// ── 3. The SMTP options given to createSmtpMailer itself ─────────────────────
// @ts-expect-error — host, port and auth belong to nodemailer.createTransport.
createSmtpMailer({ host: 'smtp.example.com', port: 587 });

// ── 4. A default sender without its address ──────────────────────────────────
// @ts-expect-error — `{ name }` alone is not an address.
createSmtpMailer({ transporter, from: { name: 'Acme' } });

// ── 5. A retry option ────────────────────────────────────────────────────────
// The transport tries once; retrying is the caller's decision.
// @ts-expect-error — there is no retry.
const retrying: SmtpMailerOptions = { transporter, retries: 3 };

// ── 6. The message id read as always present ─────────────────────────────────
// @ts-expect-error — an absence is `null`: nodemailer may give no id.
const id: string = (await mailer.send(message)).messageId;

void [retrying, id];
