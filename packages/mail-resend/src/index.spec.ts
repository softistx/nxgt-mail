import { describe, expect, it, test } from 'bun:test';
import { MailFailure, MailRefused, MailScheduleRefused } from '@nxgt/mail';
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
	| 'keyInUse'
	| 'noId'
	| 'notJson'
	| 'hang';

/**
 * One request as Resend received it. `body` is typed as an object for the
 * usual `/emails` request; a batch request's is really an array — read it
 * back with {@link batchBodyOf}.
 */
interface Received {
	readonly method: string;
	readonly path: string;
	readonly headers: Headers;
	readonly body: Record<string, unknown>;
}

/** `received.body` for a `/emails/batch` request, which is really an array. */
function batchBodyOf(received: Received | undefined): unknown[] {
	return received?.body as unknown as unknown[];
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
	// Idempotency keys, as Resend keeps them: the body first sent, and its id.
	const keys = new Map<string, { body: string; id: string }>();
	let attempts = 0;
	const error = (statusCode: number, name: string, message: string) =>
		Response.json({ statusCode, name, message }, { status: statusCode });

	/** The fault Resend answers with, shared by `/emails` and `/emails/batch`. `null` when none is queued. */
	function faultResponse(fault: Fault | undefined): Response | null {
		switch (fault) {
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
			case 'keyInUse':
				return error(
					409,
					'concurrent_idempotent_requests',
					'Same idempotency key used while original request is still in progress.',
				);
			case 'noId':
				return Response.json({});
			case 'notJson':
				return new Response('ok', { status: 200 });
			default:
				return null;
		}
	}

	/** One item of a `POST /emails` or a `POST /emails/batch` body, read back as `delivered()` answers it. */
	function deliveredOf(item: Record<string, unknown>): DeliveredMail {
		const to = item.to as string[];
		const attachments = (item.attachments ?? []) as {
			filename: string;
			content: string;
			// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
			content_type: string;
			// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
			content_id?: string;
		}[];
		return {
			to: to.flatMap(addressesIn),
			subject: String(item.subject),
			html: String(item.html),
			text: String(item.text),
			// Read back as Resend reads them: the content is base64.
			attachments: attachments.map((file) => ({
				filename: file.filename,
				content: Uint8Array.from(atob(file.content), (char) =>
					char.charCodeAt(0),
				),
				contentType: file.content_type,
				...(file.content_id === undefined
					? {}
					: { contentId: file.content_id }),
			})),
			...(typeof item.scheduled_at === 'string'
				? { scheduledAt: new Date(item.scheduled_at) }
				: {}),
		};
	}

	const server = Bun.serve({
		port: 0,
		hostname: '127.0.0.1',
		async fetch(request) {
			const url = new URL(request.url);
			const parsed: unknown = await request.json().catch(() => ({}));
			const body = (
				typeof parsed === 'object' && parsed !== null ? parsed : {}
			) as Record<string, unknown>;
			received.push({
				method: request.method,
				path: url.pathname,
				headers: request.headers,
				body,
			});
			if (request.headers.get('authorization') !== `Bearer ${API_KEY}`) {
				return error(
					401,
					'missing_api_key',
					'Missing API key in the authorization header.',
				);
			}

			if (request.method === 'POST' && url.pathname === '/emails/batch') {
				attempts += 1;
				const fault = faultResponse(faults.shift());
				if (fault !== null) return fault;
				const items = Array.isArray(parsed)
					? (parsed as Record<string, unknown>[])
					: [];
				const ids = items.map((item) => {
					delivered.push(deliveredOf(item));
					return `resend-${delivered.length}`;
				});
				return Response.json({ data: ids.map((id) => ({ id })) });
			}

			const cancelMatch = url.pathname.match(/^\/emails\/([^/]+)\/cancel$/);
			if (request.method === 'POST' && cancelMatch) {
				const id = decodeURIComponent(cancelMatch[1] ?? '');
				if (id === 'unknown-id')
					return error(404, 'not_found', 'Email not found.');
				if (id === 'already-sent-id') {
					return error(
						400,
						'validation_error',
						'This email has already been sent.',
					);
				}
				return Response.json({ object: 'email', id });
			}

			const rescheduleMatch = url.pathname.match(/^\/emails\/([^/]+)$/);
			if (request.method === 'PATCH' && rescheduleMatch) {
				const id = decodeURIComponent(rescheduleMatch[1] ?? '');
				if (id === 'unknown-id')
					return error(404, 'not_found', 'Email not found.');
				if (id === 'already-sent-id') {
					return error(
						400,
						'validation_error',
						'This email has already been sent.',
					);
				}
				return Response.json({ object: 'email', id });
			}

			if (request.method !== 'POST' || url.pathname !== '/emails') {
				return error(
					404,
					'not_found',
					'The requested endpoint does not exist.',
				);
			}
			attempts += 1;
			const queuedFault = faults.shift();
			if (queuedFault === 'hang') {
				await Bun.sleep(1_000);
				return Response.json({ id: 'too-late' });
			}
			const fault = faultResponse(queuedFault);
			if (fault !== null) return fault;
			const key = request.headers.get('idempotency-key');
			const known = key === null ? undefined : keys.get(key);
			if (known !== undefined) {
				return known.body === JSON.stringify(body)
					? Response.json({ id: known.id })
					: error(
							409,
							'invalid_idempotent_request',
							'Same idempotency key used with a different request payload.',
						);
			}
			delivered.push(deliveredOf(body));
			const id = `resend-${delivered.length}`;
			if (key !== null) keys.set(key, { body: JSON.stringify(body), id });
			return Response.json({ id });
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

	test('a 409 for a key used on another message is a refusal', async () => {
		const resend = startResend();
		try {
			const mailer = createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			});
			await mailer.send({ ...sampleMessage, idempotencyKey: 'order-42' });
			const error = await mailer
				.send({
					...sampleMessage,
					subject: 'Other',
					idempotencyKey: 'order-42',
				})
				.then(
					() => null,
					(e: unknown) => e,
				);
			expect(error).toBeInstanceOf(MailRefused);
			expect((error as MailRefused).cause).toMatchObject({
				status: 409,
				errorName: 'invalid_idempotent_request',
			});
			expect(resend.delivered).toHaveLength(1);
		} finally {
			await resend.close();
		}
	});

	test('a 409 for a send with the same key still in progress is a failure', async () => {
		const { error, attempts } = await sendWith('keyInUse');
		expect(error).toBeInstanceOf(MailFailure);
		expect((error as MailFailure).cause).toMatchObject({
			status: 409,
			errorName: 'concurrent_idempotent_requests',
		});
		expect(attempts).toBe(1);
	});

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

	test("sends an inline image's content id as content_id, and none for a plain file", async () => {
		const resend = startResend();
		try {
			await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
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
			const [logo, invoice] = (resend.received[0]?.body.attachments ??
				[]) as Record<string, unknown>[];
			expect(logo?.content_id).toBe('logo@acme.test');
			expect(invoice !== undefined && 'content_id' in invoice).toBe(false);
		} finally {
			await resend.close();
		}
	});

	test("sends the tags as Resend's list of { name, value }, and none for an empty record", async () => {
		const resend = startResend();
		try {
			const mailer = createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			});
			await mailer.send({
				...sampleMessage,
				tags: { category: 'receipt', plan: 'enterprise' },
			});
			await mailer.send({ ...sampleMessage, tags: {} });
			expect(resend.received[0]?.body.tags).toEqual([
				{ name: 'category', value: 'receipt' },
				{ name: 'plan', value: 'enterprise' },
			]);
			expect('tags' in (resend.received[1]?.body ?? {})).toBe(false);
		} finally {
			await resend.close();
		}
	});

	test('refuses more than 75 tags, as Resend does, before sending', async () => {
		const resend = startResend();
		try {
			const tags = Object.fromEntries(
				Array.from({ length: 76 }, (_, index) => [`tag${index}`, 'x']),
			);
			const error = await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			})
				.send({ ...sampleMessage, tags })
				.then(
					() => null,
					(caught: unknown) => caught,
				);
			expect(error).toBeInstanceOf(MailRefused);
			expect((error as Error).message).toBe(
				'send: Resend takes at most 75 tags on one e-mail',
			);
			expect(resend.received).toHaveLength(0);
			await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			}).send({
				...sampleMessage,
				tags: Object.fromEntries(Object.entries(tags).slice(0, 75)),
			});
			expect(resend.received).toHaveLength(1);
		} finally {
			await resend.close();
		}
	});

	test("sends scheduledAt as Resend's scheduled_at, ISO 8601, and none without one", async () => {
		const resend = startResend();
		try {
			const mailer = createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			});
			const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
			await mailer.send({ ...sampleMessage, scheduledAt });
			await mailer.send(sampleMessage);
			expect(resend.received[0]?.body.scheduled_at).toBe(
				scheduledAt.toISOString(),
			);
			expect('scheduled_at' in (resend.received[1]?.body ?? {})).toBe(false);
		} finally {
			await resend.close();
		}
	});

	test('sends no attachments or headers field when they are empty', async () => {
		const resend = startResend();
		try {
			await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			}).send({ ...sampleMessage, attachments: [], headers: {} });
			expect('attachments' in (resend.received[0]?.body ?? {})).toBe(false);
			expect('headers' in (resend.received[0]?.body ?? {})).toBe(false);
		} finally {
			await resend.close();
		}
	});

	test('sends the idempotency key as Idempotency-Key, and none without one', async () => {
		const resend = startResend();
		try {
			const mailer = createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			});
			await mailer.send({
				...sampleMessage,
				idempotencyKey: 'order-42/receipt',
			});
			await mailer.send(sampleMessage);
			expect(resend.received[0]?.headers.get('idempotency-key')).toBe(
				'order-42/receipt',
			);
			expect(resend.received[1]?.headers.has('idempotency-key')).toBe(false);
			expect('idempotencyKey' in (resend.received[0]?.body ?? {})).toBe(false);
		} finally {
			await resend.close();
		}
	});

	test('a retry with the same key answers the first id, and delivers once', async () => {
		const resend = startResend();
		try {
			const mailer = createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			});
			const once = { ...sampleMessage, idempotencyKey: 'order-42/receipt' };
			const first = await mailer.send(once);
			const again = await mailer.send(once);
			expect(again).toEqual(first);
			expect(resend.delivered).toHaveLength(1);
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

describe('createResendMailer, sendBatch', () => {
	test('posts one request to /emails/batch, and answers one result per message, in order', async () => {
		const resend = startResend();
		try {
			const mailer = createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			});
			const results = await mailer.sendBatch([
				{ ...sampleMessage, subject: 'First' },
				{ ...sampleMessage, subject: 'Second' },
			]);
			expect(resend.received).toHaveLength(1);
			expect(resend.received[0]?.path).toBe('/emails/batch');
			expect(batchBodyOf(resend.received[0])).toEqual([
				expect.objectContaining({ subject: 'First' }),
				expect.objectContaining({ subject: 'Second' }),
			]);
			expect(results).toEqual([
				{ status: 'sent', sentMail: { messageId: 'resend-1' } },
				{ status: 'sent', sentMail: { messageId: 'resend-2' } },
			]);
			expect(resend.delivered.map((mail) => mail.subject)).toEqual([
				'First',
				'Second',
			]);
		} finally {
			await resend.close();
		}
	});

	test('sends no Idempotency-Key header for a batch request', async () => {
		const resend = startResend();
		try {
			await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			}).sendBatch([sampleMessage]);
			expect(resend.received[0]?.headers.has('idempotency-key')).toBe(false);
		} finally {
			await resend.close();
		}
	});

	test('splits more than 100 messages into as many requests of 100', async () => {
		const resend = startResend();
		try {
			const messages = Array.from({ length: 101 }, (_, index) => ({
				...sampleMessage,
				subject: `Message ${index}`,
			}));
			const results = await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			}).sendBatch(messages);
			const batchRequests = resend.received.filter(
				(r) => r.path === '/emails/batch',
			);
			expect(batchRequests).toHaveLength(2);
			expect(batchBodyOf(batchRequests[0]).length).toBe(100);
			expect(batchBodyOf(batchRequests[1]).length).toBe(1);
			expect(results.every((r) => r.status === 'sent')).toBe(true);
		} finally {
			await resend.close();
		}
	});

	test('checks every message before any request goes out: a bad one is refused on its own, and never reaches Resend', async () => {
		const resend = startResend();
		try {
			const { to: _, ...withoutTo } = sampleMessage;
			const results = await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			}).sendBatch([sampleMessage, { ...withoutTo, to: [] }, sampleMessage]);
			expect(results[0]?.status).toBe('sent');
			expect(results[1]?.status).toBe('refused');
			expect((results[1] as { error: unknown }).error).toBeInstanceOf(
				MailRefused,
			);
			expect(results[2]?.status).toBe('sent');
			expect(batchBodyOf(resend.received[0])).toHaveLength(2);
		} finally {
			await resend.close();
		}
	});

	test('refuses a message with attachments, or its own idempotencyKey, on its own', async () => {
		const resend = startResend();
		try {
			const results = await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			}).sendBatch([
				{
					...sampleMessage,
					attachments: [
						{
							filename: 'a.pdf',
							content: new Uint8Array([1]),
							contentType: 'application/pdf',
						},
					],
				},
				{ ...sampleMessage, idempotencyKey: 'order-42' },
			]);
			expect(results[0]?.status).toBe('refused');
			expect((results[0] as { error: MailRefused }).error.message).toContain(
				'attachments are not supported in a batch send',
			);
			expect(results[1]?.status).toBe('refused');
			expect((results[1] as { error: MailRefused }).error.message).toContain(
				'idempotencyKey is not supported in a batch send',
			);
			expect(resend.received).toHaveLength(0);
		} finally {
			await resend.close();
		}
	});

	test('a batch request Resend refuses reports every message in it as refused, with the same cause', async () => {
		const resend = startResend();
		try {
			resend.faults.push('refusal');
			const results = await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			}).sendBatch([sampleMessage, { ...sampleMessage, subject: 'Other' }]);
			expect(results.every((r) => r.status === 'refused')).toBe(true);
			expect((results[0] as { error: MailRefused }).error).toBeInstanceOf(
				MailRefused,
			);
		} finally {
			await resend.close();
		}
	});

	test('a batch request Resend cannot take reports every message in it as failed', async () => {
		const resend = startResend();
		try {
			resend.faults.push('outage');
			const results = await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			}).sendBatch([sampleMessage]);
			expect(results[0]?.status).toBe('failed');
			expect((results[0] as { error: unknown }).error).toBeInstanceOf(
				MailFailure,
			);
		} finally {
			await resend.close();
		}
	});

	test('a Resend that cannot be reached reports every message as failed', async () => {
		const resend = startResend();
		await resend.close();
		const results = await createResendMailer({
			apiKey: API_KEY,
			baseUrl: resend.baseUrl,
		}).sendBatch([sampleMessage]);
		expect(results[0]?.status).toBe('failed');
	});
});

