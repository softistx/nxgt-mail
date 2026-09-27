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
 * caller makes delivers once. A message's `tags` are sent as Resend's `tags`,
 * to group sends in its dashboard and webhooks. A message's `scheduledAt` is
 * sent as Resend's `scheduled_at`, ISO 8601: Resend still answers an id right
 * away, and sends the e-mail itself later. `checkMessage`, called from its
 * `@nxgt/mail` peer, already holds it to Resend's own 30-day limit.
 *
 * The mailer also has `sendBatch` (Resend's `POST /emails/batch`), `cancel`
 * and `reschedule` (`POST` and `PATCH /emails/{id}`) — see {@link ResendMailer}.
 */

import {
	type Address,
	checkMessage,
	checkScheduledAt,
	type MailBatchResult,
	type Mailer,
	MailFailure,
	type MailMessage,
	MailRefused,
	MailScheduleRefused,
	type SentMail,
} from '@nxgt/mail';

/**
 * What `createResendMailer` answers: a {@link Mailer}, plus what only Resend
 * offers.
 */
export interface ResendMailer extends Mailer {
	/**
	 * Sends many messages in one call to Resend's `POST /emails/batch` — up to
	 * 100 per request, Resend's own limit ("Trigger up to 100 batch emails at
	 * once."); above it, `sendBatch` splits `messages` into as many requests as
	 * it takes, in order. Every message is checked with `checkMessage` before
	 * any request goes out — a message that fails it is `refused` on its own,
	 * and never reaches Resend.
	 *
	 * Two things `send` takes are refused in a batch instead, each on its own
	 * message, the rest unaffected:
	 *
	 * - **an attachment**: "The attachments field is not supported yet" in a
	 *   batch request
	 *   (https://resend.com/docs/api-reference/emails/send-batch-emails);
	 * - **its own `idempotencyKey`**: Resend takes one `Idempotency-Key` per
	 *   batch *request*, in the header, never one per message inside it — a
	 *   key on one of several messages cannot be honoured, and no
	 *   `Idempotency-Key` header is sent for a batch request at all, so
	 *   retrying `sendBatch` itself can duplicate every message that went
	 *   through.
	 *
	 * Resend answers one request of up to 100 as a whole: if it refuses the
	 * request (a malformed message anywhere in it) or cannot be reached, every
	 * message of that request is reported the same way — `refused` or
	 * `failed` — because Resend gives back one answer for the whole request,
	 * never one per message. A request further along that Resend does accept
	 * still runs, and is reported on its own.
	 */
	sendBatch(
		messages: readonly MailMessage[],
	): Promise<readonly MailBatchResult[]>;

	/**
	 * Cancels a message `send` scheduled ahead, that Resend has not sent yet:
	 * `POST /emails/{id}/cancel`
	 * (https://resend.com/docs/api-reference/emails/cancel-email). Resolves
	 * once cancelled.
	 *
	 * Resend does not document what it answers for an id it already sent, or
	 * one it never held: this reads a `404` as {@link MailScheduleRefused}
	 * code `UNKNOWN_ID`, and a `400` as code `ALREADY_SENT` — the only two
	 * answers observed for this endpoint. Anything else is a `MailFailure`,
	 * Resend's answer as the `cause`.
	 */
	cancel(messageId: string): Promise<void>;

	/**
	 * Reschedules a message `send` scheduled ahead, to a new `scheduledAt`:
	 * Resend's `PATCH /emails/{id}`
	 * (https://resend.com/docs/api-reference/emails/update-email). The same
	 * rule `checkMessage` holds `send`'s own `scheduledAt` to — a valid `Date`,
	 * no earlier than now and no more than 30 days ahead — applies here too.
	 * Refuses the way `cancel` does when `messageId` is unknown or already
	 * sent.
	 */
	reschedule(messageId: string, scheduledAt: Date): Promise<void>;
}

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
		...(message.tags === undefined || Object.keys(message.tags).length === 0
			? {}
			: {
					tags: Object.entries(message.tags).map(([name, value]) => ({
						name,
						value,
					})),
				}),
		...(message.scheduledAt === undefined
			? {}
			: {
					// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
					scheduled_at: message.scheduledAt.toISOString(),
				}),
	};
}

/** How many tags Resend takes on one e-mail. */
const MAX_TAGS = 75;

