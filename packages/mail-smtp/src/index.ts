/**
 * `@nxgt/mail-smtp` — an SMTP transport for `@nxgt/mail`, on the `nodemailer`
 * the application installs and configures.
 *
 * ```ts
 * import nodemailer from 'nodemailer';
 * import { createSmtpMailer } from '@nxgt/mail-smtp';
 *
 * const mailer = createSmtpMailer({
 *   transporter: nodemailer.createTransport({ host, port: 587, auth }),
 *   from: { name: 'Acme', address: 'noreply@acme.test' },
 * });
 * ```
 *
 * **A failure throws** the `MailFailure` or `MailRefused` of the `@nxgt/mail`
 * peer, nodemailer's error as the `cause`. Nothing is retried.
 */

import {
	type Address,
	checkMessage,
	type Mailer,
	MailFailure,
	type MailMessage,
	MailRefused,
	type SentMail,
} from '@nxgt/mail';

/** An address as nodemailer takes it: it quotes and encodes the name itself. */
type NodemailerAddress = string | { name: string; address: string };

/**
 * The part of a nodemailer transporter this transport calls — what
 * `nodemailer.createTransport(…)` answers, from nodemailer 7 on.
 */
export interface SmtpTransporter {
	sendMail(mail: {
		from: NodemailerAddress;
		to: NodemailerAddress[];
		replyTo?: NodemailerAddress;
		subject: string;
		html: string;
		text: string;
		headers?: Record<string, string>;
		disableFileAccess: boolean;
		disableUrlAccess: boolean;
	}): Promise<{ readonly messageId?: string }>;
}

export interface SmtpMailerOptions {
	/** `nodemailer.createTransport(…)`, configured by the application. */
	readonly transporter: SmtpTransporter;
	/** The sender of a message that names none. Without it, such a message is refused. */
	readonly from?: Address;
}

const toNodemailer = (address: Address): NodemailerAddress =>
	typeof address === 'string'
		? address
		: { name: address.name, address: address.address };

/**
 * Whether nodemailer's error is the server refusing **this message** — a
 * permanent `5xx` on a recipient or on the content — rather than the server,
 * the network or the credentials failing. Authentication (`530`–`539`) is a
 * failure: the next message would be refused the same way.
 */
function isRefusal(error: unknown): boolean {
	if (typeof error !== 'object' || error === null) return false;
	const { code, responseCode } = error as {
		readonly code?: unknown;
		readonly responseCode?: unknown;
	};
	return (
		(code === 'EENVELOPE' || code === 'EMESSAGE') &&
		typeof responseCode === 'number' &&
		responseCode >= 500 &&
		responseCode < 600 &&
		(responseCode < 530 || responseCode > 539)
	);
}

/** Creates a {@link Mailer} that hands each message to `transporter`. */
export function createSmtpMailer(options: SmtpMailerOptions): Mailer {
	if (typeof options !== 'object' || options === null) {
		throw new TypeError(
			'createSmtpMailer: options must be an object, as { transporter }',
		);
	}
	const { transporter, from } = options;
	if (
		typeof transporter !== 'object' ||
		transporter === null ||
		typeof transporter.sendMail !== 'function'
	) {
		throw new TypeError(
			'createSmtpMailer: transporter must be what nodemailer.createTransport(…) answers',
		);
	}
	if (from !== undefined) {
		// Checked once, as the message's own sender is: a wiring mistake.
		try {
			checkMessage({ to: from, subject: '', html: '', text: '' });
		} catch {
			throw new TypeError(
				'createSmtpMailer: from must be an e-mail address, as noreply@example.com or { name, address }',
			);
		}
	}

	return {
		async send(message: MailMessage): Promise<SentMail> {
			checkMessage(message);
			const sender = message.from ?? from;
			if (sender === undefined) {
				throw new MailRefused(
					'send: from is missing — give the message a from, or createSmtpMailer a default one',
				);
			}
			const to = Array.isArray(message.to) ? message.to : [message.to];
			let info: { readonly messageId?: string };
			try {
				info = await transporter.sendMail({
					from: toNodemailer(sender),
					to: to.map(toNodemailer),
					...(message.replyTo === undefined
						? {}
						: { replyTo: toNodemailer(message.replyTo) }),
					subject: message.subject,
					html: message.html,
					text: message.text,
					...(message.headers === undefined
						? {}
						: { headers: { ...message.headers } }),
					// The parts are strings: nothing is ever read from a file or a URL.
					disableFileAccess: true,
					disableUrlAccess: true,
				});
			} catch (error) {
				if (isRefusal(error)) {
					throw new MailRefused('send: the SMTP server refused the message', {
						cause: error,
					});
				}
				throw new MailFailure(
					'send: the SMTP server could not take the message',
					{
						cause: error,
					},
				);
			}
			const messageId =
				typeof info?.messageId === 'string' && info.messageId !== ''
					? info.messageId
					: null;
			return { messageId };
		},
	};
}
