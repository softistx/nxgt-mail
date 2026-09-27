import { describe, expect, it, test } from 'bun:test';
import { MailFailure, MailRefused } from '@nxgt/mail';
import {
	type DeliveredMail,
	describeMailer,
	type MailerHarness,
	sampleMessage,
} from '@nxgt/mail/conformance';
import { createResendMailer, formatAddress } from './index';

const API_KEY = 're_test_5ecr3t';

type Fault =
	| 'outage'
	| 'refusal'
	| 'badRequest'
	| 'tooLarge'
	| 'rateLimit'
	| 'keyRefused'
	| 'noId'
	| 'notJson'
	| 'hang';

/** One request as Resend received it. */
interface Received {
	readonly method: string;
	readonly path: string;
	readonly headers: Headers;
	readonly body: Record<string, unknown>;
}

/**
 * The bare addresses of one `to` entry, read as an RFC 5322 address list —
 * as Resend reads it: a comma or an angle bracket inside a quoted name is
 * part of the name, and names no one.
 */
function addressesIn(entry: string): string[] {
	const found: string[] = [];
	let quoted = false;
	let angle: string | null = null;
	let bare = '';
	for (let i = 0; i < entry.length; i += 1) {
		const char = entry.charAt(i);
		if (quoted) {
			if (char === '\\') i += 1;
			else if (char === '"') quoted = false;
			continue;
		}
		if (angle !== null) {
			if (char === '>') {
				found.push(angle.trim());
				angle = null;
				bare = '';
			} else angle += char;
			continue;
		}
		if (char === '"') quoted = true;
		else if (char === '<') angle = '';
		else if (char === ',') {
			if (bare.trim() !== '') found.push(bare.trim());
			bare = '';
		} else bare += char;
	}
	if (bare.trim() !== '' && !bare.includes(' ')) found.push(bare.trim());
	return found;
}

/**
 * A local server answering as Resend's API does: `POST /emails` with a bearer
 * key, `200 { id }` on success, `{ statusCode, name, message }` otherwise. It
 * keeps what it accepted, and fails on demand the way Resend fails.
 */
function startResend() {
	const received: Received[] = [];
	const delivered: DeliveredMail[] = [];
	const faults: Fault[] = [];
	let attempts = 0;
	const error = (statusCode: number, name: string, message: string) =>
		Response.json({ statusCode, name, message }, { status: statusCode });

	const server = Bun.serve({
		port: 0,
		hostname: '127.0.0.1',
		async fetch(request) {
			const url = new URL(request.url);
			const body = (await request.json().catch(() => ({}))) as Record<
				string,
				unknown
			>;
			received.push({
				method: request.method,
				path: url.pathname,
				headers: request.headers,
				body,
			});
			if (request.method !== 'POST' || url.pathname !== '/emails') {
				return error(
					404,
					'not_found',
					'The requested endpoint does not exist.',
				);
			}
			if (request.headers.get('authorization') !== `Bearer ${API_KEY}`) {
				return error(
					401,
					'missing_api_key',
					'Missing API key in the authorization header.',
				);
			}
			attempts += 1;
			switch (faults.shift()) {
				case 'outage':
					return error(503, 'internal_server_error', 'Service unavailable.');
				case 'refusal':
					return error(
						422,
						'validation_error',
						'Invalid `to` field. The email address needs to follow the `email@example.com` format.',
					);
				case 'badRequest':
					return error(400, 'validation_error', 'Invalid idempotency key.');
				case 'tooLarge':
					return new Response('Request Entity Too Large', { status: 413 });
				case 'rateLimit':
					return error(429, 'rate_limit_exceeded', 'Too many requests.');
				case 'keyRefused':
					return error(403, 'invalid_api_key', 'API key is invalid.');
				case 'noId':
					return Response.json({});
				case 'notJson':
					return new Response('ok', { status: 200 });
				case 'hang':
					await Bun.sleep(1_000);
					return Response.json({ id: 'too-late' });
				default:
			}
			const to = body.to as string[];
			const attachments = (body.attachments ?? []) as {
				filename: string;
				content: string;
				// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
				content_type: string;
			}[];
			delivered.push({
				to: to.flatMap(addressesIn),
				subject: String(body.subject),
				html: String(body.html),
				text: String(body.text),
				// Read back as Resend reads them: the content is base64.
				attachments: attachments.map((file) => ({
					filename: file.filename,
					content: Uint8Array.from(atob(file.content), (char) =>
						char.charCodeAt(0),
					),
					contentType: file.content_type,
				})),
			});
			return Response.json({ id: `resend-${delivered.length}` });
		},
	});
	return {
		baseUrl: `http://127.0.0.1:${server.port}`,
		received,
		delivered,
		faults,
		attempts: () => attempts,
		close: () => server.stop(true),
	};
}

