import { MailRefused } from './errors';
import { ADDRESS } from './message';

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

// Inside `<…>` in a header: no whitespace or control character (a line break
// would end the header), no `<` or `>` (they end the URL), and no `,`, which
// RFC 2369 reads as the next URL — percent-encode it.
const URL_REFUSED = /[\s\p{Cc}<>,]/u;

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
 * that is not `https:` — RFC 8058 requires it — or holds whitespace, `<`,
 * `>` or `,`, and a `mailto` that is not a bare e-mail address. The URL is
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
		URL_REFUSED.test(options.url) ||
		!URL.canParse(options.url) ||
		new URL(options.url).protocol !== 'https:'
	) {
		throw new MailRefused(
			'listUnsubscribe: url must be an https: URL without whitespace, <, > or a raw comma',
		);
	}
	if (options.mailto !== undefined && !ADDRESS.test(options.mailto)) {
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
