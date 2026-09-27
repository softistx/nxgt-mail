import type { MailAttachment, Mailer } from '../types';

/**
 * What the receiving end got, as the harness reads it back: from the test
 * SMTP server, from the recorded HTTP request, from the memory outbox.
 */
export interface DeliveredMail {
	/** The bare addresses of every recipient, in order. */
	readonly to: readonly string[];
	readonly subject: string;
	readonly html: string;
	readonly text: string;
	/**
	 * The files that arrived with it, in order, each with its bytes, its name
	 * and its type as the receiving end read them — `[]` when none did.
	 *
	 * Optional, so a harness written before attachments still compiles; but
	 * **its absence is reported, never passed over**: `send.attachment` fails
	 * on a harness that leaves it out, until it reads them back or skips the
	 * case with a reason.
	 */
	readonly attachments?: readonly MailAttachment[];
}

/**
 * How the suite makes a transport fail **the way its provider fails**: a
 * refused connection or a 5xx for an outage, a 4xx "malformed message" for a
 * refusal. Not a decorator that throws in front of the transport — that would
 * prove the decorator, and not the transport's translation.
 *
 * Optional, and **its absence is reported, never passed over**: without it,
 * the failure cases are skipped with a reason in their name.
 */
export interface MailerFaults {
	/** Makes the next hand-over fail as an outage, or as a refusal of the message. */
	failNext(kind: 'outage' | 'refusal'): Promise<void>;
	/**
	 * How many hand-overs the receiving end saw, failed ones included. This is
	 * what proves a transport does not retry in secret.
	 */
	attempts(): Promise<number>;
}

/** One transport, opened for one case. */
export interface OpenedMailer {
	readonly mailer: Mailer;
	/** Every message the receiving end accepted, oldest first. */
	delivered(): Promise<readonly DeliveredMail[]>;
	readonly faults?: MailerFaults;
	/** Called after the case, pass or fail. */
	close?(): Promise<void>;
}

/**
 * Opens a **fresh** transport and receiving end — once per case, so no case
 * sees another's messages.
 */
export interface MailerHarness {
	open(): Promise<OpenedMailer>;
}

/** What a case runs against. */
export interface MailerCaseContext {
	readonly mailer: Mailer;
	delivered(): Promise<readonly DeliveredMail[]>;
	readonly faults: MailerFaults | null;
}

/**
 * One conformance case, as **data**: `run` throws on failure and resolves on
 * success, so it runs under any test runner, or none.
 */
export interface MailerCase {
	/** Unique, stable: `send.deliversBytes`, `failure.outage`. */
	readonly id: string;
	/** What the case proves, as a sentence. */
	readonly title: string;
	/** `'faults'` when the case can only run with {@link MailerFaults}. */
	readonly needs?: 'faults';
	run(context: MailerCaseContext): Promise<void>;
}

/** The two functions of a test runner the suite needs: bun:test, vitest and jest all have them. */
export interface MailerRunner {
	describe(name: string, body: () => void): void;
	it: {
		(name: string, body: () => Promise<void>): void;
		skip(name: string, body: () => Promise<void>): void;
	};
}
