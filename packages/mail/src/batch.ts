import { MailFailure, MailRefused } from './errors';
import { checkMessage } from './message';
import type { MailBatchResult, Mailer, MailMessage } from './types';

/**
 * Sends every one of `messages` and answers one {@link MailBatchResult} per
 * message, in order — **never fewer, and never a throw for a message's own
 * outcome**: unlike `send`, where a failure always throws, a batch holds many
 * messages, and one bad one must never hide what happened to the others.
 *
 * Every message is checked with `checkMessage` before any of them is sent, so
 * a message near the end that is malformed is known **before** the ones ahead
 * of it go out — its result is `refused` from the start, and it never reaches
 * `mailer`.
 *
 * When `mailer` implements `sendBatch` itself — a provider that batches,
 * Resend's `POST /emails/batch` — this calls it directly, after the same
 * up-front check, so the provider's own batching is used. Otherwise every
 * checked message is sent in turn, over `send`: **any `Mailer`, including a
 * third-party one written before this function existed, works with it.**
 *
 * ```ts
 * import { sendBatch } from '@nxgt/mail';
 *
 * const results = await sendBatch(mailer, [messageA, messageB]);
 * for (const [message, result] of results.map((r, i) => [messages[i], r] as const)) {
 *   if (result.status !== 'sent') console.error(result.error);
 * }
 * ```
 *
 * Throws a bare `TypeError` for `messages` that is not an array — a wiring
 * mistake, before anything is attempted.
 */
export async function sendBatch(
	mailer: Mailer,
	messages: readonly MailMessage[],
): Promise<readonly MailBatchResult[]> {
	if (
		typeof mailer !== 'object' ||
		mailer === null ||
		typeof mailer.send !== 'function'
	) {
		throw new TypeError('sendBatch: mailer must be a Mailer, as { send }');
	}
	if (!Array.isArray(messages)) {
		throw new TypeError('sendBatch: messages must be an array of MailMessage');
	}

	// Checked before anything is sent: a message failing here never reaches
	// the transport, whichever path runs below.
	const checked: (
		| { readonly ok: true; readonly message: MailMessage }
		| { readonly ok: false; readonly error: MailRefused }
	)[] = messages.map((message) => {
		try {
			checkMessage(message);
			return { ok: true, message };
		} catch (error) {
			if (error instanceof MailRefused) return { ok: false, error };
			throw error;
		}
	});

	if (typeof mailer.sendBatch === 'function') {
		// The provider's own batching. Still pre-checked above so a message it
		// would refuse for a reason `checkMessage` already catches never reaches
		// it; what it refuses beyond that is its own `sendBatch`'s to report.
		const toSend = checked
			.map((item, index) => (item.ok ? { index, message: item.message } : null))
			.filter(
				(item): item is { index: number; message: MailMessage } =>
					item !== null,
			);
		const sent =
			toSend.length === 0
				? []
				: await mailer.sendBatch(toSend.map((item) => item.message));
		const results: MailBatchResult[] = new Array(messages.length);
		toSend.forEach((item, position) => {
			const result = sent[position];
			if (result !== undefined) results[item.index] = result;
		});
		checked.forEach((item, index) => {
			if (!item.ok) results[index] = { status: 'refused', error: item.error };
		});
		return results;
	}

	// No native batching: every checked message is sent in turn over `send`.
	const results: MailBatchResult[] = [];
	for (const item of checked) {
		if (!item.ok) {
			results.push({ status: 'refused', error: item.error });
			continue;
		}
		try {
			const sentMail = await mailer.send(item.message);
			results.push({ status: 'sent', sentMail });
		} catch (error) {
			if (error instanceof MailRefused)
				results.push({ status: 'refused', error });
			else if (error instanceof MailFailure)
				results.push({ status: 'failed', error });
			else throw error;
		}
	}
	return results;
}
