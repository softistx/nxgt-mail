/**
 * `@nxgt/mail-resend` — a Resend transport for `@nxgt/mail`, over `fetch`,
 * with no SDK.
 *
 * ```ts
 * import { createResendMailer } from '@nxgt/mail-resend';
 *
 * const mailer = createResendMailer({
 *   apiKey: process.env.RESEND_API_KEY ?? '',
 *   from: { name: 'Acme', address: 'noreply@acme.test' },
 * });
 * ```
 *
 * **A failure throws** the `MailFailure` or `MailRefused` of the `@nxgt/mail`
 * peer, what Resend answered as the `cause`. Nothing is retried; a message's
 * `idempotencyKey` is sent as Resend's `Idempotency-Key`, so a retry the
 * caller makes delivers once.
 */

import {
	type Address,
	checkMessage,
	type Mailer,
	MailFailure,
	type MailMessage,
	MailRefused,
	type SentMail,
} from '@nxgt/mail';

export interface ResendMailerOptions {
	/** The API key, `re_…`. */
	readonly apiKey: string;
	/** The sender of a message that names none. Without it, such a message is refused. */
	readonly from?: Address;
	/** Default `https://api.resend.com`. */
	readonly baseUrl?: string;
	/** Default the global `fetch`. For a proxy, or a test. */
	readonly fetch?: (url: string, init: RequestInit) => Promise<Response>;
	/** How long a send may take before it fails. Default `30000`. */
	readonly timeoutMs?: number;
}

/**
 * An address as Resend reads it: bare, or `"name" <address>` — the name a
 * quoted string, so a comma or an angle bracket in it names no one else.
 */
export function formatAddress(address: Address): string {
	if (typeof address === 'string') return address;
	const name = address.name.replace(/[\\"]/g, (char) => `\\${char}`);
	return `"${name}" <${address.address}>`;
}

/**
 * What Resend answered, kept as the `cause`: a plain `Error` — a transport
 * defines no error class of its own — with the status, Resend's error name
 * (`validation_error`, `rate_limit_exceeded`…) and its message as `detail`.
 * Its own message holds the status and the name only: Resend's message can
 * quote an address, and a message reports a shape, never a value.
 */
function resendAnswer(
	status: number,
	errorName: string | null,
	detail: string | null,
): Error & {
	readonly status: number;
	readonly errorName: string | null;
	readonly detail: string | null;
} {
	return Object.assign(
		new Error(
			`Resend answered ${status}${errorName === null ? '' : ` ${errorName}`}`,
		),
		{ status, errorName, detail },
	);
}

/**
 * Settles with `work`, or rejects with the signal's reason once it aborts —
 * so the timeout holds even with an injected `fetch` that ignores the signal.
 */
function beforeAbort<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const abort = () => reject(signal.reason);
		if (signal.aborted) return abort();
		signal.addEventListener('abort', abort, { once: true });
		work.then(
			(value) => {
				signal.removeEventListener('abort', abort);
				resolve(value);
			},
			(error: unknown) => {
				signal.removeEventListener('abort', abort);
				reject(error);
			},
		);
	});
}

/** The JSON body of an answer, or `{}` when it is not JSON or never ends. */
async function readAnswer(
	response: Response,
	signal: AbortSignal,
): Promise<Record<string, unknown>> {
	const body: unknown = await beforeAbort(response.json(), signal).then(
		(value: unknown) => value,
		() => null,
	);
	return typeof body === 'object' && body !== null
		? (body as Record<string, unknown>)
		: {};
}

/**
 * `bytes` as base64, as Resend takes an attachment's `content` — with no Node
 * built-in, so it runs on an edge runtime. Read in slices, so a large file
 * never spreads more arguments than a call takes.
 */
function base64Of(bytes: Uint8Array): string {
	let binary = '';
	for (let start = 0; start < bytes.length; start += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
	}
	return btoa(binary);
}

/** The JSON body of `POST /emails`: `message` in Resend's field names. */
function bodyOf(
	message: MailMessage,
	sender: Address,
): Record<string, unknown> {
	const to = Array.isArray(message.to) ? message.to : [message.to];
	return {
		from: formatAddress(sender),
		to: to.map(formatAddress),
		subject: message.subject,
		html: message.html,
		text: message.text,
		...(message.replyTo === undefined
			? {}
			: {
					// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
					reply_to: formatAddress(message.replyTo),
				}),
		...(message.headers === undefined ||
		Object.keys(message.headers).length === 0
			? {}
			: { headers: message.headers }),
		...(message.attachments === undefined || message.attachments.length === 0
			? {}
			: {
					attachments: message.attachments.map((attachment) => ({
						filename: attachment.filename,
						content: base64Of(attachment.content),
						// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
						content_type: attachment.contentType,
						...(attachment.contentId === undefined
							? {}
							: {
									// An inline image: the HTML shows it as cid:<content_id>.
									// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
									content_id: attachment.contentId,
								}),
					})),
				}),
	};
}

