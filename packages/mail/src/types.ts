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
