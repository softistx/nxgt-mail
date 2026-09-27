import { describe, expect, it } from 'bun:test';
import { describeMailer } from './conformance/describe';
import { MailFailure, MailRefused } from './errors';
import { createMemoryMailer } from './memory';
import { createRetryingMailer, type RetryHooks, withRetry } from './retry';
import type { MailMessage } from './types';

const message: MailMessage = {
	to: 'ada@example.test',
	subject: 'Hello',
	html: '<p>Hello</p>',
	text: 'Hello',
};

/** Hooks that never wait a real timer and whose randomness is fixed. */
function fakeHooks(overrides: Partial<RetryHooks> = {}): RetryHooks & {
	readonly delays: number[];
	readonly ids: string[];
} {
	const delays: number[] = [];
	const ids: string[] = [];
	let idCounter = 0;
	return {
		random: () => 0.5,
		sleep: async (delayMs, signal) => {
			delays.push(delayMs);
			if (signal?.aborted) throw signal.reason;
		},
		newIdempotencyKey: () => {
			idCounter += 1;
			const id = `fake-${idCounter}`;
			ids.push(id);
			return id;
		},
		delays,
		ids,
		...overrides,
	};
}

describe('createRetryingMailer', () => {
	it('retries a MailFailure until it succeeds', async () => {
		const memory = createMemoryMailer();
		memory.failNext();
		memory.failNext();
		const hooks = fakeHooks();
		const mailer = createRetryingMailer(memory, {}, hooks);

		const sent = await mailer.send(message);

		expect(sent.messageId).toBe('memory-1');
		expect(memory.attempts).toBe(3);
		expect(hooks.delays.length).toBe(2);
	});

	it('never retries a MailRefused', async () => {
		const memory = createMemoryMailer();
		memory.failNext(new MailRefused('send: refused'));
		const hooks = fakeHooks();
		const mailer = createRetryingMailer(memory, {}, hooks);

		await expect(mailer.send(message)).rejects.toBeInstanceOf(MailRefused);
		expect(memory.attempts).toBe(1);
		expect(hooks.delays.length).toBe(0);
	});

	it('throws the last MailFailure with attempts recorded, once exhausted', async () => {
		const memory = createMemoryMailer();
		memory.failNext();
		memory.failNext();
		memory.failNext();
		const hooks = fakeHooks();
		const mailer = createRetryingMailer(memory, { attempts: 3 }, hooks);

		const error = await mailer.send(message).catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(MailFailure);
		expect((error as MailFailure & { attempts: number }).attempts).toBe(3);
		expect(memory.attempts).toBe(3);
		expect(hooks.delays.length).toBe(2);
	});

	it('generates one idempotencyKey and reuses it on every retry', async () => {
		const memory = createMemoryMailer();
		memory.failNext();
		memory.failNext();
		const hooks = fakeHooks();
		const mailer = createRetryingMailer(memory, {}, hooks);

		await mailer.send(message);

		expect(hooks.ids).toEqual(['fake-1']);
		expect(memory.sent[0]?.idempotencyKey).toBe('fake-1');
	});

	it('keeps a caller-supplied idempotencyKey untouched', async () => {
		const memory = createMemoryMailer();
		memory.failNext();
		const hooks = fakeHooks();
		const mailer = createRetryingMailer(memory, {}, hooks);

		await mailer.send({ ...message, idempotencyKey: 'order-42/receipt' });

		expect(hooks.ids).toEqual([]);
		expect(memory.sent[0]?.idempotencyKey).toBe('order-42/receipt');
	});

	it('stops retrying once the signal aborts, and rejects with its reason', async () => {
		const memory = createMemoryMailer();
		memory.failNext();
		memory.failNext();
		memory.failNext();
		const controller = new AbortController();
		const reason = new Error('cancelled');
		const hooks = fakeHooks({
			sleep: async (_delayMs, signal) => {
				controller.abort(reason);
				if (signal?.aborted) throw signal.reason;
			},
		});
		const mailer = createRetryingMailer(
			memory,
			{ attempts: 5, signal: controller.signal },
			hooks,
		);

		await expect(mailer.send(message)).rejects.toBe(reason);
		expect(memory.attempts).toBe(1);
	});

	it('rejects at once when the signal is already aborted', async () => {
		const memory = createMemoryMailer();
		const controller = new AbortController();
		const reason = new Error('already cancelled');
		controller.abort(reason);
		const mailer = createRetryingMailer(
			memory,
			{ signal: controller.signal },
			fakeHooks(),
		);

		await expect(mailer.send(message)).rejects.toBe(reason);
		expect(memory.attempts).toBe(0);
	});

	it("honours a MailFailure's own retryAfterMs instead of the computed backoff", async () => {
		const memory = createMemoryMailer();
		memory.failNext(
			Object.assign(new MailFailure('send: rate limited'), {
				retryAfterMs: 12_345,
			}),
		);
		const hooks = fakeHooks();
		const mailer = createRetryingMailer(memory, {}, hooks);

		await mailer.send(message);

		expect(hooks.delays).toEqual([12_345]);
	});

	it('grows the computed delay exponentially, capped at maxDelayMs, with full jitter', async () => {
		const memory = createMemoryMailer();
		memory.failNext();
		memory.failNext();
		memory.failNext();
		const hooks = fakeHooks({ random: () => 1 });
		const mailer = createRetryingMailer(
			memory,
			{ attempts: 4, baseDelayMs: 100, maxDelayMs: 250 },
			hooks,
		);

		await mailer.send(message);

		expect(hooks.delays).toEqual([100, 200, 250]);
	});

	it('refuses a bad option at wiring time', () => {
		const memory = createMemoryMailer();
		expect(() => createRetryingMailer(memory, { attempts: 0 })).toThrow(
			TypeError,
		);
		expect(() => createRetryingMailer(memory, { attempts: 1.5 })).toThrow(
			TypeError,
		);
		expect(() =>
			createRetryingMailer(memory, { baseDelayMs: 100, maxDelayMs: 10 }),
		).toThrow(TypeError);
		expect(() => createRetryingMailer(null as never, {}, fakeHooks())).toThrow(
			TypeError,
		);
	});

	it('refuses an explicit null through withRetry itself, unlike omitting options', () => {
		const memory = createMemoryMailer();
		expect(() => withRetry(memory, null as never)).toThrow(TypeError);
		expect(() => withRetry(memory)).not.toThrow();
	});

	describeMailer({
		name: 'the decorated memory mailer',
		runner: { describe, it },
		harness: {
			async open() {
				const memory = createMemoryMailer();
				// attempts: 1 — no retry — so the conformance suite, written for a
				// bare transport, sees exactly the one hand-over it expects; the
				// tests above already prove the retrying behaviour itself.
				const mailer = createRetryingMailer(memory, { attempts: 1 });
				return {
					mailer,
					delivered: async () =>
						memory.sent.map((mail) => ({
							to: (Array.isArray(mail.to) ? mail.to : [mail.to]).map(
								(address) =>
									typeof address === 'string' ? address : address.address,
							),
							subject: mail.subject,
							html: mail.html,
							text: mail.text,
							attachments: mail.attachments ?? [],
							...(mail.scheduledAt === undefined
								? {}
								: { scheduledAt: mail.scheduledAt }),
						})),
					faults: {
						async failNext(kind) {
							memory.failNext(
								kind === 'refusal'
									? new MailRefused('send: refused for the conformance suite', {
											cause: new Error('conformance: refusal'),
										})
									: undefined,
							);
						},
						async attempts() {
							return memory.attempts;
						},
					},
				};
			},
		},
	});
});
