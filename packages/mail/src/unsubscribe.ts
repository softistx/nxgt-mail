import { MailRefused } from './errors';

/** Where a recipient unsubscribes: the one-click URL, and an address as well. */
export interface ListUnsubscribeOptions {
	/**
	 * The `https:` URL a mail client POSTs `List-Unsubscribe=One-Click` to —
	 * one per recipient, carrying what identifies them, as
	 * `https://example.com/unsubscribe?token=…`. It unsubscribes on that POST
	 * alone: no login, no confirmation page, no redirect.
	 */
	readonly url: string;
	/** An address that unsubscribes whoever writes to it, for clients that only send mail. */
	readonly mailto?: string;
}

/**
 * The two headers of RFC 8058's one-click unsubscribe. A type, not an
 * interface: an interface has no index signature, and would not go into
 * `headers` as it is.
 */
export type ListUnsubscribeHeaders = {
	readonly 'List-Unsubscribe': string;
	readonly 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click';
};

// RFC 2369 wants an RFC 3986 URI inside `<…>`: printable ASCII only — a
// transport would encode a header holding anything else, and no client
// would find the URL in it — and none of what ends the URL (`<`, `>`), what
// RFC 2369 reads as the next one (`,`), or what no URI holds as is (quotes,
// a backslash, braces, `|`, `^`). Percent-encode it.
const URL_ALLOWED = /^https:\/\/[\x21-\x7E]+$/;
const URL_REFUSED = /[<>,"'`\\{}|^]/;
// RFC 6068 reads `?`, `&`, `=`, `#` and `%` inside a mailto: as structure — a
// subject, a second recipient — so the address is plain ASCII without them.
const MAILTO = /^[A-Za-z0-9._~!$'*+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

/**
 * The headers that give an e-mail Gmail's and Yahoo's one-click unsubscribe
 * (RFC 8058, with RFC 2369's `List-Unsubscribe`), to spread into a message's
 * `headers`:
 *
 * ```ts
 * await mailer.send({
 *   ...rendered,
 *   to: user.email,
 *   headers: listUnsubscribe({ url: `https://example.com/unsubscribe?token=${token}` }),
 * });
 * ```
 *
 * Refuses, with a {@link MailRefused} that never quotes the value, a `url`
 * that is not `https://` — RFC 8058 requires it — or is not printable ASCII,
 * carries a user or a password, or holds `<`, `>`, a quote or a raw `,`; and
 * a `mailto` that is not a bare ASCII address. The URL is
 * often built from a token, and a token is a credential: the message names
 * the rule, not the link.
 */
export function listUnsubscribe(
	options: ListUnsubscribeOptions,
): ListUnsubscribeHeaders {
	if (typeof options !== 'object' || options === null) {
		throw new TypeError(
			'listUnsubscribe: options must be an object, as { url }',
		);
	}
	if (typeof options.url !== 'string') {
		throw new TypeError('listUnsubscribe: url must be a string');
	}
	if (options.mailto !== undefined && typeof options.mailto !== 'string') {
		throw new TypeError('listUnsubscribe: mailto must be a string');
	}
	if (
		!URL_ALLOWED.test(options.url) ||
		URL_REFUSED.test(options.url) ||
		!URL.canParse(options.url) ||
		// A user and a password in a header every relay and recipient reads.
		new URL(options.url).username !== '' ||
		new URL(options.url).password !== ''
	) {
		throw new MailRefused(
			'listUnsubscribe: url must be an https:// URL in printable ASCII, without credentials, <, >, quotes or a raw comma',
		);
	}
	if (options.mailto !== undefined && !MAILTO.test(options.mailto)) {
		throw new MailRefused(
			'listUnsubscribe: mailto must be a bare e-mail address, as unsubscribe@example.com',
		);
	}
	const mailto =
		options.mailto === undefined ? '' : `, <mailto:${options.mailto}>`;
	return {
		'List-Unsubscribe': `<${options.url}>${mailto}`,
		'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
	};
}
