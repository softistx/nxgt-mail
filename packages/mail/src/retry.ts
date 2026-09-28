import { MailFailure } from './errors';
import type { MailBatchResult, Mailer, MailMessage, SentMail } from './types';

/** Options `withRetry` accepts. Every field is optional; the defaults suit a transactional e-mail. */
export interface MailRetryOptions {
	/**
	 * How many times `send` is tried in all, the first try included. A
	 * message that still fails after this many is the final `MailFailure`,
	 * with `attempts` on it. Default `5`.
	 */
	readonly attempts?: number;
	/**
	 * The delay before the first retry, in milliseconds — exponential
	 * backoff with full jitter grows it from here: `random() * min(maxDelayMs,
	 * baseDelayMs * 2 ** (retry - 1))`. Default `200`.
	 */
	readonly baseDelayMs?: number;
	/** The most a delay ever grows to, in milliseconds. Default `30000` (30 s). */
	readonly maxDelayMs?: number;
	/**
	 * Stops retrying: the pending delay rejects with `signal.reason`, and no
	 * further attempt is made. A `send` already in flight is not cancelled —
	 * the port takes no signal — only the wait between attempts is.
	 */
	readonly signal?: AbortSignal;
}

/**
 * A `MailFailure` thrown by `withRetry` once every attempt has failed: the
 * **last** transport failure (its `cause` is still the transport's own
 * error), with `attempts` added — how many times `send` was tried, always
 * the resolved `attempts` option. Still a `MailFailure`
 * (`error instanceof MailFailure` holds), never a new class of its own.
 */
export type RetryExhausted = MailFailure & { readonly attempts: number };

/**
 * The hooks `withRetry` calls for anything that would otherwise make a test
 * wait or be non-deterministic. Not exported from `@nxgt/mail`'s index: a
 * consumer never sets these, and `retry.spec.ts` reaches for
 * {@link createRetryingMailer} directly, with a `sleep` that resolves at
 * once and a `random` it controls, instead of waiting on a real timer.
 */
export interface RetryHooks {
	/** The jitter source, `[0, 1)`. Default `Math.random`. */
	readonly random: () => number;
	/** Waits `delayMs`, or rejects with `signal.reason` once it aborts first. */
	readonly sleep: (delayMs: number, signal?: AbortSignal) => Promise<void>;
	/** Names a logical send with no `idempotencyKey` of its own. Default `crypto.randomUUID`. */
	readonly newIdempotencyKey: () => string;
}

const DEFAULT_ATTEMPTS = 5;
const DEFAULT_BASE_DELAY_MS = 200;
const DEFAULT_MAX_DELAY_MS = 30_000;

function realSleep(delayMs: number, signal?: AbortSignal): Promise<void> {
	if (signal?.aborted) return Promise.reject(signal.reason);
	if (delayMs <= 0) return Promise.resolve();
	return new Promise<void>((resolve, reject) => {
		const onAbort = () => {
			clearTimeout(timer);
			reject(signal?.reason);
		};
		const timer = setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve();
		}, delayMs);
		signal?.addEventListener('abort', onAbort, { once: true });
	});
}

/** {@link RetryHooks} a real send uses: a real timer, `Math.random`, `crypto.randomUUID`. */
export const DEFAULT_RETRY_HOOKS: RetryHooks = {
	random: () => Math.random(),
	sleep: realSleep,
	newIdempotencyKey: () => crypto.randomUUID(),
};

function checkOptions(options: MailRetryOptions): void {
	if (typeof options !== 'object' || options === null) {
		throw new TypeError(
			'withRetry: options must be an object, as { attempts }',
		);
	}
	if (
		options.attempts !== undefined &&
		!(Number.isInteger(options.attempts) && options.attempts >= 1)
	) {
		throw new TypeError('withRetry: attempts must be a positive integer');
	}
	if (
		options.baseDelayMs !== undefined &&
		!(Number.isInteger(options.baseDelayMs) && options.baseDelayMs >= 0)
	) {
		throw new TypeError(
			'withRetry: baseDelayMs must be a non-negative integer',
		);
	}
	if (
		options.maxDelayMs !== undefined &&
		!(Number.isInteger(options.maxDelayMs) && options.maxDelayMs >= 0)
	) {
		throw new TypeError('withRetry: maxDelayMs must be a non-negative integer');
	}
	if (
		options.baseDelayMs !== undefined &&
		options.maxDelayMs !== undefined &&
		options.maxDelayMs < options.baseDelayMs
	) {
		throw new TypeError('withRetry: maxDelayMs must be at least baseDelayMs');
	}
	if (
		options.signal !== undefined &&
		!(options.signal instanceof AbortSignal)
	) {
		throw new TypeError('withRetry: signal must be an AbortSignal');
	}
}

/**
 * The delay before one retry: a provider's own `retryAfterMs` on the
 * `MailFailure` it threw, when it carries a non-negative, finite one — no
 * transport sets it today, but a future one cheaply can, from a `Retry-After`
 * header — otherwise exponential backoff with full jitter, capped at
 * `maxDelayMs`.
 */
