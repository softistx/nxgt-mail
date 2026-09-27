/**
 * `@nxgt/mail-resend/webhooks` — verifies a Resend webhook and answers a
 * neutral `@nxgt/mail` {@link MailEvent}: what happened to a message after
 * `send` handed it over.
 *
 * ```ts
 * import { createResendWebhook } from '@nxgt/mail-resend/webhooks';
 *
 * const webhook = createResendWebhook({ secret: process.env.RESEND_WEBHOOK_SECRET ?? '' });
 *
 * export default {
 *   async fetch(request: Request): Promise<Response> {
 *     const event = await webhook.verify(request); // throws MailWebhookRefused on a bad signature
 *     if (event === null) return new Response(null, { status: 202 }); // an event type this package does not map
 *     if (event.type === 'bounced' && event.bounceType === 'hard') await suppress(event.recipient);
 *     return new Response(null, { status: 202 });
 *   },
 * };
 * ```
 *
 * Resend signs every webhook the way [Svix](https://docs.svix.com) does: the
 * headers `svix-id`, `svix-timestamp` and `svix-signature`, a secret
 * `whsec_…`, HMAC-SHA256 over `${svix-id}.${svix-timestamp}.${body}` — the
 * **raw** body, exactly as sent. `verify` reads it itself (`request.text()`),
 * before anything parses it: a body a framework already turned into JSON has
 * lost the exact bytes the signature was computed over — different key
 * order, different whitespace, a trailing newline dropped — and no longer
 * matches. Give `verify` the raw body, or hand it the `Request` itself and
 * let it read it.
 *
 * Only Web Crypto (`crypto.subtle`, `atob`/`btoa`) — no Node built-in — so
 * this runs on Node, Bun, Deno, and an edge or workers runtime alike.
 *
 * See Resend's [event types](https://resend.com/docs/dashboard/webhooks/event-types)
 * and [verifying requests](https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests),
 * and [Svix's own docs](https://docs.svix.com/receiving/verifying-payloads/how-manual)
 * for the signing algorithm this implements.
 */

import {
	type MailBounceType,
	type MailEvent,
	MailWebhookRefused,
} from '@nxgt/mail';

/** What `createResendWebhook` takes. */
export interface ResendWebhookOptions {
	/** The endpoint's signing secret, `whsec_…`, from Resend's webhook settings. */
	readonly secret: string;
	/** How far `svix-timestamp` may sit from now, either way. Default `300000` (5 minutes), Svix's own tolerance. */
	readonly toleranceMs?: number;
}

/**
 * The three headers `verify` reads, case-insensitively: a `Headers`, or a
 * plain record (Node's own `IncomingHttpHeaders` included — a header repeated
 * as an array answers its first value).
 */
export type MailWebhookHeaders =
	| Headers
	| Readonly<Record<string, string | readonly string[] | undefined>>;

/**
 * What `verify` takes: a `Request` (its raw body is read for you, once), or
 * `{ headers, body }` when your framework has already read the raw body as
 * text — never as parsed JSON; see this module's own documentation above.
 */
export type ResendWebhookRequest =
	| Request
	| { readonly headers: MailWebhookHeaders; readonly body: string };

/** Verifies Resend's webhook signature and answers the neutral event it reports. */
export interface ResendWebhook {
	/**
	 * Verifies `request` and answers the {@link MailEvent} it reports, or
	 * `null` for an event type this package does not map — an absence, never
	 * a throw. Throws {@link MailWebhookRefused} when the request itself
	 * cannot be trusted: a missing or non-matching signature
	 * (`INVALID_SIGNATURE`), or a `svix-timestamp` outside `toleranceMs`
	 * (`EXPIRED_TIMESTAMP`) — a handler answers both with `401`. Throws a
	 * bare `TypeError` for a `request` that is neither a `Request` nor
	 * `{ headers, body }`.
	 */
	verify(request: ResendWebhookRequest): Promise<MailEvent | null>;
}

const DEFAULT_TOLERANCE_MS = 5 * 60 * 1000;
// Resend's own webhook event types this module maps. Anything else — email.sent,
// email.scheduled, email.failed, email.received, email.suppressed, domain.*,
// contact.*, suppression.* — answers `null`: an absence, not a failure.
const EVENT_TYPE_PREFIX = 'email.';

