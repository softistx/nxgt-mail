/**
 * An e-mail address: bare (`ada@example.com`), or with the name a mail client
 * shows beside it.
 *
 * A string is **only** an address — `"Ada <ada@example.com>"` is refused, and
 * so is a string holding whitespace, `,`, `;` or `:` — so a transport never
 * has to parse one, and a parser that does finds one mailbox. A name is free text (`Doe, John` is a
 * name), refused only when it holds a line break; **quoting or encoding it
 * is the transport's job**, and the conformance case `send.hostileName`
 * fails a transport whose name lets a second recipient through.
 */
export type Address =
	| string
	| { readonly name: string; readonly address: string };

/**
 * The three parts of one e-mail, in one locale, with every value already
 * filled in and escaped: what the run-time renderer answers
 * (`createMailRenderer(…).render(…)`), or any hand-written function answering the
 * same shape — escaping is then that function's job.
 */
export interface Rendered {
	readonly subject: string;
	readonly html: string;
	readonly text: string;
}

/**
 * A file sent with an e-mail, **as bytes**: never a path or a URL for the
 * transport to read, never a stream. A large or sensitive file is a signed
 * link in the template instead — a URL variable.
 *
 * `filename` is what the recipient's mail client shows and saves it as: no
 * path (`/`, `\`, `.`, `..`), no line break, no control or format character.
 * `contentType` is a bare `type/subtype`, as `application/pdf`, without
 * parameters, and never a MIME container (`multipart/*`, `message/*`).
 */
export interface MailAttachment {
	readonly filename: string;
	readonly content: Uint8Array;
	readonly contentType: string;
	/**
	 * Makes the file an **inline image**: the HTML shows it with
	 * `<img src="cid:logo@acme.test">`, where `logo@acme.test` is this id —
	 * the file's `Content-ID` (RFC 2392), written without its angle brackets.
	 *
	 * 1 to 127 characters: letters, digits and `.` `_` `~` `+` `-`, with at
	 * most one `@` between two such runs, as `logo` or `logo@acme.test` — so
	 * the `cid:` URL is the id as is, with nothing to percent-encode. Unique
	 * among the message's attachments, compared as written.
	 *
	 * Every `cid:` URL the HTML uses — an attribute value, quoted or not
	 * (`src="cid:…"`, `background=cid:…`), or a CSS `url(cid:…)` — must name
	 * an attachment's `contentId`, percent-decoded as RFC 2392 says, or
	 * `checkMessage` refuses the message: otherwise a broken image is sent,
	 * and nobody hears of it. A `cid:` in prose is not read. An attachment whose id the HTML never
	 * names is sent all the same; a mail client usually lists it as a file.
	 */
	readonly contentId?: string;
}

/**
 * A rendered e-mail, addressed. What a {@link Mailer} sends.
 *
 * `from` is optional because a transport is usually wired with a default
 * sender; a transport with none refuses a message without one.
 */
export interface MailMessage extends Rendered {
	readonly to: Address | readonly Address[];
	readonly from?: Address;
	readonly replyTo?: Address;
	/**
	 * Extra headers, such as `List-Unsubscribe`. A name is letters, digits and
	 * hyphens; neither a name nor a value may hold a line break. What the
	 * transport writes from the message — `To`, `Cc`, `Bcc`, `From`, `Sender`,
	 * `Reply-To`, `Return-Path`, `Subject`, `MIME-Version`, `Content-*`, in any
	 * case — is refused.
	 */
	readonly headers?: Readonly<Record<string, string>>;
	/**
	 * Files sent with the e-mail, in order. An empty list is the same as none.
	 * Each is bytes, checked by `checkMessage`: see {@link MailAttachment}.
	 */
	readonly attachments?: readonly MailAttachment[];
	/**
	 * Names this send, so sending it again — a retry after a timeout, a job run
	 * twice — delivers it once. 1 to 256 visible ASCII characters, as
	 * `order-42/receipt`; derive it from what the e-mail is about, never from
	 * the time or a random value, or a retry carries a new one.
	 *
	 * **A transport that can deduplicate uses it; one that cannot ignores it.**
	 * Resend keeps a key for 24 hours; SMTP has no such thing, and ignores it.
	 * The memory mailer answers the same message under a key it already
	 * delivered with the same `messageId`, and delivers nothing more; a
	 * different message under that key is a `MailRefused`, as Resend's `409`.
	 */
	readonly idempotencyKey?: string;
	/**
	 * Labels this send for the provider's dashboard, webhooks and statistics —
	 * what the e-mail is (`category: 'passwordReset'`), who it is for
	 * (`plan: 'enterprise'`). A name maps to a value; each is 1 to 256 ASCII
	 * letters, digits, `_` or `-`, the rule Resend and Amazon SES share.
	 *
	 * **Never part of the e-mail.** A transport whose provider takes tags sends
	 * them there (Resend's `tags`); one whose provider has none ignores them,
	 * as SMTP does. They reach the provider's logs, so a tag holds no secret
	 * and no personal data: an id, never an address.
	 */
	readonly tags?: Readonly<Record<string, string>>;
	/**
	 * Sends the message later, at this moment, instead of now. Refused with
	 * `MailRefused` unless it is a valid `Date`, no earlier than now (a small
	 * tolerance for clock skew between the caller and the transport), and no
	 * later than 30 days ahead — Resend's own limit, "Emails can be scheduled
	 * up to 30 days in advance"
	 * (https://resend.com/docs/dashboard/emails/schedule-email) — held by
	 * `checkMessage` for every transport, so a message built for one works on
	 * another.
	 *
	 * **A transport that cannot schedule refuses the message rather than
	 * sending it now**: SMTP has no such thing, and sending early would be
	 * wrong. `@nxgt/mail-resend` sends it as Resend's `scheduled_at`, ISO
	 * 8601 — Resend still answers an id right away, the e-mail itself going
	 * out later; cancelling one already accepted is Resend's
	 * `POST /emails/{id}/cancel`, out of scope here, no package wraps it yet.
	 * The memory mailer records it on the delivered message.
	 */
	readonly scheduledAt?: Date;
}

/** What a transport answers once it has handed a message over. */
export interface SentMail {
	/**
	 * The id the transport gave the message, or `null` when it gives none. An
	 * absence, not a failure: a failure throws.
	 */
	readonly messageId: string | null;
}

/**
 * The port every transport implements.
 *
 * **A failure throws; it never answers.** `send` resolves only once the
 * transport has accepted the message. Otherwise it rejects with a
 * {@link MailFailure} (the transport could not be reached or did not answer)
 * or a {@link MailRefused} (the message itself was refused). It never resolves
 * `false`, and it never logs and resolves: a caller that maps a failed send to
 * "sent" has told a user to check an inbox that will stay empty.
 *
 * `@nxgt/mail/conformance` checks a transport against this contract.
 */
export interface Mailer {
	send(message: MailMessage): Promise<SentMail>;
}
