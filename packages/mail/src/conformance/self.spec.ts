import { describe, expect, it } from 'bun:test';
import { MailFailure } from '../errors';
import { createMemoryMailer } from '../memory';
import { allMailerCases, failureCases } from './cases/index';
import { describeMailer, MAILER_SKIP_REASONS, runMailerCase } from './describe';
import { referenceMailerHarness } from './reference';
import { sampleMessage } from './sample';
import type { MailerHarness } from './types';

// The suite, proven against the reference transport before any other exists.
describeMailer({
	name: 'the memory mailer',
	harness: referenceMailerHarness(),
	runner: { describe, it },
});

describe('the suite itself', () => {
	it('gives every case a unique id', () => {
		const ids = allMailerCases.map((c) => c.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('reports a missing faults as a skip with its reason, never as a pass', async () => {
		const outage = allMailerCases.find((c) => c.id === 'failure.outage');
		if (outage === undefined) throw new Error('failure.outage is missing');

		expect(await runMailerCase(outage, withoutFaults())).toEqual({
			skipped: MAILER_SKIP_REASONS.faults,
		});
	});

	it('fails a transport that answers instead of throwing', async () => {
		// The invariant, as a test: a transport that swallows an outage and
		// resolves is exactly what the suite exists to refuse.
		const swallowing: MailerHarness = {
			async open() {
				const mailer = createMemoryMailer();
				let failNext = false;
				return {
					mailer: {
						async send(message) {
							if (failNext) {
								failNext = false;
								return { messageId: null };
							}
							return mailer.send(message);
						},
					},
					delivered: async () => [],
					faults: {
						async failNext() {
							failNext = true;
						},
						attempts: async () => 1,
					},
				};
			},
		};
		const outage = allMailerCases.find((c) => c.id === 'failure.outage');
		if (outage === undefined) throw new Error('failure.outage is missing');

		const error = await runMailerCase(outage, swallowing).then(
			() => null,
			(e: unknown) => e,
		);
		expect(String(error)).toContain('resolved; it must reject');
	});

	it('fails a transport that throws its own copy of MailFailure', async () => {
		class OwnMailFailure extends Error {
			readonly code = 'MAIL_FAILED';
		}
		const own: MailerHarness = {
			async open() {
				let failNext = false;
				return {
					mailer: {
						async send() {
							if (failNext)
								throw new OwnMailFailure('down', { cause: new Error('x') });
							return { messageId: null };
						},
					},
					delivered: async () => [],
					faults: {
						async failNext() {
							failNext = true;
						},
						attempts: async () => 1,
					},
				};
			},
		};
		const outage = allMailerCases.find((c) => c.id === 'failure.outage');
		if (outage === undefined) throw new Error('failure.outage is missing');

		const error = await runMailerCase(outage, own).then(
			() => null,
			(e: unknown) => e,
		);
		expect(String(error)).toContain('MailFailure from @nxgt/mail');
		expect(new OwnMailFailure('x')).not.toBeInstanceOf(MailFailure);
	});

	it('refuses a skip that names no case', () => {
		expect(() =>
			describeMailer({
				name: 'x',
				harness: referenceMailerHarness(),
				runner: { describe, it },
				skip: { 'send.nothing': 'because' },
			}),
		).toThrow(
			new TypeError('describeMailer: skip names no case: send.nothing'),
		);
	});
});

/** A runner that records what the suite declares instead of running it. */
function recordingRunner() {
	const declared: {
		name: string;
		skipped: boolean;
		body: () => Promise<void>;
	}[] = [];
	const it = Object.assign(
		(name: string, body: () => Promise<void>) => {
			declared.push({ name, skipped: false, body });
		},
		{
			skip: (name: string, body: () => Promise<void>) => {
				declared.push({ name, skipped: true, body });
			},
		},
	);
	return {
		declared,
		runner: { describe: (_: string, body: () => void) => body(), it },
	};
}

const byId = (id: string) => {
	const found = allMailerCases.find((c) => c.id === id);
	if (found === undefined) throw new Error(`${id} is missing`);
	return found;
};

const failureOf = (promise: Promise<unknown>) =>
	promise.then(
		() => null,
		(e: unknown) => String(e),
	);

describe('the suite fails a bad transport', () => {
	it('fails a transport that retries a failed hand-over in secret', async () => {
		// Its retry succeeds, so the caller sees a success — and the receiving
		// end saw two hand-overs.
		const retrying: MailerHarness = {
			async open() {
				const opened = await referenceMailerHarness().open();
				return {
					...opened,
					mailer: {
						async send(message) {
							return opened.mailer
								.send(message)
								.catch(() => opened.mailer.send(message));
						},
					},
				};
			},
		};

		expect(
			await failureOf(runMailerCase(byId('failure.outage'), retrying)),
		).toContain('resolved; it must reject');
	});

	it('fails a transport that retries a failed hand-over and still throws', async () => {
		// The provider stays down for both hand-overs, so the caller does get a
		// MailFailure — only the attempts count shows the hidden retry.
		const retryingInVain: MailerHarness = {
			async open() {
				const opened = await referenceMailerHarness().open();
				const faults = opened.faults;
				if (faults === undefined) throw new Error('the reference has faults');
				return {
					...opened,
					mailer: {
						async send(message) {
							return opened.mailer
								.send(message)
								.catch(() => opened.mailer.send(message));
						},
					},
					faults: {
						...faults,
						async failNext(kind) {
							await faults.failNext(kind);
							await faults.failNext(kind);
						},
					},
				};
			},
		};

		expect(
			await failureOf(runMailerCase(byId('failure.outage'), retryingInVain)),
		).toContain('the transport retried a failed hand-over');
		expect(
			await failureOf(runMailerCase(byId('failure.refusal'), retryingInVain)),
		).toContain('the transport retried a refused message');
	});

	it('reports the case failure when close fails too', async () => {
		const closeFails: MailerHarness = {
			async open() {
				return {
					mailer: {
						async send() {
							return { messageId: '' };
						},
					},
					delivered: async () => [],
					close: async () => {
						throw new Error('connection already closed');
					},
				};
			},
		};

		expect(
			await failureOf(runMailerCase(byId('send.answersSentMail'), closeFails)),
		).toContain('messageId must be a non-empty string or null');
	});

	it('fails a transport whose name lets a second recipient through', async () => {
		const naive: MailerHarness = {
			async open() {
				const opened = await referenceMailerHarness().open();
				let to: string[] = [];
				return {
					...opened,
					mailer: {
						async send(message) {
							// Pastes the name into the header, unquoted, and reads it back.
							const [first] = Array.isArray(message.to)
								? message.to
								: [message.to];
							const header =
								typeof first === 'string'
									? first
									: `${first?.name} <${first?.address}>`;
							to = [...header.matchAll(/<([^>]+)>/g)].map((m) => m[1] ?? '');
							return { messageId: null };
						},
					},
					delivered: async () => [{ ...sampleMessage, to }],
				};
			},
		};

		expect(
			await failureOf(runMailerCase(byId('send.hostileName'), naive)),
		).toContain('a name let a second recipient through');
	});

	it('fails a failure case when the harness has no faults and did not say so', async () => {
		const { declared, runner } = recordingRunner();
		describeMailer({ name: 'x', harness: withoutFaults(), runner });
		const outage = declared.find((d) => d.name.startsWith('failure.outage'));

		expect(outage?.skipped).toBe(false);
		expect(await failureOf(outage?.body() ?? Promise.resolve())).toContain(
			'conformance: failure.outage: faults not provided',
		);
	});

	it('skips the failure cases, with the reason in their name, on faults: false', () => {
		const { declared, runner } = recordingRunner();
		describeMailer({
			name: 'x',
			harness: withoutFaults(),
			runner,
			faults: false,
		});
		const skipped = declared.filter((d) => d.skipped).map((d) => d.name);

		expect(skipped).toHaveLength(failureCases.length);
		for (const name of skipped)
			expect(name).toContain(MAILER_SKIP_REASONS.faults);
	});

	it('closes the transport after a case, even one that fails', async () => {
		let closed = 0;
		const failing: MailerHarness = {
			async open() {
				return {
					mailer: {
						async send() {
							throw new Error('boom');
						},
					},
					delivered: async () => [],
					close: async () => {
						closed += 1;
					},
				};
			},
		};

		await failureOf(runMailerCase(byId('send.answersSentMail'), failing));
		expect(closed).toBe(1);
	});

	it('refuses to run without a runner when the framework defines no global one', () => {
		const globals = globalThis as { describe?: unknown; it?: unknown };
		const saved = { describe: globals.describe, it: globals.it };
		globals.describe = undefined;
		globals.it = undefined;
		try {
			expect(() =>
				describeMailer({ name: 'x', harness: referenceMailerHarness() }),
			).toThrow(
				new TypeError(
					'describeMailer: no test runner found — pass runner: { describe, it } from your test framework',
				),
			);
		} finally {
			globals.describe = saved.describe;
			globals.it = saved.it;
		}
	});
});

function withoutFaults(): MailerHarness {
	return {
		async open() {
			const { faults: _, ...opened } = await referenceMailerHarness().open();
			return opened;
		},
	};
}
