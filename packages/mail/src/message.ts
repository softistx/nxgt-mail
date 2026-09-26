import { MailRefused } from './errors';
import type { Address, MailMessage } from './types';

const LINE_BREAK = /[\r\n]/;
// Deliberately loose: one `@`, something on each side, no whitespace and no
// angle bracket. Whether the mailbox exists is the receiving server's
// question; this only refuses what would break a header.
const ADDRESS = /^[^\s@<>]+@[^\s@<>]+$/;
const HEADER_NAME = /^[A-Za-z0-9-]+$/;

/** Every recipient of a message, as bare addresses, in order. */
export function recipientsOf(message: MailMessage): string[] {
	const to = Array.isArray(message.to) ? message.to : [message.to];
	return to.map(addressOf);
}

/** The bare address of an {@link Address}. */
export function addressOf(address: Address): string {
	return typeof address === 'string' ? address : address.address;
}

function checkAddress(address: Address | undefined, where: string): void {
	if (address === undefined) return;
	if (typeof address === 'string') {
		if (!ADDRESS.test(address)) {
			throw new MailRefused(`send: ${where} is not an e-mail address`);
		}
		return;
	}
	if (typeof address !== 'object' || address === null) {
		throw new MailRefused(`send: ${where} is not an e-mail address`);
	}
	if (typeof address.address !== 'string' || !ADDRESS.test(address.address)) {
		throw new MailRefused(`send: ${where}.address is not an e-mail address`);
	}
	if (typeof address.name !== 'string' || LINE_BREAK.test(address.name)) {
		throw new MailRefused(
			`send: ${where}.name must be a string without a line break`,
		);
	}
}

/**
 * Refuses a message no transport should hand over, with a {@link MailRefused}
 * that names **where** the problem is and never the value.
 *
 * A transport calls it first thing in `send`, so the refusals are the same
 * whichever transport is wired. It checks:
 *
 * - at least one recipient, each one an address;
 * - `from` and `replyTo`, when present, are addresses;
 * - `subject`, `html` and `text` are strings, and `subject` holds no line
 *   break — a line break in a subject is a header injection;
 * - every header name is letters, digits and hyphens, and no header value
 *   holds a line break.
 */
export function checkMessage(message: MailMessage): void {
	if (typeof message !== 'object' || message === null) {
		throw new MailRefused('send: the message must be an object');
	}
	const to = Array.isArray(message.to) ? message.to : [message.to];
	if (to.length === 0) {
		throw new MailRefused('send: to must hold at least one address');
	}
	to.forEach((address, index) => {
		checkAddress(address, Array.isArray(message.to) ? `to[${index}]` : 'to');
	});
	checkAddress(message.from, 'from');
	checkAddress(message.replyTo, 'replyTo');

	for (const part of ['subject', 'html', 'text'] as const) {
		if (typeof message[part] !== 'string') {
			throw new MailRefused(`send: ${part} must be a string`);
		}
	}
	if (LINE_BREAK.test(message.subject)) {
		throw new MailRefused('send: subject must not hold a line break');
	}

	for (const [name, value] of Object.entries(message.headers ?? {})) {
		if (!HEADER_NAME.test(name)) {
			throw new MailRefused(
				'send: a header name must be letters, digits and hyphens',
			);
		}
		if (typeof value !== 'string' || LINE_BREAK.test(value)) {
			throw new MailRefused(
				`send: header ${name} must be a string without a line break`,
			);
		}
	}
}