function checkOptions(options: ResendWebhookOptions): void {
	if (typeof options !== 'object' || options === null) {
		throw new TypeError(
			'createResendWebhook: options must be an object, as { secret }',
		);
	}
	if (
		typeof options.secret !== 'string' ||
		!options.secret.startsWith('whsec_') ||
		!isBase64(options.secret.slice('whsec_'.length))
	) {
		throw new TypeError(
			"createResendWebhook: secret must be Resend's signing secret, whsec_… — from the endpoint's settings page",
		);
	}
	if (
		options.toleranceMs !== undefined &&
		!(Number.isInteger(options.toleranceMs) && options.toleranceMs > 0)
	) {
		throw new TypeError(
			'createResendWebhook: toleranceMs must be a positive integer',
		);
	}
}

// What `atob` accepts: standard base64, optionally padded. Checked before the
// first `atob` call, so a malformed secret is a TypeError at wiring — never
// the DOMException `atob` itself throws.
const BASE64 =
	/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function isBase64(value: string): boolean {
	return value !== '' && BASE64.test(value);
}

function base64Decode(value: string): Uint8Array<ArrayBuffer> {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
}

/** `bytes` as base64 — the same slice-by-slice approach as `@nxgt/mail-resend`'s attachments, so a large body never spreads more arguments than a call takes. */
function base64Encode(bytes: Uint8Array): string {
	let binary = '';
	for (let start = 0; start < bytes.length; start += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
	}
	return btoa(binary);
}

function importKey(secret: string): Promise<CryptoKey> {
	const body = secret.startsWith('whsec_') ? secret.slice(6) : secret;
	return crypto.subtle.importKey(
		'raw',
		base64Decode(body),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
}

async function sign(key: CryptoKey, content: string): Promise<string> {
	const signature = await crypto.subtle.sign(
		'HMAC',
		key,
		new TextEncoder().encode(content),
	);
	return base64Encode(new Uint8Array(signature));
}

/** Compares two equal-length base64 signatures without a timing shortcut. */
function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let difference = 0;
	for (let index = 0; index < a.length; index += 1) {
		difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
	}
	return difference === 0;
}

function headerOf(headers: MailWebhookHeaders, name: string): string | null {
	if (headers instanceof Headers) return headers.get(name);
	for (const key of Object.keys(headers)) {
		if (key.toLowerCase() !== name) continue;
		const value = headers[key];
		if (typeof value === 'string') return value;
		if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
		return null;
	}
	return null;
}

async function requestOf(
	request: ResendWebhookRequest,
): Promise<{ headers: MailWebhookHeaders; body: string }> {
	if (typeof Request !== 'undefined' && request instanceof Request) {
		return { headers: request.headers, body: await request.text() };
	}
	if (
		typeof request !== 'object' ||
		request === null ||
		typeof (request as { body?: unknown }).body !== 'string' ||
		typeof (request as { headers?: unknown }).headers !== 'object' ||
		(request as { headers?: unknown }).headers === null
	) {
		throw new TypeError(
			'verify: request must be a Request, or { headers, body } with the raw text body',
		);
	}
	const { headers, body } = request as {
		headers: MailWebhookHeaders;
		body: string;
	};
	return { headers, body };
}

/** `data.bounce.type` mapped to the neutral `bounceType`: Resend's `Permanent` is `hard`; `Temporary`, `Transient`, `Undetermined` and anything unrecognised is `soft` — a message never assumed permanent on a code this package does not know. */
function bounceTypeOf(bounce: unknown): MailBounceType {
	const type =
		typeof bounce === 'object' && bounce !== null
			? (bounce as Record<string, unknown>).type
			: null;
	return type === 'Permanent' ? 'hard' : 'soft';
}

function timestampOf(fields: Record<string, unknown>, nested: unknown): Date {
	const nestedTimestamp =
		typeof nested === 'object' && nested !== null
			? (nested as Record<string, unknown>).timestamp
			: undefined;
	const value =
		typeof nestedTimestamp === 'string' ? nestedTimestamp : fields.created_at;
	return new Date(typeof value === 'string' ? value : Number.NaN);
}

function tagsOf(
	fields: Record<string, unknown>,
): Readonly<Record<string, string>> {
	const tags = fields.tags;
	if (typeof tags !== 'object' || tags === null) return {};
	const record: Record<string, string> = {};
	for (const [key, value] of Object.entries(tags)) {
		if (typeof value === 'string') record[key] = value;
	}
	return record;
}

/**
 * Maps a Resend webhook payload, already parsed as JSON, to the neutral
 * shape — or `null` for an event type this package does not map, or a
 * payload too malformed to trust (no `data.email_id`, no `data.to`): both an
 * absence, never a throw. See
 * https://resend.com/docs/dashboard/webhooks/event-types for every type
 * Resend sends.
 */
