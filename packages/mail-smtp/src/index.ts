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

/**
 * An address as nodemailer takes it: always an object, so nodemailer never
 * parses a string — it quotes and encodes the name itself.
 */
type NodemailerAddress = { name: string; address: string };

/**
 * What nodemailer answers once the server took the message: its id, and the
 * recipients it refused while accepting others — nodemailer resolves then.
 */
export interface SmtpSentInfo {
	readonly messageId?: string;
	readonly accepted?: readonly unknown[] | undefined;
	readonly rejected?: readonly unknown[] | undefined;
	/** One nodemailer error per refused recipient, with its `responseCode`. */
	readonly rejectedErrors?: readonly unknown[] | undefined;
}

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
	}): Promise<SmtpSentInfo>;
}

export interface SmtpMailerOptions {
	/** `nodemailer.createTransport(…)`, configured by the application. */
	readonly transporter: SmtpTransporter;
	/** The sender of a message that names none. Without it, such a message is refused. */
	readonly from?: Address;
}

const toNodemailer = (address: Address): NodemailerAddress =>
	typeof address === 'string'
		? { name: '', address }
		: { name: address.name, address: address.address };

interface SmtpError {
	readonly code?: unknown;
	readonly responseCode?: unknown;
	readonly command?: unknown;
	readonly message?: unknown;
	readonly rejectedErrors?: unknown;
}

const fieldsOf = (error: unknown): SmtpError =>
	typeof error === 'object' && error !== null ? (error as SmtpError) : {};

/**
 * Whether one nodemailer error is the server refusing **this message** for
 * good — a permanent `5xx` on a recipient or on the content, or nodemailer
 * refusing a message larger than the `SIZE` the server advertised — rather
 * than the server, the network or the wiring failing. Two `5xx` are
 * failures: authentication (`530`–`539`), and a sender refused at
 * `MAIL FROM` — the next message would be refused the same way.
 */
function isPermanentRefusal(error: unknown): boolean {
	const { code, responseCode, command, message } = fieldsOf(error);
	if (
		code === 'EMESSAGE' &&
		responseCode === undefined &&
		typeof message === 'string' &&
		message.startsWith('Message size larger than allowed')
	) {
		return true;
	}
	return (
		(code === 'EENVELOPE' || code === 'EMESSAGE') &&
		command !== 'MAIL FROM' &&
		typeof responseCode === 'number' &&
		responseCode >= 500 &&
		responseCode < 600 &&
		(responseCode < 530 || responseCode > 539)
	);
}

/**
 * Whether a rejected send is a refusal of the message. When every recipient
 * was refused, nodemailer's error carries the code of the **last** one only:
 * each refusal is read instead, and it is a refusal only if every one is.
 */
function isRefusal(error: unknown): boolean {
	const { rejectedErrors } = fieldsOf(error);
	if (Array.isArray(rejectedErrors) && rejectedErrors.length > 0) {
		return rejectedErrors.every(isPermanentRefusal);
	}
	return isPermanentRefusal(error);
}

/**
 * Throws when nodemailer resolved with some recipients refused: the server
 * took the message for the others, so it may already have reached them.
 */
function throwOnPartialRejection(info: SmtpSentInfo): void {
	const errors = Array.isArray(info.rejectedErrors) ? info.rejectedErrors : [];
	const rejected = Array.isArray(info.rejected) ? info.rejected : [];
	const refusedCount = Math.max(errors.length, rejected.length);
	if (refusedCount === 0) return;
	const accepted = Array.isArray(info.accepted) ? info.accepted.length : 0;
	const counted = `${refusedCount} of ${refusedCount + accepted} recipients`;
	const cause =
		errors[0] ??
		Object.assign(new Error('the SMTP server refused some recipients'), {
			rejected,
		});
	if (errors.length > 0 && errors.every(isPermanentRefusal)) {
		throw new MailRefused(
			`send: the SMTP server refused ${counted}, and may have delivered to the others`,
			{ cause },
		);
	}
	throw new MailFailure(
		`send: the SMTP server could not take ${counted}, and may have delivered to the others`,
		{ cause },
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
			let info: SmtpSentInfo;
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
			throwOnPartialRejection(info ?? {});
			const messageId =
				typeof info?.messageId === 'string' && info.messageId !== ''
					? info.messageId
					: null;
			return { messageId };
		},
	};
}
