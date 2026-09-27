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

type Fault = 'outage' | 'refusal' | 'auth' | 'rcptRefused' | 'rcptLater';

const PASSWORD = 'smtp-5ecr3t';

/** A local SMTP server that keeps what it receives, and fails on demand. */
async function startServer(options: { readonly auth?: boolean } = {}) {
	const delivered: DeliveredMail[] = [];
	const faults: Fault[] = [];
	let attempts = 0;
	const smtpError = (message: string, responseCode: number) =>
		Object.assign(new Error(message), { responseCode });

	const server = new SMTPServer({
		authOptional: options.auth !== true,
		allowInsecureAuth: true,
		disabledCommands: ['STARTTLS'],
		logger: false,
		onAuth(auth, _session, callback) {
			if (auth.password === PASSWORD)
				return callback(null, { user: auth.username });
			callback(smtpError('Authentication credentials invalid', 535));
		},
		onRcptTo(_address, _session, callback) {
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
			callback();
		},
		onData(stream, session, callback) {
			const refuse = faults[0] === 'refusal';
			if (refuse) faults.shift();
			simpleParser(stream).then(
				(parsed) => {
					if (refuse) {
						return callback(smtpError('Message rejected as spam', 554));
					}
					delivered.push({
						to: session.envelope.rcptTo.map((rcpt) => rcpt.address),
						subject: parsed.subject ?? '',
						html: typeof parsed.html === 'string' ? parsed.html : '',
						text: parsed.text ?? '',
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
});