const harness: MailerHarness = {
	async open() {
		const resend = startResend();
		return {
			mailer: createResendMailer({ apiKey: API_KEY, baseUrl: resend.baseUrl }),
			delivered: async () => [...resend.delivered],
			faults: {
				async failNext(kind) {
					resend.faults.push(kind);
				},
				async attempts() {
					return resend.attempts();
				},
			},
			close: () => resend.close(),
		};
	},
};

describeMailer({
	name: 'createResendMailer',
	harness,
	runner: { describe, it },
});

/** Sends the sample message with `fault` injected, and answers what it threw. */
async function sendWith(fault: Fault, timeoutMs?: number) {
	const resend = startResend();
	try {
		resend.faults.push(fault);
		const mailer = createResendMailer({
			apiKey: API_KEY,
			baseUrl: resend.baseUrl,
			...(timeoutMs === undefined ? {} : { timeoutMs }),
		});
		const outcome = await mailer.send(sampleMessage).then(
			(sent) => ({ sent, error: null as unknown }),
			(error: unknown) => ({ sent: null, error }),
		);
		return { ...outcome, attempts: resend.attempts() };
	} finally {
		await resend.close();
	}
}

describe('createResendMailer, refusals and failures', () => {
	test('a 422 is a refusal: MailRefused, with what Resend answered as the cause', async () => {
		const { error } = await sendWith('refusal');
		expect(error).toBeInstanceOf(MailRefused);
		expect((error as MailRefused).message).toBe(
			'send: Resend refused the message',
		);
		expect((error as MailRefused).cause).toMatchObject({
			message: 'Resend answered 422 validation_error',
			status: 422,
			errorName: 'validation_error',
		});
		expect(
			((error as MailRefused).cause as { detail: string }).detail,
		).toStartWith('Invalid `to` field.');
	});

	test('a 400 is a refusal', async () => {
		const { error } = await sendWith('badRequest');
		expect(error).toBeInstanceOf(MailRefused);
	});

	test('a 413 — attachments too large — is a refusal', async () => {
		const { error, attempts } = await sendWith('tooLarge');
		expect(error).toBeInstanceOf(MailRefused);
		expect((error as MailRefused).cause).toMatchObject({
			message: 'Resend answered 413',
			status: 413,
			errorName: null,
		});
		expect(attempts).toBe(1);
	});

	for (const [fault, status] of [
		['outage', 503],
		['rateLimit', 429],
		['keyRefused', 403],
	] as const) {
		test(`a ${status} is a failure: MailFailure, with the status on the cause, tried once`, async () => {
			const { error, attempts } = await sendWith(fault);
			expect(error).toBeInstanceOf(MailFailure);
			expect((error as MailFailure).message).toBe(
				'send: Resend could not take the message',
			);
			expect((error as MailFailure).cause).toMatchObject({ status });
			expect(attempts).toBe(1);
		});
	}

	test('a Resend that cannot be reached ends in MailFailure, with the cause', async () => {
		const resend = startResend();
		await resend.close();
		const error = await createResendMailer({
			apiKey: API_KEY,
			baseUrl: resend.baseUrl,
		})
			.send(sampleMessage)
			.then(
				() => null,
				(caught: unknown) => caught,
			);
		expect(error).toBeInstanceOf(MailFailure);
		expect((error as MailFailure).message).toBe(
			'send: Resend could not be reached',
		);
		expect((error as MailFailure).cause).toBeInstanceOf(Error);
	});

	test('a Resend that does not answer in time ends in MailFailure', async () => {
		const { error } = await sendWith('hang', 50);
		expect(error).toBeInstanceOf(MailFailure);
		expect((error as MailFailure).message).toBe(
			'send: Resend did not answer within 50 ms',
		);
		expect(((error as MailFailure).cause as Error).name).toBe('TimeoutError');
	});

	test('the timeout holds with a fetch that ignores the signal', async () => {
		let calls = 0;
		const error = await createResendMailer({
			apiKey: API_KEY,
			timeoutMs: 50,
			fetch: () => {
				calls += 1;
				return new Promise<Response>(() => {});
			},
		})
			.send(sampleMessage)
			.then(
				() => null,
				(caught: unknown) => caught,
			);
		expect(error).toBeInstanceOf(MailFailure);
		expect((error as MailFailure).message).toBe(
			'send: Resend did not answer within 50 ms',
		);
		expect(((error as MailFailure).cause as Error).name).toBe('TimeoutError');
		expect(calls).toBe(1);
	});

	test('the timeout holds while the answer body never ends', async () => {
		const sent = await createResendMailer({
			apiKey: API_KEY,
			timeoutMs: 50,
			fetch: async () =>
				new Response(new ReadableStream({ start() {} }), { status: 200 }),
		}).send(sampleMessage);
		// Resend took the message: only its id is missing.
		expect(sent).toEqual({ messageId: null });
	});

	test('no error message holds the API key, a recipient, or what Resend said', async () => {
		for (const fault of ['refusal', 'outage', 'keyRefused'] as const) {
			const { error } = await sendWith(fault);
			const messages = [
				(error as Error).message,
				((error as Error).cause as Error).message,
			].join('\n');
			expect(messages).not.toContain(API_KEY);
			expect(messages).not.toContain('ada@example.test');
			expect(messages).not.toContain('email@example.com');
		}
	});
});