/**
 * How many messages `sendBatch` puts in one request to `POST /emails/batch`.
 * Resend's own limit: "Trigger up to 100 batch emails at once."
 * https://resend.com/docs/api-reference/emails/send-batch-emails
 */
const BATCH_LIMIT = 100;

/** The largest delay a timer takes, 2³¹ − 1 ms — about 24.8 days. */
const MAX_TIMEOUT_MS = 2_147_483_647;

const text = (value: unknown) =>
	typeof value === 'string' && value !== '' ? value : null;

/** `items`, split into groups of at most `size`, in order. */
function chunk<T>(items: readonly T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let start = 0; start < items.length; start += size) {
		chunks.push(items.slice(start, start + size));
	}
	return chunks;
}

/**
 * One raw call to Resend, shared by `send`, `sendBatch`, `cancel` and
 * `reschedule`: applies the timeout, and throws `MailFailure` — named for
 * `action` — for a network problem or a timeout. Everything about the
 * answer past that — its status, its body — is the caller's to read: this
 * never decides refused from failed, since the two calls that share a status
 * code (`send`'s and `sendBatch`'s 400, `cancel`'s and `reschedule`'s 400)
 * read it differently.
 */
async function resendCall(
	post: (url: string, init: RequestInit) => Promise<Response>,
	url: string,
	init: {
		readonly method: string;
		readonly body?: unknown;
		readonly headers?: Readonly<Record<string, string>>;
	},
	apiKey: string,
	timeoutMs: number,
	action: string,
): Promise<{
	readonly response: Response;
	readonly answer: Record<string, unknown>;
}> {
	const signal = AbortSignal.timeout(timeoutMs);
	let response: Response;
	try {
		response = await beforeAbort(
			post(url, {
				method: init.method,
				headers: {
					authorization: `Bearer ${apiKey}`,
					...(init.body === undefined
						? {}
						: { 'content-type': 'application/json' }),
					...init.headers,
				},
				...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
				signal,
			}),
			signal,
		);
	} catch (error) {
		if (error instanceof DOMException && error.name === 'TimeoutError') {
			throw new MailFailure(
				`${action}: Resend did not answer within ${timeoutMs} ms`,
				{
					cause: error,
				},
			);
		}
		throw new MailFailure(`${action}: Resend could not be reached`, {
			cause: error,
		});
	}
	const answer = await readAnswer(response, signal);
	return { response, answer };
}

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