function delayFor(
	failure: MailFailure,
	retry: number,
	baseDelayMs: number,
	maxDelayMs: number,
	random: () => number,
): number {
	const retryAfterMs = (failure as { readonly retryAfterMs?: unknown })
		.retryAfterMs;
	if (
		typeof retryAfterMs === 'number' &&
		Number.isFinite(retryAfterMs) &&
		retryAfterMs >= 0
	) {
		return retryAfterMs;
	}
	const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** (retry - 1));
	return random() * cap;
}

/**
 * The `withRetry` decorator, taking its hooks apart so `retry.spec.ts` can
 * pass ones that never wait. `withRetry` is this with {@link DEFAULT_RETRY_HOOKS}.
 */
export function createRetryingMailer(
	mailer: Mailer,
	options: MailRetryOptions = {},
	hooks: RetryHooks = DEFAULT_RETRY_HOOKS,
): Mailer {
	if (
		typeof mailer !== 'object' ||
		mailer === null ||
		typeof mailer.send !== 'function'
	) {
		throw new TypeError('withRetry: mailer must be a Mailer, as { send }');
	}
	checkOptions(options);
	const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
	const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
	const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
	const signal = options.signal;

	return {
		// Passed through unwrapped, and only when `mailer` has one: a batch
		// call's own outcome is a `MailBatchResult` per message, not a single
		// throw, so retrying it wholesale is not this decorator's job — retry
		// the messages that came back `failed`, individually, with `send`,
		// where `withRetry`'s idempotency key applies.
		...(typeof mailer.sendBatch === 'function'
			? {
					sendBatch: (
						messages: readonly MailMessage[],
					): Promise<readonly MailBatchResult[]> =>
						(mailer.sendBatch as NonNullable<Mailer['sendBatch']>)(messages),
				}
			: {}),
		async send(message: MailMessage): Promise<SentMail> {
			if (signal?.aborted) throw signal.reason;

			// One key for every attempt of this logical send, generated once, so
			// a retry after an ambiguous failure dedupes where the transport
			// honours it. A caller's own key is never replaced.
			const toSend: MailMessage =
				message.idempotencyKey === undefined
					? { ...message, idempotencyKey: hooks.newIdempotencyKey() }
					: message;

			let lastFailure: MailFailure | undefined;
			for (let attempt = 1; attempt <= attempts; attempt++) {
				try {
					return await mailer.send(toSend);
				} catch (error) {
					// MailRefused, or anything that is not this package's own
					// MailFailure, is never retried: send again unchanged, and it
					// fails again.
					if (!(error instanceof MailFailure)) throw error;
					lastFailure = error;
					if (attempt === attempts) break;
					const delayMs = delayFor(
						error,
						attempt,
						baseDelayMs,
						maxDelayMs,
						hooks.random,
					);
					await hooks.sleep(delayMs, signal);
				}
			}
			throw Object.assign(lastFailure as MailFailure, { attempts });
		},
	};
}

/**
 * Wraps `mailer` so a {@link MailFailure} — a transient outage — is retried,
 * with exponential backoff and full jitter, instead of reaching the caller on
 * the first one. A {@link MailRefused} never is: sending it again fails again.
 *
 * ```ts
 * import { withRetry } from '@nxgt/mail';
 * import { createResendMailer } from '@nxgt/mail-resend';
 *
 * const mailer = withRetry(createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '' }));
 * ```
 *
 * A message with no `idempotencyKey` gets one, generated once for this send
 * and reused on every retry, so a transport that dedupes (Resend) delivers it
 * once; a message that already carries one keeps it. **SMTP ignores the key
 * outright** — it has no such mechanism — so a retry after an *ambiguous*
 * SMTP failure (a timeout waiting for the response to `DATA`, where the
 * server may have already accepted the message) can still duplicate the
 * e-mail. `@nxgt/mail-smtp` throws `MailFailure` for exactly that case, as
 * every other outage — an ambiguous failure is still "nothing is known to
 * have been sent" — so `withRetry` retries it like any other; there is no
 * way to tell it apart from a connection that never reached the server at
 * all. Accept the small chance of a duplicate over SMTP, or pass `attempts: 1`
 * to turn retrying off for a mailer built on it.
 *
 * **`sendBatch` is passed through untouched**, when `mailer` has one — no
 * retry, no idempotency key added to a message that lacks its own. A batch's
 * own contract already answers a `MailBatchResult` per message instead of
 * throwing; retry the ones that come back `failed`, one by one, with `send`.
 */
export function withRetry(mailer: Mailer, options?: MailRetryOptions): Mailer {
	// Not `options ?? {}`: an explicit `null` must still reach checkOptions
	// and be refused, as `undefined` (omitted) does not — createRetryingMailer's
	// own default parameter only applies to `undefined`.
	return createRetryingMailer(
		mailer,
		options === undefined ? {} : options,
		DEFAULT_RETRY_HOOKS,
	);
}