function eventOf(payload: unknown): MailEvent | null {
	if (typeof payload !== 'object' || payload === null) return null;
	const record = payload as Record<string, unknown>;
	const type = record.type;
	if (typeof type !== 'string' || !type.startsWith(EVENT_TYPE_PREFIX))
		return null;
	if (typeof record.data !== 'object' || record.data === null) return null;
	const fields = record.data as Record<string, unknown>;

	const messageId = fields.email_id;
	const to = fields.to;
	if (typeof messageId !== 'string' || messageId === '') return null;
	// Resend lists every recipient of the message here; an event is reported
	// once per message, so in a transactional send — one recipient — this is
	// unambiguous. A broadcast to several is reported against the first.
	const recipient = Array.isArray(to) ? to[0] : null;
	if (typeof recipient !== 'string' || recipient === '') return null;

	const tags = tagsOf(fields);

	switch (type) {
		case 'email.delivered':
			return {
				type: 'delivered',
				messageId,
				recipient,
				timestamp: timestampOf(fields, null),
				tags,
				raw: payload,
			};
		case 'email.bounced':
			return {
				type: 'bounced',
				bounceType: bounceTypeOf(fields.bounce),
				messageId,
				recipient,
				timestamp: timestampOf(fields, null),
				tags,
				raw: payload,
			};
		case 'email.complained':
			return {
				type: 'complained',
				messageId,
				recipient,
				timestamp: timestampOf(fields, null),
				tags,
				raw: payload,
			};
		case 'email.delivery_delayed':
			return {
				type: 'delayed',
				messageId,
				recipient,
				timestamp: timestampOf(fields, null),
				tags,
				raw: payload,
			};
		case 'email.opened':
			return {
				type: 'opened',
				tracking: true,
				messageId,
				recipient,
				timestamp: timestampOf(fields, fields.open),
				tags,
				raw: payload,
			};
		case 'email.clicked': {
			const click = fields.click;
			const url =
				typeof click === 'object' &&
				click !== null &&
				typeof (click as Record<string, unknown>).link === 'string'
					? ((click as Record<string, unknown>).link as string)
					: null;
			return {
				type: 'clicked',
				tracking: true,
				url,
				messageId,
				recipient,
				timestamp: timestampOf(fields, click),
				tags,
				raw: payload,
			};
		}
		default:
			// email.sent, email.scheduled, email.failed, email.received,
			// email.suppressed, and any future type — an absence, not a failure.
			return null;
	}
}

/** Creates a {@link ResendWebhook} that verifies requests against `options.secret`. */
export function createResendWebhook(
	options: ResendWebhookOptions,
): ResendWebhook {
	checkOptions(options);
	const keyPromise = importKey(options.secret);
	const toleranceMs = options.toleranceMs ?? DEFAULT_TOLERANCE_MS;

	return {
		async verify(request: ResendWebhookRequest): Promise<MailEvent | null> {
			const { headers, body } = await requestOf(request);
			const id = headerOf(headers, 'svix-id');
			const timestamp = headerOf(headers, 'svix-timestamp');
			const signature = headerOf(headers, 'svix-signature');
			if (id === null || timestamp === null || signature === null) {
				throw new MailWebhookRefused(
					'INVALID_SIGNATURE',
					'verify: svix-id, svix-timestamp or svix-signature is missing',
				);
			}
			if (!/^\d+$/.test(timestamp)) {
				throw new MailWebhookRefused(
					'INVALID_SIGNATURE',
					'verify: svix-timestamp must be a Unix timestamp, in seconds',
				);
			}
			const timestampMs = Number(timestamp) * 1000;
			if (Math.abs(Date.now() - timestampMs) > toleranceMs) {
				throw new MailWebhookRefused(
					'EXPIRED_TIMESTAMP',
					`verify: svix-timestamp is more than ${toleranceMs}ms from now`,
				);
			}

			const expected = await sign(
				await keyPromise,
				`${id}.${timestamp}.${body}`,
			);
			const provided = signature
				.split(/\s+/)
				.filter((part) => part.startsWith('v1,'))
				.map((part) => part.slice('v1,'.length));
			if (
				provided.length === 0 ||
				!provided.some((candidate) => timingSafeEqual(candidate, expected))
			) {
				throw new MailWebhookRefused(
					'INVALID_SIGNATURE',
					'verify: svix-signature does not match — check the secret, and that the body given was the exact raw text Resend sent',
				);
			}

			let payload: unknown;
			try {
				payload = JSON.parse(body);
			} catch (cause) {
				throw new MailWebhookRefused(
					'INVALID_SIGNATURE',
					'verify: the signature matched but the body is not JSON — check that the exact raw body was given, not one re-serialized by a framework',
					{ cause },
				);
			}
			return eventOf(payload);
		},
	};
}