describe('createResendMailer, the request', () => {
	test('posts to /emails with the key, the parts, reply_to and the headers', async () => {
		const resend = startResend();
		try {
			const sent = await createResendMailer({
				apiKey: API_KEY,
				baseUrl: `${resend.baseUrl}/`,
				from: { name: 'Acme', address: 'noreply@acme.test' },
			}).send({
				to: [
					'ada@example.test',
					{ name: 'Doe, "John"', address: 'john@example.test' },
				],
				replyTo: 'support@acme.test',
				headers: { 'List-Unsubscribe': '<https://acme.test/u>' },
				subject: sampleMessage.subject,
				html: sampleMessage.html,
				text: sampleMessage.text,
			});
			expect(sent).toEqual({ messageId: 'resend-1' });
			const [request] = resend.received;
			expect(request?.method).toBe('POST');
			expect(request?.path).toBe('/emails');
			expect(request?.headers.get('content-type')).toBe('application/json');
			expect(request?.body).toEqual({
				from: '"Acme" <noreply@acme.test>',
				to: ['ada@example.test', '"Doe, \\"John\\"" <john@example.test>'],
				subject: sampleMessage.subject,
				html: sampleMessage.html,
				text: sampleMessage.text,
				// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
				reply_to: 'support@acme.test',
				headers: { 'List-Unsubscribe': '<https://acme.test/u>' },
			});
			expect(resend.delivered[0]?.to).toEqual([
				'ada@example.test',
				'john@example.test',
			]);
		} finally {
			await resend.close();
		}
	});

	test('sends each attachment as base64, with its filename and content_type', async () => {
		const resend = startResend();
		try {
			const large = Uint8Array.from({ length: 100_000 }, (_, i) => i % 251);
			await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			}).send({
				...sampleMessage,
				attachments: [
					{
						filename: 'invoice.pdf',
						content: new TextEncoder().encode('%PDF-1.7'),
						contentType: 'application/pdf',
					},
					{
						filename: 'data.bin',
						content: large,
						contentType: 'application/octet-stream',
					},
				],
			});
			const [first, second] = (resend.received[0]?.body.attachments ??
				[]) as Record<string, unknown>[];
			expect(first).toEqual({
				filename: 'invoice.pdf',
				content: 'JVBERi0xLjc=',
				// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
				content_type: 'application/pdf',
			});
			// Longer than one slice of the encoder: every slice joins up.
			expect(second?.content).toBe(Buffer.from(large).toString('base64'));
		} finally {
			await resend.close();
		}
	});

	test('sends no attachments field for an empty list', async () => {
		const resend = startResend();
		try {
			await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			}).send({ ...sampleMessage, attachments: [] });
			expect('attachments' in (resend.received[0]?.body ?? {})).toBe(false);
		} finally {
			await resend.close();
		}
	});

	test('the message’s own from wins over the default', async () => {
		const resend = startResend();
		try {
			await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
				from: 'default@acme.test',
			}).send(sampleMessage);
			expect(resend.received[0]?.body.from).toBe('noreply@example.test');
		} finally {
			await resend.close();
		}
	});

	test('answers null when Resend gives no id, or a body that is not JSON', async () => {
		expect((await sendWith('noId')).sent).toEqual({ messageId: null });
		expect((await sendWith('notJson')).sent).toEqual({ messageId: null });
	});

	test('uses the fetch it is given', async () => {
		const calls: string[] = [];
		const sent = await createResendMailer({
			apiKey: API_KEY,
			fetch: async (url) => {
				calls.push(url);
				return Response.json({ id: 'via-proxy' });
			},
		}).send(sampleMessage);
		expect(calls).toEqual(['https://api.resend.com/emails']);
		expect(sent).toEqual({ messageId: 'via-proxy' });
	});

	test('refuses a message with no sender, before any request', async () => {
		const { from: _, ...withoutFrom } = sampleMessage;
		const error = await createResendMailer({
			apiKey: API_KEY,
			fetch: () => {
				throw new Error('fetch must not be called');
			},
		})
			.send(withoutFrom)
			.then(
				() => null,
				(caught: unknown) => caught,
			);
		expect(error).toBeInstanceOf(MailRefused);
		expect((error as MailRefused).message).toBe(
			'send: from is missing — give the message a from, or createResendMailer a default one',
		);
	});

	test('formatAddress quotes a name, and escapes its quotes and backslashes', () => {
		expect(formatAddress('ada@example.test')).toBe('ada@example.test');
		expect(
			formatAddress({
				name: 'Ada "A\\L" <x@y>, Eve',
				address: 'ada@example.test',
			}),
		).toBe('"Ada \\"A\\\\L\\" <x@y>, Eve" <ada@example.test>');
	});
});