/** Creates a {@link ResendMailer} that sends each message through Resend's API. */
export function createResendMailer(options: ResendMailerOptions): ResendMailer {
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
			if (Object.keys(message.tags ?? {}).length > MAX_TAGS) {
				throw new MailRefused(
					`send: Resend takes at most ${MAX_TAGS} tags on one e-mail`,
				);
			}
			const body = bodyOf(message, sender);
			const { response, answer } = await resendCall(
				post,
				endpoint,
				{
					method: 'POST',
					body,
					headers:
						message.idempotencyKey === undefined
							? {}
							: { 'idempotency-key': message.idempotencyKey },
				},
				options.apiKey,
				timeoutMs,
				'send',
			);
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

		async sendBatch(
			messages: readonly MailMessage[],
		): Promise<readonly MailBatchResult[]> {
			if (!Array.isArray(messages)) {
				throw new TypeError(
					'sendBatch: messages must be an array of MailMessage',
				);
			}
			const prepared: (
				| { readonly ok: true; readonly body: Record<string, unknown> }
				| { readonly ok: false; readonly error: MailRefused }
			)[] = messages.map((message) => {
				try {
					checkMessage(message);
					const sender = message.from ?? options.from;
					if (sender === undefined) {
						throw new MailRefused(
							'sendBatch: from is missing — give the message a from, or createResendMailer a default one',
						);
					}
					if (
						message.attachments !== undefined &&
						message.attachments.length > 0
					) {
						throw new MailRefused(
							"sendBatch: attachments are not supported in a batch send — Resend's /emails/batch refuses them; send this message on its own with send",
						);
					}
					if (message.idempotencyKey !== undefined) {
						throw new MailRefused(
							'sendBatch: idempotencyKey is not supported in a batch send — Resend takes one Idempotency-Key per batch request, never one per message; send this message on its own with send',
						);
					}
					if (Object.keys(message.tags ?? {}).length > MAX_TAGS) {
						throw new MailRefused(
							`sendBatch: Resend takes at most ${MAX_TAGS} tags on one e-mail`,
						);
					}
					return { ok: true, body: bodyOf(message, sender) };
				} catch (error) {
					if (error instanceof MailRefused) return { ok: false, error };
					throw error;
				}
			});

			const results: MailBatchResult[] = new Array(messages.length);
			prepared.forEach((item, index) => {
				if (!item.ok) results[index] = { status: 'refused', error: item.error };
			});
			const pending = prepared
				.map((item, index) => (item.ok ? index : -1))
				.filter((index) => index >= 0);

			for (const group of chunk(pending, BATCH_LIMIT)) {
				const payload = group.map(
					(index) =>
						(prepared[index] as { ok: true; body: Record<string, unknown> })
							.body,
				);
				try {
					const { response, answer } = await resendCall(
						post,
						`${endpoint}/batch`,
						{ method: 'POST', body: payload },
						options.apiKey,
						timeoutMs,
						'sendBatch',
					);
					if (!response.ok) {
						const cause = resendAnswer(
							response.status,
							text(answer.name),
							text(answer.message),
						);
						const refused =
							response.status === 400 ||
							response.status === 413 ||
							response.status === 422;
						for (const index of group) {
							results[index] = refused
								? {
										status: 'refused',
										error: new MailRefused(
											'sendBatch: Resend refused the batch request',
											{
												cause,
											},
										),
									}
								: {
										status: 'failed',
										error: new MailFailure(
											'sendBatch: Resend could not take the batch request',
											{ cause },
										),
									};
						}
						continue;
					}
					const data = Array.isArray(answer.data) ? answer.data : [];
					group.forEach((index, position) => {
						const entry = data[position];
						const id =
							typeof entry === 'object' && entry !== null
								? text((entry as Record<string, unknown>).id)
								: null;
						results[index] = { status: 'sent', sentMail: { messageId: id } };
					});
				} catch (error) {
					if (!(error instanceof MailFailure)) throw error;
					for (const index of group)
						results[index] = { status: 'failed', error };
				}
			}
			return results;
		},

		async cancel(messageId: string): Promise<void> {
			if (typeof messageId !== 'string' || messageId === '') {
				throw new TypeError('cancel: messageId must be the id send answered');
			}
			const { response, answer } = await resendCall(
				post,
				`${endpoint}/${encodeURIComponent(messageId)}/cancel`,
				{ method: 'POST' },
				options.apiKey,
				timeoutMs,
				'cancel',
			);
			if (response.ok) return;
			if (response.status === 404) {
				throw new MailScheduleRefused(
					'UNKNOWN_ID',
					'cancel: Resend has no scheduled message with this id — it may already have been cancelled, or the id is wrong',
				);
			}
			const cause = resendAnswer(
				response.status,
				text(answer.name),
				text(answer.message),
			);
			if (response.status === 400) {
				throw new MailScheduleRefused(
					'ALREADY_SENT',
					'cancel: Resend refused to cancel this message — it has already been sent, and is no longer scheduled',
					{ cause },
				);
			}
			throw new MailFailure('cancel: Resend could not take the request', {
				cause,
			});
		},

		async reschedule(messageId: string, scheduledAt: Date): Promise<void> {
			if (typeof messageId !== 'string' || messageId === '') {
				throw new TypeError(
					'reschedule: messageId must be the id send answered',
				);
			}
			checkScheduledAt(scheduledAt, 'reschedule');
			const { response, answer } = await resendCall(
				post,
				`${endpoint}/${encodeURIComponent(messageId)}`,
				{
					method: 'PATCH',
					body: {
						// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
						scheduled_at: scheduledAt.toISOString(),
					},
				},
				options.apiKey,
				timeoutMs,
				'reschedule',
			);
			if (response.ok) return;
			if (response.status === 404) {
				throw new MailScheduleRefused(
					'UNKNOWN_ID',
					'reschedule: Resend has no scheduled message with this id — it may already have been cancelled, or the id is wrong',
				);
			}
			const cause = resendAnswer(
				response.status,
				text(answer.name),
				text(answer.message),
			);
			if (response.status === 400) {
				throw new MailScheduleRefused(
					'ALREADY_SENT',
					'reschedule: Resend refused to reschedule this message — it has already been sent, and is no longer scheduled',
					{ cause },
				);
			}
			throw new MailFailure('reschedule: Resend could not take the request', {
				cause,
			});
		},
	};
}
