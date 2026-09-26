import { describe, expect, it } from 'bun:test';
import { MailFailure, MailRefused } from './errors';
import { createMemoryMailer } from './memory';
import type { MailMessage } from './types';

const message: MailMessage = {
	to: 'ada@example.test',
	subject: 'Hello',
	html: '<p>Hello</p>',
	text: 'Hello',
};

describe('createMemoryMailer', () => {
	it('keeps what it sends, with the id it answered', async () => {
		const mailer = createMemoryMailer();

		const first = await mailer.send(message);
		const second = await mailer.send({ ...message, subject: 'Again' });

		expect(first.messageId).toBe('memory-1');
		expect(second.messageId).toBe('memory-2');
		expect(mailer.sent.map((m) => [m.messageId, m.subject])).toEqual([
			['memory-1', 'Hello'],
			['memory-2', 'Again'],
		]);
	});

	it('hands out copies, so a test cannot change what was sent by accident', async () => {
		const mailer = createMemoryMailer();
		const headers = { 'X-Ref': 'a' };
		await mailer.send({ ...message, headers });
		headers['X-Ref'] = 'changed';

		const [sent] = mailer.sent as unknown as {
			headers?: Record<string, string>;
		}[];
		if (sent?.headers) sent.headers['X-Ref'] = 'mutated';

		expect(mailer.sent[0]?.headers).toEqual({ 'X-Ref': 'a' });
	});

	it('fails the next send when told to, with a MailFailure by default', async () => {
		const mailer = createMemoryMailer();
		mailer.failNext();

		const error = await mailer.send(message).then(
			() => null,
			(e: unknown) => e,
		);

		expect(error).toBeInstanceOf(MailFailure);
		// A cause, as the conformance suite demands of an outage.
		expect((error as MailFailure).cause).toBeInstanceOf(Error);
		expect(mailer.sent).toEqual([]);
		expect(mailer.attempts).toBe(1);
		// Only the next one: the one after goes through.
		await mailer.send(message);
		expect(mailer.sent).toHaveLength(1);
	});

	it('queues failures, and throws the error it was given', async () => {
		const mailer = createMemoryMailer();
		const refused = new MailRefused('send: refused');
		mailer.failNext(refused);
		mailer.failNext();

		const first = await mailer.send(message).then(
			() => null,
			(e: unknown) => e,
		);
		const second = await mailer.send(message).then(
			() => null,
			(e: unknown) => e,
		);

		expect(first).toBe(refused);
		expect(second).toBeInstanceOf(MailFailure);
	});

	it('refuses a malformed message before the hand-over', async () => {
		const mailer = createMemoryMailer();
		mailer.failNext();

		const error = await mailer.send({ ...message, to: [] }).then(
			() => null,
			(e: unknown) => e,
		);

		expect(error).toBeInstanceOf(MailRefused);
		expect(mailer.attempts).toBe(0);
		// The queued failure is still waiting for a send that reaches the hand-over.
		await mailer.send(message).then(
			() => null,
			() => null,
		);
		expect(mailer.attempts).toBe(1);
		expect(mailer.sent).toEqual([]);
	});

	it('forgets everything on clear', async () => {
		const mailer = createMemoryMailer();
		await mailer.send(message);
		mailer.failNext();
		mailer.clear();

		await mailer.send(message);
		expect(mailer.sent).toHaveLength(1);
		expect(mailer.attempts).toBe(1);
	});
});
