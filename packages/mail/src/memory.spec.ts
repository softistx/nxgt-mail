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

	it('keeps the attachments, with a copy of their bytes', async () => {
		const mailer = createMemoryMailer();
		const content = new Uint8Array([1, 2, 3]);
		await mailer.send({
			...message,
			attachments: [
				{ filename: 'a.bin', content, contentType: 'application/octet-stream' },
			],
		});
		content[0] = 9;
		const [sent] = mailer.sent;
		sent?.attachments?.[0]?.content.fill(7);

		expect(mailer.sent[0]?.attachments).toEqual([
			{
				filename: 'a.bin',
				content: new Uint8Array([1, 2, 3]),
				contentType: 'application/octet-stream',
			},
		]);
	});

	it('keeps the content id of an inline image', async () => {
		const mailer = createMemoryMailer();
		await mailer.send({
			...message,
			html: '<img src="cid:logo">',
			attachments: [
				{
					filename: 'logo.png',
					content: new Uint8Array([1]),
					contentType: 'image/png',
					contentId: 'logo',
				},
			],
		});
		expect(mailer.sent[0]?.attachments?.[0]?.contentId).toBe('logo');
	});

	it('keeps only the bytes of a Buffer, not the pool it is a view on', async () => {
		const mailer = createMemoryMailer();
		const content = Buffer.from('%PDF');
		await mailer.send({
			...message,
			attachments: [
				{ filename: 'a.pdf', content, contentType: 'application/pdf' },
			],
		});

		const kept = mailer.sent[0]?.attachments?.[0]?.content;
		expect(kept?.byteLength).toBe(4);
		expect(kept?.buffer.byteLength).toBe(4);
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

	it('delivers a message once per idempotency key, answering the first id', async () => {
		const mailer = createMemoryMailer();
		const once = { ...message, idempotencyKey: 'order-42/receipt' };

		const first = await mailer.send(once);
		const again = await mailer.send({ ...once });
		const other = await mailer.send({ ...once, idempotencyKey: 'order-43' });
		const unkeyed = await mailer.send(message);

		expect(again).toEqual(first);
		expect(other.messageId).not.toBe(first.messageId);
		expect(unkeyed.messageId).not.toBe(first.messageId);
		expect(mailer.sent).toHaveLength(3);
		expect(mailer.sent[0]?.idempotencyKey).toBe('order-42/receipt');
		// Each send reached the hand-over: a retry is still an attempt.
		expect(mailer.attempts).toBe(4);
	});

	it('refuses a different message under a key it already delivered, as Resend does', async () => {
		const mailer = createMemoryMailer();
		const pdf = {
			filename: 'receipt.pdf',
			content: new Uint8Array([1, 2]),
			contentType: 'application/pdf',
		};
		await mailer.send({ ...message, idempotencyKey: 'k', attachments: [pdf] });

		for (const different of [
			{ ...message, subject: 'Other' },
			{
				...message,
				attachments: [{ ...pdf, content: new Uint8Array([1, 3]) }],
			},
			{ ...message, attachments: [{ ...pdf, contentId: 'receipt' }] },
		]) {
			const error = await mailer
				.send({
					...different,
					idempotencyKey: 'k',
					attachments: different.attachments ?? [pdf],
				})
				.then(
					() => null,
					(e: unknown) => e,
				);
			expect(error).toBeInstanceOf(MailRefused);
			expect((error as MailRefused).message).toBe(
				'send: idempotencyKey was already used for a different message — a key names one e-mail',
			);
		}
		expect(mailer.sent).toHaveLength(1);
	});

	it('knows a retry written differently for the same message', async () => {
		const mailer = createMemoryMailer();
		const bytes = [37, 80, 68, 70];
		const first = await mailer.send({
			...message,
			idempotencyKey: 'k',
			attachments: [
				{
					filename: 'a.pdf',
					content: Buffer.from(bytes),
					contentType: 'application/pdf',
				},
			],
		});
		const retried = await mailer.send({
			idempotencyKey: 'k',
			text: message.text,
			html: message.html,
			subject: message.subject,
			to: [message.to as string],
			attachments: [
				{
					contentType: 'application/pdf',
					content: new Uint8Array(bytes),
					filename: 'a.pdf',
				},
			],
		});
		const unattached = await mailer.send({ ...message, idempotencyKey: 'u' });
		const emptied = await mailer.send({
			...message,
			idempotencyKey: 'u',
			attachments: [],
			headers: {},
		});
		const ordered = await mailer.send({
			...message,
			idempotencyKey: 'h',
			headers: { 'X-A': '1', 'X-B': '2' },
		});
		const reordered = await mailer.send({
			...message,
			idempotencyKey: 'h',
			headers: { 'X-B': '2', 'X-A': '1' },
			// Not a field of the port: never part of the message, and never walked.
			extra: (() => {
				const loop: Record<string, unknown> = {};
				loop.self = loop;
				return loop;
			})(),
		} as MailMessage);

		expect(retried).toEqual(first);
		expect(emptied).toEqual(unattached);
		expect(reordered).toEqual(ordered);
		expect(mailer.sent).toHaveLength(3);
	});

	it('sees a field the message inherits, as checkMessage does', async () => {
		const mailer = createMemoryMailer();
		const inherited = (subject: string) =>
			Object.assign(Object.create({ subject }), {
				to: message.to,
				html: message.html,
				text: message.text,
				idempotencyKey: 'k',
			}) as MailMessage;

		await mailer.send(inherited('one'));
		const error = await mailer.send(inherited('two')).then(
			() => null,
			(e: unknown) => e,
		);

		expect(error).toBeInstanceOf(MailRefused);
	});

	it('leaves the key of a failed send free, so the retry delivers', async () => {
		const mailer = createMemoryMailer();
		const once = { ...message, idempotencyKey: 'order-42' };
		mailer.failNext();

		await mailer.send(once).then(
			() => null,
			() => null,
		);
		const retried = await mailer.send(once);

		expect(retried.messageId).toBe('memory-1');
		expect(mailer.sent).toHaveLength(1);
	});

	it('forgets everything on clear', async () => {
		const mailer = createMemoryMailer();
		await mailer.send(message);
		await mailer.send({ ...message, idempotencyKey: 'k' });
		mailer.failNext();
		mailer.clear();

		await mailer.send(message);
		await mailer.send({ ...message, idempotencyKey: 'k' });
		expect(mailer.sent).toHaveLength(2);
		expect(mailer.attempts).toBe(2);
	});
});
