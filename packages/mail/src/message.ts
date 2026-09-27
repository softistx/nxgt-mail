import { MailRefused } from './errors';
import type { Address, MailAttachment, MailMessage } from './types';

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

// A file name is shown and saved by the recipient's mail client: no path
// separator and no `.` or `..` (a client that saves it as is writes
// elsewhere), no line break or other control character, C1 included (a header
// could be split on one), and no format character — a right-to-left override
// disguises `fdp.exe` as `exe.pdf`.
const FILENAME_REFUSED = /[/\\\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;
const DOT_NAME = /^\.\.?$/;
// RFC 2045: type "/" subtype, each a token — any printable ASCII but space
// and the tspecials ()<>@,;:\"/[]?=. No parameters: a charset or a name
// there would be a second, unchecked place to write the file's name.
const CONTENT_TYPE =
	/^[!#$%&'*+.^_`{|}~0-9A-Za-z-]+\/[!#$%&'*+.^_`{|}~0-9A-Za-z-]+$/;
// multipart/* and message/* are MIME containers, not files: nodemailer writes
// them unencoded, and the receiving end reads back no attachment at all.
const CONTAINER_TYPE = /^(?:multipart|message)\//i;
// Written into a header by the transports that use it (Resend's
// `Idempotency-Key`): visible ASCII only, so no line break, and Resend's length.
const IDEMPOTENCY_KEY = /^[\x21-\x7E]{1,256}$/;

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

/** Refuses `attachment` unless it is a {@link MailAttachment}. */
function checkAttachment(attachment: MailAttachment, where: string): void {
	if (typeof attachment !== 'object' || attachment === null) {
		throw new MailRefused(
			`send: ${where} must be an object, as { filename, content, contentType }`,
		);
	}
	if (!(attachment.content instanceof Uint8Array)) {
		throw new MailRefused(
			`send: ${where}.content must be a Uint8Array — the file's bytes, never a path or a URL`,
		);
	}
	if (
		typeof attachment.filename !== 'string' ||
		attachment.filename === '' ||
		DOT_NAME.test(attachment.filename) ||
		FILENAME_REFUSED.test(attachment.filename)
	) {
		throw new MailRefused(
			`send: ${where}.filename must be a file name — not empty, not . or .., without / or \\, a line break or a control character`,
		);
	}
	if (
		typeof attachment.contentType !== 'string' ||
		!CONTENT_TYPE.test(attachment.contentType) ||
		CONTAINER_TYPE.test(attachment.contentType)
	) {
		throw new MailRefused(
			`send: ${where}.contentType must be a file's type/subtype, as application/pdf — never multipart/* or message/*`,
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
 *   any case), and no header value holds a line break;
 * - `attachments`, when present, is an array without holes — empty is the
 *   same as absent — and each entry has its bytes as a `Uint8Array`, a
 *   `filename` that is not empty, `.` or `..` and holds no `/`, `\`, line
 *   break, control or format character, and a `contentType` that is a bare
 *   `type/subtype`, never `multipart/*` or `message/*`;
 * - `idempotencyKey`, when present, is 1 to 256 visible ASCII characters.
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

	if (message.attachments !== undefined) {
		if (!Array.isArray(message.attachments)) {
			throw new MailRefused('send: attachments must be an array');
		}
		// Indexed, not forEach: a hole in the array is refused, not skipped.
		for (let index = 0; index < message.attachments.length; index++) {
			checkAttachment(message.attachments[index], `attachments[${index}]`);
		}
	}

	if (
		message.idempotencyKey !== undefined &&
		(typeof message.idempotencyKey !== 'string' ||
			!IDEMPOTENCY_KEY.test(message.idempotencyKey))
	) {
		throw new MailRefused(
			'send: idempotencyKey must be 1 to 256 visible ASCII characters, as order-42/receipt',
		);
	}
}