describe('createResendMailer, cancel and reschedule', () => {
	test('cancel resolves once Resend confirms it, posting to /emails/{id}/cancel', async () => {
		const resend = startResend();
		try {
			await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			}).cancel('some-id');
			expect(resend.received[0]?.path).toBe('/emails/some-id/cancel');
			expect(resend.received[0]?.method).toBe('POST');
		} finally {
			await resend.close();
		}
	});

	test('cancel refuses an unknown id with MailScheduleRefused, code UNKNOWN_ID', async () => {
		const resend = startResend();
		try {
			const error = await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			})
				.cancel('unknown-id')
				.then(
					() => null,
					(caught: unknown) => caught,
				);
			expect(error).toBeInstanceOf(MailScheduleRefused);
			expect((error as MailScheduleRefused).code).toBe('UNKNOWN_ID');
		} finally {
			await resend.close();
		}
	});

	test('cancel refuses an already-sent message with MailScheduleRefused, code ALREADY_SENT', async () => {
		const resend = startResend();
		try {
			const error = await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			})
				.cancel('already-sent-id')
				.then(
					() => null,
					(caught: unknown) => caught,
				);
			expect(error).toBeInstanceOf(MailScheduleRefused);
			expect((error as MailScheduleRefused).code).toBe('ALREADY_SENT');
		} finally {
			await resend.close();
		}
	});

	test('cancel raises MailFailure when Resend cannot be reached', async () => {
		const resend = startResend();
		await resend.close();
		const error = await createResendMailer({
			apiKey: API_KEY,
			baseUrl: resend.baseUrl,
		})
			.cancel('some-id')
			.then(
				() => null,
				(caught: unknown) => caught,
			);
		expect(error).toBeInstanceOf(MailFailure);
	});

	test('reschedule PATCHes /emails/{id} with scheduled_at, and resolves once confirmed', async () => {
		const resend = startResend();
		try {
			const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
			await createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			}).reschedule('some-id', scheduledAt);
			expect(resend.received[0]?.method).toBe('PATCH');
			expect(resend.received[0]?.path).toBe('/emails/some-id');
			expect(resend.received[0]?.body).toEqual({
				// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
				scheduled_at: scheduledAt.toISOString(),
			});
		} finally {
			await resend.close();
		}
	});

	test('reschedule refuses a scheduledAt in the past or too far ahead, before any request', async () => {
		const resend = startResend();
		try {
			const mailer = createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
				fetch: () => {
					throw new Error('fetch must not be called');
				},
			});
			await expect(
				mailer.reschedule('some-id', new Date(Date.now() - 60_000 * 5)),
			).rejects.toThrow('reschedule: scheduledAt is in the past');
		} finally {
			await resend.close();
		}
	});

	test('reschedule refuses an unknown or already-sent id the same way cancel does', async () => {
		const resend = startResend();
		try {
			const mailer = createResendMailer({
				apiKey: API_KEY,
				baseUrl: resend.baseUrl,
			});
			const scheduledAt = new Date(Date.now() + 60_000);
			const unknown = await mailer.reschedule('unknown-id', scheduledAt).then(
				() => null,
				(caught: unknown) => caught,
			);
			expect((unknown as MailScheduleRefused).code).toBe('UNKNOWN_ID');
			const already = await mailer
				.reschedule('already-sent-id', scheduledAt)
				.then(
					() => null,
					(caught: unknown) => caught,
				);
			expect((already as MailScheduleRefused).code).toBe('ALREADY_SENT');
		} finally {
			await resend.close();
		}
	});

	test('cancel and reschedule refuse a messageId that is not a string, before any request', async () => {
		const mailer = createResendMailer({
			apiKey: API_KEY,
			fetch: () => {
				throw new Error('fetch must not be called');
			},
		});
		await expect(mailer.cancel('')).rejects.toThrow(TypeError);
		await expect(mailer.reschedule('', new Date())).rejects.toThrow(TypeError);
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
