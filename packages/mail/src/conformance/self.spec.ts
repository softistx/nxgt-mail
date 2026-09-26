import { describe, expect, it } from 'bun:test';
import { MailFailure } from '../errors';
import { createMemoryMailer } from '../memory';
import { allMailerCases } from './cases';
import { describeMailer, MAILER_SKIP_REASONS, runMailerCase } from './describe';
import { referenceMailerHarness } from './reference';
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
		const withoutFaults: MailerHarness = {
			async open() {
				const { faults: _, ...opened } = await referenceMailerHarness().open();
				return opened;
			},
		};
		const outage = allMailerCases.find((c) => c.id === 'failure.outage');
		if (outage === undefined) throw new Error('failure.outage is missing');

		expect(await runMailerCase(outage, withoutFaults)).toEqual({
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
