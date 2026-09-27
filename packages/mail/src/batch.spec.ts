import { describe, expect, it } from 'bun:test';
import { sendBatch } from './batch';
import { MailFailure, MailRefused } from './errors';
import { createMemoryMailer } from './memory';
import type { MailBatchResult, Mailer, MailMessage, SentMail } from './types';

const message = (subject: string): MailMessage => ({
	to: 'ada@example.test',
	subject,
	html: '<p>Hello</p>',
	text: 'Hello',
});

describe('sendBatch, the fallback path — a Mailer with no sendBatch of its own', () => {
	it('sends each message in turn over send, in order, and reports each sent', async () => {
		const mailer = createMemoryMailer();
		const messages = [message('A'), message('B'), message('C')];
		const results = await sendBatch(mailer, messages);
		expect(results).toHaveLength(3);
		for (const result of results) expect(result.status).toBe('sent');
		expect(mailer.sent.map((mail) => mail.subject)).toEqual(['A', 'B', 'C']);
	});

	it('checks every message before any of them is sent: a refusal near the end never reaches the transport, and is reported on its own', async () => {
		const mailer = createMemoryMailer();
		const messages = [
			message('A'),
			{ ...message('Bad'), to: [] },
			message('C'),
		];
		const results = await sendBatch(mailer, messages);
		expect(results.map((r) => r.status)).toEqual(['sent', 'refused', 'sent']);
		const refused = results[1];
		if (refused?.status !== 'refused') throw new Error('expected refused');
		expect(refused.error).toBeInstanceOf(MailRefused);
		// Only the two good messages ever reached the transport.
		expect(mailer.sent.map((mail) => mail.subject)).toEqual(['A', 'C']);
	});

	it('reports a MailFailure from send as failed, on its own message, and still sends the rest', async () => {
		const mailer = createMemoryMailer();
		mailer.failNext();
		const results = await sendBatch(mailer, [message('A'), message('B')]);
		expect(results[0]?.status).toBe('failed');
		expect((results[0] as { error: unknown }).error).toBeInstanceOf(
			MailFailure,
		);
		expect(results[1]?.status).toBe('sent');
	});

	it('lets a mailer.send that throws something else than a MailError propagate', async () => {
		const mailer: Mailer = {
			send: () => {
				throw new TypeError('not a MailError');
			},
		};
		await expect(sendBatch(mailer, [message('A')])).rejects.toThrow(
			'not a MailError',
		);
	});

	it('refuses messages that is not an array, and a mailer that is not a Mailer', () => {
		const mailer = createMemoryMailer();
		expect(sendBatch(mailer, 'x' as unknown as MailMessage[])).rejects.toThrow(
			TypeError,
		);
		expect(sendBatch({} as Mailer, [])).rejects.toThrow(TypeError);
	});

	it('answers an empty array for an empty batch, without calling send', async () => {
		const mailer = createMemoryMailer();
		expect(await sendBatch(mailer, [])).toEqual([]);
		expect(mailer.attempts).toBe(0);
	});
});

describe('sendBatch, delegating to a Mailer with its own sendBatch', () => {
	it('calls it with only the messages that passed checkMessage, and maps the refused ones back by index', async () => {
		const received: MailMessage[][] = [];
		const mailer: Mailer = {
			async send(): Promise<SentMail> {
				return { messageId: null };
			},
			async sendBatch(messages): Promise<readonly MailBatchResult[]> {
				received.push([...messages]);
				return messages.map(() => ({
					status: 'sent',
					sentMail: { messageId: 'native' },
				}));
			},
		};
		const messages = [
			message('A'),
			{ ...message('Bad'), to: [] },
			message('C'),
		];
		const results = await sendBatch(mailer, messages);
		expect(received).toEqual([[message('A'), message('C')]]);
		expect(results.map((r) => r.status)).toEqual(['sent', 'refused', 'sent']);
	});

	it('does not call sendBatch at all when every message is refused', async () => {
		let called = false;
		const mailer: Mailer = {
			async send(): Promise<SentMail> {
				return { messageId: null };
			},
			async sendBatch(messages): Promise<readonly MailBatchResult[]> {
				called = true;
				return messages.map(() => ({
					status: 'sent',
					sentMail: { messageId: 'x' },
				}));
			},
		};
		const results = await sendBatch(mailer, [{ ...message('Bad'), to: [] }]);
		expect(called).toBe(false);
		expect(results.map((r) => r.status)).toEqual(['refused']);
	});
});