/** The largest delay a timer takes, 2³¹ − 1 ms — about 24.8 days. */
const MAX_TIMEOUT_MS = 2_147_483_647;

const text = (value: unknown) =>
	typeof value === 'string' && value !== '' ? value : null;

function checkOptions(options: ResendMailerOptions): void {
	if (typeof options !== 'object' || options === null) {
		throw new TypeError(
			'createResendMailer: options must be an object, as { apiKey }',
		);
	}
	if (typeof options.apiKey !== 'string' || options.apiKey.trim() === '') {
		throw new TypeError(
			'createResendMailer: apiKey must be a Resend API key — is the environment variable set?',
		);
	}
	if (/\s/.test(options.apiKey)) {
		// A key read from a file often keeps its final line break; `fetch`
		// would then refuse the header at every send, as an outage.
		throw new TypeError(
			'createResendMailer: apiKey holds whitespace — trim the value it was read from',
		);
	}
	if (
		options.baseUrl !== undefined &&
		(typeof options.baseUrl !== 'string' ||
			!/^https?:\/\/[^/]/.test(options.baseUrl))
	) {
		throw new TypeError(
			'createResendMailer: baseUrl must be an http: or https: URL',
		);
	}
	if (options.fetch !== undefined && typeof options.fetch !== 'function') {
		throw new TypeError('createResendMailer: fetch must be a function');
	}
	if (
		options.timeoutMs !== undefined &&
		!(Number.isInteger(options.timeoutMs) && options.timeoutMs > 0)
	) {
		throw new TypeError(
			'createResendMailer: timeoutMs must be a positive integer',
		);
	}
	if (options.timeoutMs !== undefined && options.timeoutMs > MAX_TIMEOUT_MS) {
		// A timer's delay is a signed 32-bit integer: above it, the runtime
		// fires at once, and every send would time out.
		throw new TypeError(
			`createResendMailer: timeoutMs must be at most ${MAX_TIMEOUT_MS} — a longer timer fires at once`,
		);
	}
	if (options.from !== undefined) {
		try {
			checkMessage({ to: options.from, subject: '', html: '', text: '' });
		} catch {
			throw new TypeError(
				'createResendMailer: from must be an e-mail address, as noreply@example.com or { name, address }',
			);
		}
	}
}

/** Creates a {@link Mailer} that sends each message through Resend's API. */
export function createResendMailer(options: ResendMailerOptions): Mailer {
	checkOptions(options);
	const endpoint = `${(options.baseUrl ?? 'https://api.resend.com').replace(/\/+$/, '')}/emails`;
	const post =
		options.fetch ??
		((url: string, init: RequestInit) => globalThis.fetch(url, init));
	const timeoutMs = options.timeoutMs ?? 30_000;

	return {
		async send(message: MailMessage): Promise<SentMail> {
			checkMessage(message);
			const sender = message.from ?? options.from;
			if (sender === undefined) {
				throw new MailRefused(
					'send: from is missing — give the message a from, or createResendMailer a default one',
				);
			}
			const body = bodyOf(message, sender);

			const signal = AbortSignal.timeout(timeoutMs);
			let response: Response;
			try {
				response = await beforeAbort(
					post(endpoint, {
						method: 'POST',
						headers: {
							authorization: `Bearer ${options.apiKey}`,
							'content-type': 'application/json',
							...(message.idempotencyKey === undefined
								? {}
								: { 'idempotency-key': message.idempotencyKey }),
						},
						body: JSON.stringify(body),
						signal,
					}),
					signal,
				);
			} catch (error) {
				if (error instanceof DOMException && error.name === 'TimeoutError') {
					throw new MailFailure(
						`send: Resend did not answer within ${timeoutMs} ms`,
						{ cause: error },
					);
				}
				throw new MailFailure('send: Resend could not be reached', {
					cause: error,
				});
			}

			const answer = await readAnswer(response, signal);
			if (response.ok) return { messageId: text(answer.id) };

			const cause = resendAnswer(
				response.status,
				text(answer.name),
				text(answer.message),
			);
			// 400 and 422 are Resend refusing the message, 413 a request too large
			// to take, and a 409 invalid_idempotent_request an idempotency key
			// already used for another message: sending again cannot fix any of
			// them. Anything else — a key refused, a rate limit, an outage, a 409
			// for a send with the same key still in progress — is Resend failing
			// to take it.
			if (
				response.status === 400 ||
				response.status === 413 ||
				response.status === 422 ||
				(response.status === 409 &&
					cause.errorName === 'invalid_idempotent_request')
			) {
				throw new MailRefused('send: Resend refused the message', { cause });
			}
			throw new MailFailure('send: Resend could not take the message', {
				cause,
			});
		},
	};
}
