import type { MailEvent } from '../events';
import { check } from './assert';

/**
 * A {@link MailEvent}, for a provider's webhook test — override any field.
 * `messageId` and `recipient` are never real values: a sample, like
 * `sampleMessage`.
 */
export function sampleMailEvent(overrides?: Partial<MailEvent>): MailEvent {
	return {
		type: 'delivered',
		messageId: 'sample-message-1',
		recipient: 'ada@example.test',
		timestamp: new Date('2026-01-01T00:00:00.000Z'),
		tags: {},
		raw: null,
		...overrides,
	} as MailEvent;
}

/**
 * Holds a provider's mapping to the {@link MailEvent} shape — for a package
 * mapping a **second** provider's webhook, so its tests check the same
 * invariants `@nxgt/mail-resend/webhooks` does, without depending on it.
 *
 * Checks the fields every event carries, and the ones only `bounced`,
 * `opened` and `clicked` add. Never checks `raw`: it is the provider's own
 * payload, whatever shape that is.
 */
export function checkMailEvent(event: MailEvent): void {
	check(
		typeof event.messageId === 'string' && event.messageId !== '',
		'messageId must be a non-empty string',
	);
	check(
		typeof event.recipient === 'string' && event.recipient !== '',
		'recipient must be a non-empty string',
	);
	check(
		event.timestamp instanceof Date && !Number.isNaN(event.timestamp.getTime()),
		'timestamp must be a valid Date',
	);
	check(
		typeof event.tags === 'object' &&
			event.tags !== null &&
			Object.values(event.tags).every((value) => typeof value === 'string'),
		'tags must be a record of strings',
	);
	if (event.type === 'bounced') {
		check(
			event.bounceType === 'hard' || event.bounceType === 'soft',
			"a bounced event's bounceType must be 'hard' or 'soft'",
		);
	}
	if (event.type === 'opened' || event.type === 'clicked') {
		check(
			event.tracking === true,
			`a ${event.type} event's tracking must be true`,
		);
	}
	if (event.type === 'clicked') {
		check(
			event.url === null || typeof event.url === 'string',
			"a clicked event's url must be a string or null",
		);
	}
}
