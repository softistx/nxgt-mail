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
// RFC 2392: a `cid:` URL is `cid:` and the Content-ID without its angle
// brackets, an addr-spec, percent-encoded. Only the characters a URL takes as
// they are, and at most one `@` between two runs of them: the URL is then the
// id as written, and the header holds nothing to quote. At most 127
// characters: Resend takes "less than 128".
const CONTENT_ID = /^[A-Za-z0-9._~+-]+(?:@[A-Za-z0-9._~+-]+)?$/;
const CONTENT_ID_MAX = 127;
// A `cid:` URL where the HTML uses one: an attribute value, quoted or not
// (`src="cid:…"`, `background=cid:…`), or a CSS `url(…)`, quoted or not. The
// scheme is case-insensitive. A `cid:` in prose is not a reference.
const CID_REFERENCE =
	/(?:=|url\()\s*(?:"cid:([^"]*)"|'cid:([^']*)'|cid:([^\s"'<>)]*))/gi;
// What ends the URL inside a value: a `srcset` descriptor (`cid:logo 2x`).
const CID_URL_END = /[\s,]/;
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
	if (
		attachment.contentId !== undefined &&
		(typeof attachment.contentId !== 'string' ||
			attachment.contentId.length > CONTENT_ID_MAX ||
			!CONTENT_ID.test(attachment.contentId))
	) {
		throw new MailRefused(
			`send: ${where}.contentId must be 1 to 127 letters, digits and . _ ~ + -, with at most one @, as logo@acme.test`,
		);
	}
}

/**
 * The content id a `cid:` URL names: RFC 2392 percent-encodes it, so
 * `cid:logo%40acme.test` names `logo@acme.test`. A malformed escape names
 * nothing.
 */
function contentIdOf(url: string): string {
	const [id = ''] = url.split(CID_URL_END);
	try {
		return decodeURIComponent(id);
	} catch {
		return '';
	}
}

/**
 * Refuses two attachments under one `contentId`, and a `cid:` URL the HTML
 * uses — an attribute value or a CSS `url()` — that no attachment's
 * `contentId` names.
 */
function checkInlineImages(message: MailMessage): void {
	const ids = new Set<string>();
	(message.attachments ?? []).forEach((attachment, index) => {
		if (attachment.contentId === undefined) return;
		if (ids.has(attachment.contentId)) {
			throw new MailRefused(
				`send: attachments[${index}].contentId is already another attachment's — a contentId names one file`,
			);
		}
		ids.add(attachment.contentId);
	});
	for (const [, doubled, single, bare] of message.html.matchAll(
		CID_REFERENCE,
	)) {
		if (!ids.has(contentIdOf(doubled ?? single ?? bare ?? ''))) {
			throw new MailRefused(
				"send: html shows a cid: URL that no attachment's contentId names — attach the image with that contentId",
			);
		}
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
 *   `type/subtype`, never `multipart/*` or `message/*`, and a `contentId`,
 *   when present, of 1 to 127 letters, digits and `.` `_` `~` `+` `-` with at
 *   most one `@`, unique among the attachments;
 * - every `cid:` URL `html` uses — an attribute value, quoted or not, or a
 *   CSS `url()` — names an attachment's `contentId`, percent-decoded as RFC
 *   2392 says;
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
	checkInlineImages(message);

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
