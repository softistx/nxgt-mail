import { describe, expect, it, test } from 'bun:test';
import type { AddressInfo } from 'node:net';
import { MailFailure, MailRefused } from '@nxgt/mail';
import {
	type DeliveredMail,
	describeMailer,
	type MailerHarness,
	sampleMessage,
} from '@nxgt/mail/conformance';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { SMTPServer } from 'smtp-server';
import { createSmtpMailer, type SmtpTransporter } from './index';

type Fault =
	| 'outage'
	| 'refusal'
	| 'auth'
	| 'rcptRefused'
	| 'rcptLater'
	| 'senderRefused';

const PASSWORD = 'smtp-5ecr3t';

/** A local SMTP server that keeps what it receives, and fails on demand. */
async function startServer(
	options: {
		readonly auth?: boolean;
		/** The code it answers to `RCPT TO` for these recipients, every time. */
		readonly refuse?: Readonly<Record<string, number>>;
		/** The largest message it takes, in bytes; a larger one is refused with `552`. */
		readonly size?: number;
	} = {},
) {
	const delivered: DeliveredMail[] = [];
	const faults: Fault[] = [];
	let attempts = 0;
	const smtpError = (message: string, responseCode: number) =>
		Object.assign(new Error(message), { responseCode });

	const server = new SMTPServer({
		authOptional: options.auth !== true,
		...(options.size === undefined ? {} : { size: options.size }),
		allowInsecureAuth: true,
		disabledCommands: ['STARTTLS'],
		logger: false,
		onAuth(auth, _session, callback) {
			if (auth.password === PASSWORD)
				return callback(null, { user: auth.username });
			callback(smtpError('Authentication credentials invalid', 535));
		},
		onRcptTo(address, _session, callback) {
			const code = options.refuse?.[address.address];
			if (code !== undefined) {
				return callback(smtpError('Mailbox refused', code));
			}
			const fault = faults[0];
			if (fault === 'rcptRefused') {
				faults.shift();
				return callback(smtpError('Mailbox unavailable', 550));
			}
			if (fault === 'rcptLater') {
				faults.shift();
				return callback(smtpError('Mailbox busy, try later', 450));
			}
			callback();
		},
		onMailFrom(_address, _session, callback) {
			attempts += 1;
			const fault = faults[0];
			if (fault === 'outage') {
				faults.shift();
				return callback(smtpError('Service not available', 421));
			}
			if (fault === 'auth') {
				faults.shift();
				return callback(smtpError('Authentication required', 530));
			}
			if (fault === 'senderRefused') {
				faults.shift();
				return callback(smtpError('Sender address rejected', 550));
			}
			callback();
		},
		onData(stream, session, callback) {
			const refuse = faults[0] === 'refusal';
			if (refuse) faults.shift();
			// skipImageLinks: mailparser would otherwise rewrite each cid: in the
			// HTML as a data: URL, and read back HTML that was never sent.
			simpleParser(stream, { skipImageLinks: true }).then(
				(parsed) => {
					if (refuse) {
						return callback(smtpError('Message rejected as spam', 554));
					}
					if (stream.sizeExceeded) {
						return callback(
							smtpError('Message exceeds fixed maximum message size', 552),
						);
					}
					delivered.push({
						to: session.envelope.rcptTo.map((rcpt) => rcpt.address),
						subject: parsed.subject ?? '',
						html: typeof parsed.html === 'string' ? parsed.html : '',
						text: parsed.text ?? '',
						attachments: parsed.attachments.map((file) => ({
							filename: file.filename ?? '',
							content: new Uint8Array(file.content),
							contentType: file.contentType,
							// mailparser reads the Content-ID without its angle brackets.
							...(file.cid === undefined ? {} : { contentId: file.cid }),
						})),
					});
					callback();
				},
				(error: Error) => callback(error),
			);
		},
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const { port } = server.server.address() as AddressInfo;
	return {
		port,
		delivered,
		faults,
		attempts: () => attempts,
		close: () => new Promise<void>((resolve) => server.close(() => resolve())),
	};
}

const transporterFor = (port: number, pass?: string) =>
	nodemailer.createTransport({
		host: '127.0.0.1',
		port,
		secure: false,
		ignoreTLS: true,
		...(pass === undefined ? {} : { auth: { user: 'acme', pass } }),
	});

const harness: MailerHarness = {
	async open() {
		const server = await startServer();
		const transporter = transporterFor(server.port);
		return {
			mailer: createSmtpMailer({ transporter }),
			delivered: async () => [...server.delivered],
			faults: {
				async failNext(kind) {
					server.faults.push(kind);
				},
				async attempts() {
					return server.attempts();
				},
			},
			async close() {
				transporter.close();
				await server.close();
			},
		};
	},
};

describeMailer({
	name: 'createSmtpMailer',
	harness,
	runner: { describe, it },
});

describe('createSmtpMailer, beyond the suite', () => {
	test('a server that cannot be reached ends in MailFailure, with the cause', async () => {
		const server = await startServer();
		const { port } = server;
		await server.close();
		const mailer = createSmtpMailer({ transporter: transporterFor(port) });
		const error = await mailer.send(sampleMessage).then(
			() => null,
			(caught: unknown) => caught,
		);
		expect(error).toBeInstanceOf(MailFailure);
		expect((error as MailFailure).message).toBe(
			'send: the SMTP server could not take the message',
		);
		expect(((error as MailFailure).cause as { code?: string }).code).toBe(
			'ESOCKET',
		);
	});

	test('an authentication refusal is a failure, not a refusal of the message', async () => {
		const server = await startServer();
		const transporter = transporterFor(server.port);
		try {
			server.faults.push('auth');
			const error = await createSmtpMailer({ transporter })
				.send(sampleMessage)
				.then(
					() => null,
					(caught: unknown) => caught,
				);
			expect(error).toBeInstanceOf(MailFailure);
			expect(
				((error as MailFailure).cause as { responseCode?: number })
					.responseCode,
			).toBe(530);
		} finally {
			transporter.close();
			await server.close();
		}
	});

	/** Sends the sample message through a fresh server, and answers what it threw. */
	async function sendWith(
		fault: Fault | null,
		options: { readonly auth?: boolean; readonly pass?: string } = {},
	) {
		const server = await startServer(options);
		const transporter = transporterFor(server.port, options.pass);
		try {
			if (fault !== null) server.faults.push(fault);
			const error = await createSmtpMailer({ transporter })
				.send(sampleMessage)
				.then(
					() => null,
					(caught: unknown) => caught as Error,
				);
			return { error, delivered: server.delivered.length };
		} finally {
			transporter.close();
			await server.close();
		}
	}

	test('a recipient refused for good (550) is a refusal of the message', async () => {
		const { error, delivered } = await sendWith('rcptRefused');
		expect(error).toBeInstanceOf(MailRefused);
		expect(error?.message).toBe('send: the SMTP server refused the message');
		expect(error?.cause).toMatchObject({
			code: 'EENVELOPE',
			responseCode: 550,
		});
		expect(delivered).toBe(0);
	});

	test('a recipient refused for now (450) is a failure: sending later may work', async () => {
		const { error } = await sendWith('rcptLater');
		expect(error).toBeInstanceOf(MailFailure);
		expect(error?.cause).toMatchObject({ responseCode: 450 });
	});

	test('a server that closes the door (421) is a failure', async () => {
		const { error } = await sendWith('outage');
		expect(error).toBeInstanceOf(MailFailure);
		expect(error?.cause).toMatchObject({ responseCode: 421 });
	});

	test('credentials refused (535) are a failure, and no message holds the password or a recipient', async () => {
		const { error } = await sendWith(null, {
			auth: true,
			pass: 'wrong-5ecr3t',
		});
		expect(error).toBeInstanceOf(MailFailure);
		expect(error?.cause).toMatchObject({ code: 'EAUTH', responseCode: 535 });
		for (const fault of ['rcptRefused', 'refusal', 'outage'] as const) {
			const other = await sendWith(fault);
			expect(other.error?.message).not.toContain('ada@example.test');
		}
		expect(error?.message).not.toContain('wrong-5ecr3t');
		expect(error?.message).not.toContain('ada@example.test');
	});

	test('sends with the right credentials', async () => {
		const { error, delivered } = await sendWith(null, {
			auth: true,
			pass: PASSWORD,
		});
		expect(error).toBeNull();
		expect(delivered).toBe(1);
	});

	test('answers the id nodemailer gives, and sends from the default sender', async () => {
		const server = await startServer();
		const transporter = transporterFor(server.port);
		try {
			const mailer = createSmtpMailer({
				transporter,
				from: { name: 'Acme', address: 'noreply@acme.test' },
			});
			const { from: _, ...withoutFrom } = sampleMessage;
			const sent = await mailer.send({
				...withoutFrom,
				replyTo: 'support@acme.test',
				headers: { 'List-Unsubscribe': '<https://acme.test/u>' },
			});
			expect(sent.messageId).toMatch(/^<.+@.+>$/);
			expect(server.delivered).toHaveLength(1);
		} finally {
			transporter.close();
			await server.close();
		}
	});

	test('refuses a message with no sender, before any hand-over', async () => {
		const sendMail = () => {
			throw new Error('the transporter must not be called');
		};
		const { from: _, ...withoutFrom } = sampleMessage;
		const error = await createSmtpMailer({ transporter: { sendMail } })
			.send(withoutFrom)
			.then(
				() => null,
				(caught: unknown) => caught,
			);
		expect(error).toBeInstanceOf(MailRefused);
		expect((error as MailRefused).message).toBe(
			'send: from is missing — give the message a from, or createSmtpMailer a default one',
		);
	});

	test('refuses a scheduled message, before any hand-over: SMTP cannot schedule', async () => {
		const sendMail = () => {
			throw new Error('the transporter must not be called');
		};
		const error = await createSmtpMailer({ transporter: { sendMail } })
			.send({
				...sampleMessage,
				scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
			})
			.then(
				() => null,
				(caught: unknown) => caught,
			);
		expect(error).toBeInstanceOf(MailRefused);
		expect((error as MailRefused).message).toBe(
			'send: scheduledAt is not supported — SMTP has no way to schedule a send, and sending it now would be wrong',
		);
	});

	test('reads no file and no URL a part could name', async () => {
		let options: Record<string, unknown> = {};
		await createSmtpMailer({
			transporter: {
				async sendMail(mail) {
					options = mail;
					return {};
				},
			},
		}).send(sampleMessage);
		expect(options).toMatchObject({
			disableFileAccess: true,
			disableUrlAccess: true,
		});
	});

	test('hands the attachments to nodemailer as bytes, never as a path or a URL', async () => {
		let options: Record<string, unknown> = {};
		const content = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
		await createSmtpMailer({
			transporter: {
				async sendMail(mail) {
					options = mail;
					content[0] = 0; // the caller changing its bytes mid-send
					return {};
				},
			},
		}).send({
			...sampleMessage,
			attachments: [
				{ filename: 'invoice.pdf', content, contentType: 'application/pdf' },
			],
		});
		const [attachment] = options.attachments as {
			filename: string;
			content: Buffer;
			contentType: string;
		}[];
		expect(Object.keys(attachment ?? {}).sort()).toEqual([
			'content',
			'contentType',
			'filename',
		]);
		expect(Buffer.isBuffer(attachment?.content)).toBe(true);
		expect([...(attachment?.content ?? [])]).toEqual([0x25, 0x50, 0x44, 0x46]);
		expect(options).toMatchObject({
			disableFileAccess: true,
			disableUrlAccess: true,
		});
	});

	test("hands an inline image's content id to nodemailer as its cid", async () => {
		let options: Record<string, unknown> = {};
		await createSmtpMailer({
			transporter: {
				async sendMail(mail) {
					options = mail;
					return {};
				},
			},
		}).send({
			...sampleMessage,
			html: '<img src="cid:logo@acme.test">',
			attachments: [
				{
					filename: 'logo.png',
					content: new Uint8Array([0x89]),
					contentType: 'image/png',
					contentId: 'logo@acme.test',
				},
				{
					filename: 'invoice.pdf',
					content: new Uint8Array([0x25]),
					contentType: 'application/pdf',
				},
			],
		});
		const [logo, invoice] = options.attachments as Record<string, unknown>[];
		expect(logo?.cid).toBe('logo@acme.test');
		expect(invoice !== undefined && 'cid' in invoice).toBe(false);
	});

	test('sends no attachments field for an empty list', async () => {
		let options: Record<string, unknown> = {};
		await createSmtpMailer({
			transporter: {
				async sendMail(mail) {
					options = mail;
					return {};
				},
			},
		}).send({ ...sampleMessage, attachments: [] });
		expect('attachments' in options).toBe(false);
	});

	test('ignores the tags: SMTP has none, so nothing names them', async () => {
		let options: Record<string, unknown> = {};
		await createSmtpMailer({
			transporter: {
				async sendMail(mail) {
					options = mail;
					return {};
				},
			},
		}).send({ ...sampleMessage, tags: { category: 'receipt-7f3a' } });
		expect(JSON.stringify(options)).not.toContain('receipt-7f3a');
	});

	test('ignores the idempotency key: SMTP has none, so nothing names it', async () => {
		const handed: Record<string, unknown>[] = [];
		const mailer = createSmtpMailer({
			transporter: {
				async sendMail(mail) {
					handed.push(mail);
					return {};
				},
			},
		});
		const once = { ...sampleMessage, idempotencyKey: 'order-42/receipt' };
		await mailer.send(once);
		await mailer.send(once);
		expect(handed).toHaveLength(2);
		expect(JSON.stringify(handed)).not.toContain('order-42/receipt');
	});

	test('a message too large for the server (552) is a refusal of the message', async () => {
		const server = await startServer({ size: 16 * 1024 });
		const transporter = transporterFor(server.port);
		try {
			const error = await createSmtpMailer({ transporter })
				.send({
					...sampleMessage,
					attachments: [
						{
							filename: 'large.bin',
							content: new Uint8Array(64 * 1024),
							contentType: 'application/octet-stream',
						},
					],
				})
				.then(
					() => null,
					(caught: unknown) => caught as Error,
				);
			expect(error).toBeInstanceOf(MailRefused);
			expect(error?.message).toBe('send: the SMTP server refused the message');
			expect(error?.cause).toMatchObject({ responseCode: 552 });
			expect(server.delivered).toHaveLength(0);
		} finally {
			transporter.close();
			await server.close();
		}
	});

	test('answers null when nodemailer gives no id', async () => {
		const sent = await createSmtpMailer({
			transporter: { sendMail: async () => ({}) },
		}).send(sampleMessage);
		expect(sent).toEqual({ messageId: null });
	});

	test('refuses a wiring mistake with a TypeError', () => {
		expect(() =>
			createSmtpMailer(
				undefined as unknown as { transporter: SmtpTransporter },
			),
		).toThrow(
			new TypeError(
				'createSmtpMailer: options must be an object, as { transporter }',
			),
		);
		expect(() =>
			createSmtpMailer({ transporter: {} as SmtpTransporter }),
		).toThrow(
			new TypeError(
				'createSmtpMailer: transporter must be what nodemailer.createTransport(…) answers',
			),
		);
		expect(() =>
			createSmtpMailer({
				transporter: { sendMail: async () => ({}) },
				from: 'Acme <noreply@acme.test>',
			}),
		).toThrow(
			new TypeError(
				'createSmtpMailer: from must be an e-mail address, as noreply@example.com or { name, address }',
			),
		);
	});
	/** Sends to ada and grace through a server that answers `refuse` for some. */
	async function sendToTwo(refuse: Readonly<Record<string, number>>) {
		const server = await startServer({ refuse });
		const transporter = transporterFor(server.port);
		try {
			const error = await createSmtpMailer({ transporter })
				.send({
					...sampleMessage,
					to: ['ada@example.test', 'grace@example.test'],
				})
				.then(
					() => null,
					(caught: unknown) => caught as Error,
				);
			return { error, delivered: server.delivered };
		} finally {
			transporter.close();
			await server.close();
		}
	}

	test('one recipient refused for good (550) while another is accepted: MailRefused, though the other may have it', async () => {
		const { error, delivered } = await sendToTwo({
			'grace@example.test': 550,
		});
		expect(error).toBeInstanceOf(MailRefused);
		expect(error?.message).toBe(
			'send: the SMTP server refused 1 of 2 recipients, and may have delivered to the others',
		);
		expect(error?.cause).toMatchObject({
			code: 'EENVELOPE',
			responseCode: 550,
			command: 'RCPT TO',
		});
		// Not "nothing was sent": the accepted recipient got it.
		expect(delivered.map((mail) => mail.to)).toEqual([['ada@example.test']]);
	});

	test('one recipient refused for now (450) while another is accepted: MailFailure', async () => {
		const { error, delivered } = await sendToTwo({
			'grace@example.test': 450,
		});
		expect(error).toBeInstanceOf(MailFailure);
		expect(error?.message).toBe(
			'send: the SMTP server could not take 1 of 2 recipients, and may have delivered to the others',
		);
		expect(error?.cause).toMatchObject({ responseCode: 450 });
		expect(delivered).toHaveLength(1);
	});

	test('every recipient refused, one for good and the last for now: MailFailure, whatever the order', async () => {
		for (const refuse of [
			{ 'ada@example.test': 450, 'grace@example.test': 550 },
			{ 'ada@example.test': 550, 'grace@example.test': 450 },
		]) {
			const { error, delivered } = await sendToTwo(refuse);
			expect(error).toBeInstanceOf(MailFailure);
			expect(error?.message).toBe(
				'send: the SMTP server could not take the message',
			);
			expect(delivered).toHaveLength(0);
		}
	});

	test('every recipient refused for good: MailRefused', async () => {
		const { error } = await sendToTwo({
			'ada@example.test': 550,
			'grace@example.test': 553,
		});
		expect(error).toBeInstanceOf(MailRefused);
		expect(error?.message).toBe('send: the SMTP server refused the message');
	});

	test('the sender refused for good (550 on MAIL FROM) is a failure: every message would be', async () => {
		const { error } = await sendWith('senderRefused');
		expect(error).toBeInstanceOf(MailFailure);
		expect(error?.cause).toMatchObject({
			command: 'MAIL FROM',
			responseCode: 550,
		});
	});

	test('hands a string address to nodemailer as an object, so it never parses it', async () => {
		let options: Record<string, unknown> = {};
		await createSmtpMailer({
			transporter: {
				async sendMail(mail) {
					options = mail;
					return {};
				},
			},
		}).send({
			...sampleMessage,
			to: [
				'ada@example.test',
				{ name: 'Grace', address: 'grace@example.test' },
			],
			from: 'noreply@example.test',
			replyTo: 'support@example.test',
		});
		expect(options).toMatchObject({
			to: [
				{ name: '', address: 'ada@example.test' },
				{ name: 'Grace', address: 'grace@example.test' },
			],
			from: { name: '', address: 'noreply@example.test' },
			replyTo: { name: '', address: 'support@example.test' },
		});
	});
});