describe('createResendMailer, wiring', () => {
	const refused = (options: unknown, message: string) =>
		expect(() =>
			createResendMailer(options as Parameters<typeof createResendMailer>[0]),
		).toThrow(new TypeError(message));

	test('refuses options that are not an object', () => {
		refused(
			undefined,
			'createResendMailer: options must be an object, as { apiKey }',
		);
	});

	test('refuses a missing or empty key, without printing it', () => {
		const message =
			'createResendMailer: apiKey must be a Resend API key — is the environment variable set?';
		refused({}, message);
		refused({ apiKey: '  ' }, message);
		refused(
			{ apiKey: `${API_KEY}\n` },
			'createResendMailer: apiKey holds whitespace — trim the value it was read from',
		);
	});

	test('refuses a bad baseUrl, fetch, timeoutMs or from', () => {
		refused(
			{ apiKey: API_KEY, baseUrl: 'api.resend.com' },
			'createResendMailer: baseUrl must be an http: or https: URL',
		);
		refused(
			{ apiKey: API_KEY, fetch: 'fetch' },
			'createResendMailer: fetch must be a function',
		);
		refused(
			{ apiKey: API_KEY, timeoutMs: 0 },
			'createResendMailer: timeoutMs must be a positive integer',
		);
		refused(
			{ apiKey: API_KEY, timeoutMs: 2_147_483_648 },
			'createResendMailer: timeoutMs must be at most 2147483647 — a longer timer fires at once',
		);
		expect(() =>
			createResendMailer({ apiKey: API_KEY, timeoutMs: 2_147_483_647 }),
		).not.toThrow();
		refused(
			{ apiKey: API_KEY, from: 'Acme <noreply@acme.test>' },
			'createResendMailer: from must be an e-mail address, as noreply@example.com or { name, address }',
		);
	});
});
