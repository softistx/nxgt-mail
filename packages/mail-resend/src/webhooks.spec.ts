import { describe, expect, it } from 'bun:test';
import { MailWebhookRefused } from '@nxgt/mail';
import { createResendWebhook } from './webhooks';

const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';

/** Signs `body` the way Svix (and so Resend) does: HMAC-SHA256, base64, over `${id}.${timestamp}.${body}`. */
async function sign(
	secret: string,
	id: string,
	timestamp: string,
	body: string,
): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		Uint8Array.from(atob(secret.slice('whsec_'.length)), (char) =>
			char.charCodeAt(0),
		),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const digest = await crypto.subtle.sign(
		'HMAC',
		key,
		new TextEncoder().encode(`${id}.${timestamp}.${body}`),
	);
	let binary = '';
	for (const byte of new Uint8Array(digest))
		binary += String.fromCharCode(byte);
	return `v1,${btoa(binary)}`;
}

function bodyOf(type: string, data: Record<string, unknown>): string {
	// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
	return JSON.stringify({ type, created_at: '2026-09-27T12:00:00.000Z', data });
}

const DATA = {
	// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
	email_id: 'a1b2c3d4-e5f6-4711-8899-aabbccddeeff',
	// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
	message_id: '<111-222-333@email.example.com>',
	from: 'Acme <onboarding@resend.dev>',
	to: ['ada@example.test'],
	subject: 'Confirm your address',
	// biome-ignore lint/style/useNamingConvention: Resend's wire format names the field, not us.
	created_at: '2026-09-27T11:59:59.000Z',
	tags: { category: 'confirm_email' },
};

async function requestFor(
	body: string,
	options?: {
		readonly id?: string;
		readonly timestamp?: string;
		readonly signature?: string;
		readonly secret?: string;
	},
): Promise<{ headers: Record<string, string>; body: string }> {
	const id = options?.id ?? 'msg_2rst5v0J8B1qC0aTvJH1qHOK0O5';
	const timestamp = options?.timestamp ?? String(Math.floor(Date.now() / 1000));
	const signature =
		options?.signature ??
		(await sign(options?.secret ?? SECRET, id, timestamp, body));
	return {
		headers: {
			'svix-id': id,
			'svix-timestamp': timestamp,
			'svix-signature': signature,
		},
		body,
	};
}

describe('createResendWebhook — wiring', () => {
	it('refuses a missing secret', () => {
		// @ts-expect-error — secret is required.
		expect(() => createResendWebhook({})).toThrow(TypeError);
	});

	it('refuses a secret without the whsec_ prefix', () => {
		expect(() => createResendWebhook({ secret: 'sk_live_123' })).toThrow(
			TypeError,
		);
	});

	it('refuses a non-positive toleranceMs', () => {
		expect(() =>
			createResendWebhook({ secret: SECRET, toleranceMs: 0 }),
		).toThrow(TypeError);
	});
});

