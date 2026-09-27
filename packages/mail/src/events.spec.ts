import { describe, expect, it } from 'bun:test';
import { checkMailEvent, sampleMailEvent } from './conformance/events';
import { MailWebhookRefused } from './events';

describe('MailWebhookRefused', () => {
	it('carries the code and the cause', () => {
		const cause = new Error('boom');
		const error = new MailWebhookRefused(
			'INVALID_SIGNATURE',
			'verify: svix-signature does not match',
			{ cause },
		);

		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe('MailWebhookRefused');
		expect(error.code).toBe('INVALID_SIGNATURE');
		expect(error.cause).toBe(cause);
	});
});

describe('checkMailEvent', () => {
	it('accepts a well-formed delivered event', () => {
		expect(() => checkMailEvent(sampleMailEvent())).not.toThrow();
	});

	it('accepts a well-formed bounced event', () => {
		expect(() =>
			checkMailEvent(sampleMailEvent({ type: 'bounced', bounceType: 'hard' })),
		).not.toThrow();
	});

	it('accepts a well-formed clicked event', () => {
		expect(() =>
			checkMailEvent(
				sampleMailEvent({
					type: 'clicked',
					tracking: true,
					url: 'https://example.test',
				}),
			),
		).not.toThrow();
	});

	it('refuses a bounced event without a bounceType', () => {
		const malformed = sampleMailEvent({ type: 'bounced' }) as ReturnType<
			typeof sampleMailEvent
		>;
		expect(() => checkMailEvent(malformed)).toThrow();
	});

	it('refuses an empty messageId', () => {
		expect(() => checkMailEvent(sampleMailEvent({ messageId: '' }))).toThrow();
	});

	it('refuses tags holding a non-string value', () => {
		expect(() =>
			checkMailEvent(
				sampleMailEvent({ tags: { plan: 1 as unknown as string } }),
			),
		).toThrow();
	});
});
