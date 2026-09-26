import { type MailError, MailFailure } from './errors';
import { checkMessage } from './message';
import type { Mailer, MailMessage, SentMail } from './types';

/** One message the memory mailer accepted, with the id it gave it. */
export interface MemoryMail extends MailMessage {
	readonly messageId: string;
}

/**
 * The reference transport: it keeps what it sends in memory, for tests.
 *
 * It refuses exactly what every transport refuses (it calls
 * {@link checkMessage}), and it can be told to fail, so a test can prove what
 * the application does when a send throws.
 */
export interface MemoryMailer extends Mailer {
	/** Every message accepted so far, oldest first. A copy: mutating it changes nothing. */
	readonly sent: readonly MemoryMail[];
	/**
	 * How many sends reached the hand-over, failed ones included. A message
	 * refused as malformed never reaches it. A caller that retries in secret
	 * shows up here.
	 */
	readonly attempts: number;
	/**
	 * Makes the next send that reaches the hand-over reject with `error`, by
	 * default a {@link MailFailure} as an outage would. Calls queue: two calls
	 * fail the next two sends.
	 */
	failNext(error?: MailError): void;
	/** Forgets what was sent, the attempts, and any queued failure. */
	clear(): void;
}

/** Creates a {@link MemoryMailer}. Message ids are `memory-1`, `memory-2`, … */
export function createMemoryMailer(): MemoryMailer {
	let sent: MemoryMail[] = [];
	let failures: MailError[] = [];
	let attempts = 0;
	let counter = 0;

	return {
		get sent() {
			return sent.map((mail) => structuredClone(mail));
		},
		get attempts() {
			return attempts;
		},
		failNext(error) {
			failures.push(
				error ??
					new MailFailure(
						'send: the memory mailer was told to fail this send',
						{
							cause: new Error('memory mailer: failNext'),
						},
					),
			);
		},
		clear() {
			sent = [];
			failures = [];
			attempts = 0;
		},
		async send(message): Promise<SentMail> {
			checkMessage(message);
			attempts += 1;
			const failure = failures.shift();
			if (failure !== undefined) throw failure;

			counter += 1;
			const messageId = `memory-${counter}`;
			sent.push({ ...structuredClone(message), messageId });
			return { messageId };
		},
	};
}
