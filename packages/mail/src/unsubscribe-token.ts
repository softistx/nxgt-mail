import { createHmac, timingSafeEqual } from 'node:crypto';

/** What a token can carry: any JSON-serialisable value except `null`. */
export type UnsubscribeClaims =
	| string
	| number
	| boolean
	| readonly UnsubscribeClaims[]
	| { readonly [key: string]: UnsubscribeClaims | null };

// Bump when the token's layout changes; a verifier answers null for any other.
const VERSION = 1;
const MIN_SECRET_LENGTH = 32;

function checkSecret(secret: unknown, name: string): asserts secret is string {
	if (typeof secret !== 'string' || secret.length < MIN_SECRET_LENGTH) {
		throw new TypeError(
			`${name}: the secret must be a string of at least ${MIN_SECRET_LENGTH} characters`,
		);
	}
}

const sign = (secret: string, body: string): Buffer =>
	createHmac('sha256', secret).update(body).digest();

/**
 * A signed, URL-safe token for a one-click unsubscribe link:
 * `base64url(claims).base64url(HMAC-SHA256)`. The claims are anything JSON
 * holds except `null` — who unsubscribes, from what. They are signed, **not
 * encrypted**: anyone holding the token can read them. The token has no
 * expiry, since the link in an old e-mail must keep working, so claim only
 * what switches mail off.
 *
 * ```ts
 * const token = signUnsubscribeToken({ user: 'u_1', list: 'news' }, process.env.UNSUBSCRIBE_SECRET);
 * listUnsubscribe({ url: `https://example.com/unsubscribe?token=${token}` });
 * ```
 *
 * Throws a `TypeError` for a secret shorter than 32 characters and for claims
 * JSON cannot hold (`undefined`, `null`, a function, a cycle). Its message
 * never quotes the secret.
 */
export function signUnsubscribeToken(
	claims: UnsubscribeClaims,
	secret: string,
): string {
	checkSecret(secret, 'signUnsubscribeToken');
	let json: string | undefined;
	try {
		json = claims === null ? undefined : JSON.stringify(claims);
	} catch {
		json = undefined;
	}
	if (json === undefined) {
		throw new TypeError(
			'signUnsubscribeToken: claims must be a JSON-serialisable value other than null',
		);
	}
	const body = Buffer.from(`[${VERSION},${json}]`).toString('base64url');
	return `${body}.${sign(secret, body).toString('base64url')}`;
}

/**
 * The claims of a token this secret signed, or `null` for anything else — a
 * forged, tampered, truncated or malformed token, or another secret's. The
 * signature is compared in constant time. The claims come back as written:
 * narrow them before you trust their shape.
 *
 * Throws a `TypeError` for a secret shorter than 32 characters, which is a
 * mistake in the code, not in the token.
 */
export function verifyUnsubscribeToken<
	T extends UnsubscribeClaims = UnsubscribeClaims,
>(token: string, secret: string): T | null {
	checkSecret(secret, 'verifyUnsubscribeToken');
	if (typeof token !== 'string') return null;
	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const [body, signature] = parts as [string, string];
	const expected = sign(secret, body);
	const given = Buffer.from(signature, 'base64url');
	if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
		return null;
	}
	try {
		const parsed: unknown = JSON.parse(
			Buffer.from(body, 'base64url').toString('utf8'),
		);
		if (
			!Array.isArray(parsed) ||
			parsed.length !== 2 ||
			parsed[0] !== VERSION
		) {
			return null;
		}
		const claims: unknown = parsed[1];
		return claims === null || claims === undefined ? null : (claims as T);
	} catch {
		return null;
	}
}
