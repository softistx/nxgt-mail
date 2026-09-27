/**
 * What a provider reports **after** `send` hands a message over: delivered,
 * bounced, complained… Neutral, provider-free — the same shape whichever
 * transport is wired, mapped from the provider's own webhook by a subpath
 * like `@nxgt/mail-resend/webhooks`.
 *
 * **No PII beyond what the provider already sends.** `recipient` is the
 * address the provider itself reports — never enriched from your own data —
 * and `raw` is the provider's payload, untouched: for `opened` and `clicked`,
 * some providers put the recipient's IP address and user agent inside it
 * (Resend's `click.ipAddress`, `click.userAgent`). Read `raw` only when you
 * accept that, and never persist it without a reason.
 *
 * **An absence is `null`.** A webhook event of a type this package does not
 * map answers `null`, not a throw — see `@nxgt/mail-resend/webhooks`'s
 * `verify`. A failure to trust the *request itself* — a bad or old signature
 * — throws {@link MailWebhookRefused}.
 */

/** The kinds of event a provider's webhook reports. */
export type MailEventType =
	| 'delivered'
	| 'bounced'
	| 'complained'
	| 'delayed'
	| 'opened'
	| 'clicked';

interface MailEventBase {
	/** The id `send` answered as `SentMail.messageId`, the provider's own. */
	readonly messageId: string;
	/** The address the provider reports the event for, exactly as it sent it. */
	readonly recipient: string;
	/** When the provider says the event happened. */
	readonly timestamp: Date;
	/** The message's own `tags`, when the provider echoes them back. An empty record when it does not. */
	readonly tags: Readonly<Record<string, string>>;
	/** The provider's own payload for this event, untouched — the escape hatch for a field this type does not carry. */
	readonly raw: unknown;
}

/** The receiving server took the message. */
export interface MailDeliveredEvent extends MailEventBase {
	readonly type: 'delivered';
}

/**
 * `hard` — the address itself is bad (unknown user, domain does not exist):
 * permanent, and sending it again fails again. `soft` — a temporary
 * rejection (a full inbox, greylisting, a transient server problem): the
 * provider may retry on its own, and so may you, later.
 */
export type MailBounceType = 'hard' | 'soft';

/** The receiving server rejected the message. */
export interface MailBouncedEvent extends MailEventBase {
	readonly type: 'bounced';
	readonly bounceType: MailBounceType;
}

/** The recipient marked the message as spam, after it was delivered. */
export interface MailComplainedEvent extends MailEventBase {
	readonly type: 'complained';
}

/** Delivery is taking longer than usual — a full inbox, a slow server. Not a failure: it may still arrive, or bounce later. */
export interface MailDelayedEvent extends MailEventBase {
	readonly type: 'delayed';
}

/**
 * Open and click tracking. **Optional**, unlike the four events above: a
 * provider sends them only when tracking is turned on (a pixel, rewritten
 * links), and `tracking` marks that — a caller can tell the two families
 * apart with `'tracking' in event` without a type-by-type list.
 */
interface MailTrackingEventBase extends MailEventBase {
	readonly tracking: true;
}

/** The recipient's mail client opened the message (loaded the tracking pixel). */
export interface MailOpenedEvent extends MailTrackingEventBase {
	readonly type: 'opened';
}

/** The recipient clicked a link in the message. */
export interface MailClickedEvent extends MailTrackingEventBase {
	readonly type: 'clicked';
	/** The URL clicked, when the provider reports one. */
	readonly url: string | null;
}

/** What a provider's webhook reports, mapped to one shape. */
export type MailEvent =
	| MailDeliveredEvent
	| MailBouncedEvent
	| MailComplainedEvent
	| MailDelayedEvent
	| MailOpenedEvent
	| MailClickedEvent;

/**
 * What a webhook subpath refuses before it will answer a {@link MailEvent}:
 * the *request* could not be trusted, never the event itself (an unknown
 * event type is `null`, not a throw).
 *
 * Both codes mean the same thing to a handler — refuse with `401`, and never
 * retry: a signature is either fixed by using the right raw body and secret,
 * or the request was never a genuine webhook. `code` stays a distinct field
 * (never two classes) because nothing here branches on which one it is;
 * `code` is for logging.
 */
export type MailWebhookErrorCode = 'INVALID_SIGNATURE' | 'EXPIRED_TIMESTAMP';

/**
 * A webhook request a `verify` refused: the signature did not match, a
 * header was missing, or the timestamp was outside the tolerance. As with
 * every call-time refusal in this repository, a message names **where**,
 * never a value — a signature or a secret is a credential.
 */
export class MailWebhookRefused extends Error {
	override name = 'MailWebhookRefused';
	readonly code: MailWebhookErrorCode;

	constructor(
		code: MailWebhookErrorCode,
		message: string,
		options?: { readonly cause?: unknown },
	) {
		super(message, { cause: options?.cause });
		this.code = code;
	}
}