describe('createResendWebhook — verify', () => {
	it('verifies a real Svix test vector and maps an event it does not know to null', async () => {
		// From Svix's own docs (docs.svix.com/receiving/verifying-payloads/how-manual):
		// secret whsec_plJ3nmyCDGBKInavdOK15jsl, id msg_loFOjxBNrRLzqYUf, timestamp
		// 1731705121, body {"event_type":"ping","data":{"success":true}}, signature
		// v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0= — verified independently
		// against `crypto.subtle` before being written here.
		const webhook = createResendWebhook({
			secret: 'whsec_plJ3nmyCDGBKInavdOK15jsl',
			toleranceMs: Number.MAX_SAFE_INTEGER, // the vector's timestamp is years old
		});
		const event = await webhook.verify({
			headers: {
				'svix-id': 'msg_loFOjxBNrRLzqYUf',
				'svix-timestamp': '1731705121',
				'svix-signature': 'v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0=',
			},
			body: '{"event_type":"ping","data":{"success":true}}',
		});
		expect(event).toBeNull(); // no `type`/`data.email_id`: not a Resend e-mail event
	});

	it('maps email.delivered', async () => {
		const webhook = createResendWebhook({ secret: SECRET });
		const body = bodyOf('email.delivered', DATA);
		const event = await webhook.verify(await requestFor(body));
		expect(event).toEqual({
			type: 'delivered',
			messageId: DATA.email_id,
			recipient: 'ada@example.test',
			timestamp: new Date(DATA.created_at),
			tags: { category: 'confirm_email' },
			raw: JSON.parse(body),
		});
	});

	it('maps email.bounced Permanent to bounceType hard', async () => {
		const webhook = createResendWebhook({ secret: SECRET });
		const body = bodyOf('email.bounced', {
			...DATA,
			bounce: { type: 'Permanent', subType: 'Suppressed', message: 'blocked' },
		});
		const event = await webhook.verify(await requestFor(body));
		expect(event?.type).toBe('bounced');
		expect(event && 'bounceType' in event ? event.bounceType : null).toBe(
			'hard',
		);
	});

	it('maps every other bounce.type to bounceType soft', async () => {
		const webhook = createResendWebhook({ secret: SECRET });
		const body = bodyOf('email.bounced', {
			...DATA,
			bounce: { type: 'Temporary' },
		});
		const event = await webhook.verify(await requestFor(body));
		expect(event && 'bounceType' in event ? event.bounceType : null).toBe(
			'soft',
		);
	});

	it('maps email.complained and email.delivery_delayed', async () => {
		const webhook = createResendWebhook({ secret: SECRET });
		const complained = await webhook.verify(
			await requestFor(bodyOf('email.complained', DATA)),
		);
		const delayed = await webhook.verify(
			await requestFor(bodyOf('email.delivery_delayed', DATA)),
		);
		expect(complained?.type).toBe('complained');
		expect(delayed?.type).toBe('delayed');
	});

	it('maps email.clicked, with the url and tracking: true', async () => {
		const webhook = createResendWebhook({ secret: SECRET });
		const body = bodyOf('email.clicked', {
			...DATA,
			click: {
				link: 'https://example.test/verify',
				timestamp: '2026-09-27T12:00:01.000Z',
				ipAddress: '203.0.113.1',
			},
		});
		const event = await webhook.verify(await requestFor(body));
		expect(event).toMatchObject({
			type: 'clicked',
			tracking: true,
			url: 'https://example.test/verify',
		});
		expect(event?.timestamp).toEqual(new Date('2026-09-27T12:00:01.000Z'));
	});

	it('maps email.opened, with tracking: true', async () => {
		const webhook = createResendWebhook({ secret: SECRET });
		const event = await webhook.verify(
			await requestFor(bodyOf('email.opened', DATA)),
		);
		expect(event).toMatchObject({ type: 'opened', tracking: true });
	});

	it('answers null for an event type it does not map', async () => {
		const webhook = createResendWebhook({ secret: SECRET });
		const event = await webhook.verify(
			await requestFor(bodyOf('email.sent', DATA)),
		);
		expect(event).toBeNull();
	});

	it('accepts a Request, reading the raw body itself', async () => {
		const webhook = createResendWebhook({ secret: SECRET });
		const body = bodyOf('email.delivered', DATA);
		const { headers } = await requestFor(body);
		const request = new Request('https://app.example.test/webhooks/resend', {
			method: 'POST',
			headers,
			body,
		});
		const event = await webhook.verify(request);
		expect(event?.type).toBe('delivered');
	});

	it('accepts several space-separated signatures, one of them ours', async () => {
		const webhook = createResendWebhook({ secret: SECRET });
		const body = bodyOf('email.delivered', DATA);
		const request = await requestFor(body);
		const ours = request.headers['svix-signature'];
		const rotated = await requestFor(body, {
			signature: `v1,not-the-right-one= ${ours}`,
		});
		const event = await webhook.verify(rotated);
		expect(event?.type).toBe('delivered');
	});

	it('refuses a tampered body', async () => {
		const body = bodyOf('email.delivered', DATA);
		const request = await requestFor(body);
		const webhook = createResendWebhook({ secret: SECRET });
		const error = await webhook
			.verify({
				...request,
				body: body.replace('ada@example.test', 'eve@example.test'),
			})
			.then(
				() => null,
				(caught: unknown) => caught,
			);
		expect(error).toBeInstanceOf(MailWebhookRefused);
		expect((error as MailWebhookRefused).code).toBe('INVALID_SIGNATURE');
	});

	it('refuses a signature made with the wrong secret', async () => {
		const body = bodyOf('email.delivered', DATA);
		const request = await requestFor(body, {
			secret: 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSx',
		});
		const webhook = createResendWebhook({ secret: SECRET });
		const error = await webhook.verify(request).then(
			() => null,
			(caught: unknown) => caught,
		);
		expect(error).toBeInstanceOf(MailWebhookRefused);
		expect((error as MailWebhookRefused).code).toBe('INVALID_SIGNATURE');
	});

	it('refuses an expired timestamp', async () => {
		const body = bodyOf('email.delivered', DATA);
		const timestamp = String(Math.floor(Date.now() / 1000) - 6 * 60); // 6 minutes old
		const request = await requestFor(body, { timestamp });
		const webhook = createResendWebhook({ secret: SECRET });
		const error = await webhook.verify(request).then(
			() => null,
			(caught: unknown) => caught,
		);
		expect(error).toBeInstanceOf(MailWebhookRefused);
		expect((error as MailWebhookRefused).code).toBe('EXPIRED_TIMESTAMP');
	});

	it('refuses a timestamp in the future past the tolerance', async () => {
		const body = bodyOf('email.delivered', DATA);
		const timestamp = String(Math.floor(Date.now() / 1000) + 6 * 60);
		const request = await requestFor(body, { timestamp });
		const webhook = createResendWebhook({ secret: SECRET });
		const error = await webhook.verify(request).then(
			() => null,
			(caught: unknown) => caught,
		);
		expect(error).toBeInstanceOf(MailWebhookRefused);
		expect((error as MailWebhookRefused).code).toBe('EXPIRED_TIMESTAMP');
	});

	it('refuses a request missing a svix header', async () => {
		const webhook = createResendWebhook({ secret: SECRET });
		const error = await webhook
			.verify({
				headers: {
					'svix-id': 'msg_1',
					'svix-timestamp': String(Math.floor(Date.now() / 1000)),
				},
				body: '{}',
			})
			.then(
				() => null,
				(caught: unknown) => caught,
			);
		expect(error).toBeInstanceOf(MailWebhookRefused);
		expect((error as MailWebhookRefused).code).toBe('INVALID_SIGNATURE');
	});

	it('rejects a request that is neither a Request nor { headers, body }', async () => {
		const webhook = createResendWebhook({ secret: SECRET });
		// @ts-expect-error — not a valid ResendWebhookRequest.
		await expect(webhook.verify({ body: 42 })).rejects.toBeInstanceOf(
			TypeError,
		);
	});
});
