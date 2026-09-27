import { type MailError, MailFailure, MailRefused } from './errors';
import { checkMessage } from './message';
import type { Address, Mailer, MailMessage, SentMail } from './types';

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
 *
 * It honours `idempotencyKey`, as Resend does: the same message again under a
 * key it already delivered resolves with that delivery's `messageId`, and is
 * not delivered again; a different message under that key is a
 * {@link MailRefused}. A send that failed delivered nothing, so its key stays
 * free.
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
	/** Forgets what was sent, the attempts, any queued failure, and the idempotency keys. */
	clear(): void;
}

/**
 * A copy of `message` the caller cannot change afterwards. Each attachment's
 * bytes are copied to a plain `Uint8Array` of their own: a `Buffer` from
 * Node's pool is a view on a larger, shared buffer, which a clone would copy
 * whole.
 */
function copyOf(message: MailMessage): MailMessage {
	const { attachments, ...rest } = message;
	const copy = structuredClone(rest);
	if (attachments === undefined) return copy;
	return {
		...copy,
		attachments: attachments.map((attachment) => ({
			filename: attachment.filename,
			content: new Uint8Array(attachment.content),
			contentType: attachment.contentType,
		})),
	};
}

/** Bytes as hex: short to compare, whatever holds them. */
const hexOf = (bytes: Uint8Array) =>
	Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

/**
 * What makes two messages the same one, for an idempotency key: the fields of
 * the port, read by name as `checkMessage` reads them — so a field on a
 * prototype counts and a field the port does not know does not — in one
 * form, however the object was written: `to` as one address or a list of
 * one, no `headers` or `attachments` or an empty one, headers in any order,
 * bytes in a `Buffer` or a plain `Uint8Array`.
 */
function fingerprintOf(message: MailMessage): string {
	const address = (value: Address | undefined) =>
		typeof value === 'object' ? [value.name, value.address] : value;
	const to = Array.isArray(message.to) ? message.to : [message.to];
	const headers = Object.entries(message.headers ?? {}).sort(([a], [b]) =>
		a < b ? -1 : a > b ? 1 : 0,
	);
	return JSON.stringify([
		to.map(address),
		address(message.from),
		address(message.replyTo),
		message.subject,
		message.html,
		message.text,
		headers,
		(message.attachments ?? []).map((file) => [
			file.filename,
			file.contentType,
			hexOf(file.content),
		]),
	]);
}

/** Creates a {@link MemoryMailer}. Message ids are `memory-1`, `memory-2`, … */
export function createMemoryMailer(): MemoryMailer {
	let sent: MemoryMail[] = [];
	let failures: MailError[] = [];
	let attempts = 0;
	let counter = 0;
	let keys = new Map<string, { messageId: string; fingerprint: string }>();

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
			keys = new Map();
		},
		async send(message): Promise<SentMail> {
			checkMessage(message);
			attempts += 1;
			const failure = failures.shift();
			if (failure !== undefined) throw failure;

			const key = message.idempotencyKey;
			const fingerprint = key === undefined ? '' : fingerprintOf(message);
			const delivered = key === undefined ? undefined : keys.get(key);
			if (delivered !== undefined) {
				if (delivered.fingerprint !== fingerprint) {
					throw new MailRefused(
						'send: idempotencyKey was already used for a different message — a key names one e-mail',
					);
				}
				return { messageId: delivered.messageId };
			}

			counter += 1;
			const messageId = `memory-${counter}`;
			sent.push({ ...copyOf(message), messageId });
			if (key !== undefined) keys.set(key, { messageId, fingerprint });
			return { messageId };
		},
	};
}
