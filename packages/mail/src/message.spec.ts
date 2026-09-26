import { describe, expect, it } from 'bun:test';
import { MailRefused } from './errors';
import { addressOf, checkMessage, recipientsOf } from './message';
import type { MailMessage } from './types';

const message: MailMessage = {
	to: 'ada@example.test',
	subject: 'Hello',
	html: '<p>Hello</p>',
	text: 'Hello',
};

function refusal(input: unknown): MailRefused {
	try {
		checkMessage(input as MailMessage);
	} catch (error) {
		if (error instanceof MailRefused) return error;
		throw error;
	}
	throw new Error('checkMessage accepted the message');
}

describe('checkMessage', () => {
	it('accepts a well-formed message, with every optional part', () => {
		expect(() =>
			checkMessage({
				...message,
				to: [
					'ada@example.test',
					{ name: 'Grace Hopper', address: 'grace@example.test' },
				],
				from: { name: 'Example', address: 'noreply@example.test' },
				replyTo: 'support@example.test',
				headers: { 'List-Unsubscribe': '<https://example.test/u>' },
			}),
		).not.toThrow();
	});

	it.each([
		[
			'no recipient',
			{ ...message, to: [] },
			'send: to must hold at least one address',
		],
		[
			'a missing to',
			{ subject: 's', html: 'h', text: 't' },
			'send: to must hold at least one address',
		],
		[
			'an undefined recipient in the list',
			{ ...message, to: [undefined] },
			'send: to[0] is not an e-mail address',
		],
		[
			'a message that is not an object',
			null,
			'send: the message must be an object',
		],
		[
			'an address that is a number',
			{ ...message, from: 42 },
			'send: from is not an e-mail address',
		],
		[
			'a name that is not a string',
			{ ...message, to: { name: 1, address: 'a@b.c' } },
			'send: to.name must be a string without a line break',
		],
		[
			'a display name in a string',
			{ ...message, to: 'Ada <ada@example.test>' },
			'send: to is not an e-mail address',
		],
		[
			'a second recipient that is not an address',
			{ ...message, to: ['ada@example.test', 'nope'] },
			'send: to[1] is not an e-mail address',
		],
		[
			'a line break in a name',
			{ ...message, from: { name: 'A\r\nBcc: x@y.z', address: 'a@b.c' } },
			'send: from.name must be a string without a line break',
		],
		[
			'an object without an address',
			{ ...message, replyTo: { name: 'A', address: 'a' } },
			'send: replyTo.address is not an e-mail address',
		],
		[
			'a line break in the subject',
			{ ...message, subject: 'Hi\nBcc: x@y.z' },
			'send: subject must not hold a line break',
		],
		[
			'a missing text part',
			{ ...message, text: undefined },
			'send: text must be a string',
		],
		[
			'a header name with a space',
			{ ...message, headers: { 'X Bad': 'v' } },
			'send: a header name must be letters, digits and hyphens',
		],
		[
			'a line break in a header value',
			{ ...message, headers: { 'X-Ref': 'a\r\nb' } },
			'send: header X-Ref must be a string without a line break',
		],
	])('refuses %s with MailRefused, naming where', (_, input, text) => {
		expect(refusal(input).message).toBe(text);
	});

	it('never puts the refused value in the message', () => {
		// A message reports a shape, never a value: an address is personal data.
		const error = refusal({ ...message, to: 'secret-7f3a@@example.test' });
		expect(error.message).not.toContain('secret-7f3a');
	});
});

describe('recipientsOf and addressOf', () => {
	it('answers the bare addresses, in order', () => {
		expect(
			recipientsOf({
				...message,
				to: ['a@example.test', { name: 'B', address: 'b@example.test' }],
			}),
		).toEqual(['a@example.test', 'b@example.test']);
		expect(recipientsOf(message)).toEqual(['ada@example.test']);
		expect(addressOf({ name: 'Ada', address: 'ada@example.test' })).toBe(
			'ada@example.test',
		);
	});
});
