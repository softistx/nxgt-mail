import { MailRefused } from './errors';
import type { Address, MailMessage } from './types';

const LINE_BREAK = /[\r\n]/;
// Deliberately loose: one `@`, something on each side, and none of what an
// address list parser reads as structure — whitespace, `<` `>` (a display
// name), `,` `;` (a second address), `:` (a group). A provider that parses
// the string then finds one mailbox, the one checked. Whether the mailbox
// exists is the receiving server's question.
const ADDRESS = /^[^\s@<>,;:]+@[^\s@<>,;:]+$/;
const HEADER_NAME = /^[A-Za-z0-9-]+$/;
// The headers a transport writes from the message: the addresses, the subject
// and the MIME structure. Set through `headers`, a Bcc reaches an SMTP
// envelope unchecked, and a Content-Type rewrites how the parts are read.
const RESERVED_HEADER =
	/^(?:to|cc|bcc|from|sender|reply-to|return-path|subject|mime-version|content-.*)$/i;

/** Every recipient of a message, as bare addresses, in order. */
export function recipientsOf(message: MailMessage): string[] {
	const to = Array.isArray(message.to) ? message.to : [message.to];
	return to.map(addressOf);
}

/** The bare address of an {@link Address}. */
export function addressOf(address: Address): string {
	return typeof address === 'string' ? address : address.address;
}

/** Refuses `address` unless it is an {@link Address}. `undefined` is refused too. */
function checkAddress(address: Address | undefined, where: string): void {
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
 * - every header name is letters, digits and hyphens, none names what the
 *   transport writes from the message (`To`, `Cc`, `Bcc`, `From`, `Sender`,
 *   `Reply-To`, `Return-Path`, `Subject`, `MIME-Version`, `Content-*`, in
 *   any case), and no header value holds a line break.
 */
export function checkMessage(message: MailMessage): void {
	if (typeof message !== 'object' || message === null) {
		throw new MailRefused('send: the message must be an object');
	}
	if (message.to === undefined || message.to === null) {
		throw new MailRefused('send: to must hold at least one address');
	}
	const to = Array.isArray(message.to) ? message.to : [message.to];
	if (to.length === 0) {
		throw new MailRefused('send: to must hold at least one address');
	}
	to.forEach((address, index) => {
		checkAddress(address, Array.isArray(message.to) ? `to[${index}]` : 'to');
	});
	if (message.from !== undefined) checkAddress(message.from, 'from');
	if (message.replyTo !== undefined) checkAddress(message.replyTo, 'replyTo');

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
		if (RESERVED_HEADER.test(name)) {
			throw new MailRefused(
				`send: header ${name} is reserved — addresses, the subject and the MIME structure are never custom headers`,
			);
		}
		if (typeof value !== 'string' || LINE_BREAK.test(value)) {
			throw new MailRefused(
				`send: header ${name} must be a string without a line break`,
			);
		}
	}
}
