/**
 * What a provider-specific action against a message `send` scheduled ahead —
 * Resend's `cancel` and `reschedule`, from `@nxgt/mail-resend` — refuses.
 *
 * Lives here, not in the transport, for the reason {@link MailWebhookRefused}
 * does: **a transport defines no error class of its own**, so `instanceof`
 * holds whichever provider adds a scheduled-cancel API of this same shape —
 * cancelling or rescheduling is not on the neutral `Mailer` port itself (SMTP
 * has no such thing), but the error it refuses with is still defined once.
 */

/**
 * `UNKNOWN_ID` — the id names no message the provider holds pending: it was
 * already cancelled, or the id is wrong. `ALREADY_SENT` — the message went
 * out before the request reached the provider; sending it again is not what
 * `cancel` or `reschedule` do. Both mean the same thing to a caller — the
 * action came too late, or never had a target — and `code` is for logging,
 * never a branch.
 */
export type MailScheduleErrorCode = 'ALREADY_SENT' | 'UNKNOWN_ID';

/**
 * A `cancel` or `reschedule` refused: as with every call-time refusal in this
 * repository, the message names **where**, never a value — the id is not an
 * address or a subject, but it is still a credential a caller can use to
 * cancel someone else's send, so it is never printed here either.
 */
export class MailScheduleRefused extends Error {
	override name = 'MailScheduleRefused';
	readonly code: MailScheduleErrorCode;

	constructor(
		code: MailScheduleErrorCode,
		message: string,
		options?: { readonly cause?: unknown },
	) {
		super(message, { cause: options?.cause });
		this.code = code;
	}
}
