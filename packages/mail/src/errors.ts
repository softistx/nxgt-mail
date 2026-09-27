/**
 * What a transport refuses, as a string a caller can switch on.
 *
 * Every code is a **refusal at call time**. A refusal that can only come from
 * how the application was wired — a bad option passed to a factory — is a
 * bare `TypeError` instead: no handler should ever answer one.
 *
 * The codes are `SCREAMING_SNAKE` because they are data values, not API
 * identifiers. Every key in this package is `camelCase`.
 */
export type MailErrorCode =
	/**
	 * The transport could not hand the message over: a refused connection, a
	 * timeout, a 5xx from the provider, an expired credential. The transport's
	 * own error is the `cause`.
	 *
	 * **Nothing is known to have been sent** — after a timeout or a dropped
	 * connection, the provider may have taken it all the same. Retry later,
	 * or tell the user it failed. Never report it as sent.
	 */
	| 'MAIL_FAILED'
	/**
	 * The message itself was refused, before or by the transport: no
	 * recipient, something that is not an address, a line break in the
	 * subject or a header, an attachment that is not bytes or is badly named,
	 * a provider answering that the message is malformed or too large, or —
	 * from `@nxgt/mail/renderer` — a URL variable that is not an `http:`,
	 * `https:` or `mailto:` URL. Sending it again unchanged fails again.
	 */
	| 'MAIL_REFUSED';

/** Options every error of this package accepts. */
export interface MailErrorOptions {
	/** The error that caused this one, typically the transport's. */
	readonly cause?: unknown;
}

/**
 * The base class of every error this package throws at call time. It is
 * abstract: a transport throws {@link MailFailure} or {@link MailRefused}.
 *
 * **There is exactly one definition of this class.** A transport defines no
 * error class of its own and throws these, imported from its `@nxgt/mail`
 * peer, so `error instanceof MailFailure` holds whatever transport threw it.
 *
 * A message reports **a shape, never a value**: never a recipient address,
 * never a subject, never a link — the link in a verification e-mail is a
 * credential.
 */
export abstract class MailError extends Error {
	override name = 'MailError';
	/**
	 * Abstract, so a transport cannot throw a bare `MailError` that passes a
	 * `code` check and fails `instanceof MailFailure`: it throws one of the two
	 * subclasses.
	 */
	abstract readonly code: MailErrorCode;

	constructor(message: string, options?: MailErrorOptions) {
		super(message, { cause: options?.cause });
	}
}

/** The transport could not hand the message over. Code `MAIL_FAILED`. */
export class MailFailure extends MailError {
	override name = 'MailFailure';
	override readonly code = 'MAIL_FAILED' as const;
}

/** The message was refused as malformed. Code `MAIL_REFUSED`. */
export class MailRefused extends MailError {
	override name = 'MailRefused';
	override readonly code = 'MAIL_REFUSED' as const;
}
