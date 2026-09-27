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

const pdf = {
	filename: 'invoice.pdf',
	content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
	contentType: 'application/pdf',
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
		[
			'two addresses in one string, split by a comma',
			{ ...message, to: 'root,ada@example.test' },
			'send: to is not an e-mail address',
		],
		[
			'two addresses in one string, split by a semicolon',
			{ ...message, to: ['ada@example.test', 'root;eve@example.test'] },
			'send: to[1] is not an e-mail address',
		],
		[
			'a group in one string, opened by a colon',
			{ ...message, replyTo: 'group:eve@example.test' },
			'send: replyTo is not an e-mail address',
		],
		[
			'a comma in an object address',
			{ ...message, from: { name: 'A', address: 'root,ada@example.test' } },
			'send: from.address is not an e-mail address',
		],
		[
			'attachments that are not an array',
			{ ...message, attachments: { filename: 'a.pdf' } },
			'send: attachments must be an array',
		],
		[
			'an attachment that is not an object',
			{ ...message, attachments: [pdf, null] },
			'send: attachments[1] must be an object, as { filename, content, contentType }',
		],
		[
			'a hole in the attachments',
			// biome-ignore lint/suspicious/noSparseArray: the hole is what is refused.
			{ ...message, attachments: [, pdf] },
			'send: attachments[0] must be an object, as { filename, content, contentType }',
		],
		[
			'an attachment given as a string',
			{ ...message, attachments: [{ ...pdf, content: '%PDF-1.7' }] },
			"send: attachments[0].content must be a Uint8Array — the file's bytes, never a path or a URL",
		],
		[
			'an attachment given as a path, with no bytes',
			{
				...message,
				attachments: [
					{ filename: 'a.pdf', path: '/etc/passwd', contentType: 'text/plain' },
				],
			},
			"send: attachments[0].content must be a Uint8Array — the file's bytes, never a path or a URL",
		],
		[
			'an attachment given as an ArrayBuffer',
			{ ...message, attachments: [{ ...pdf, content: new ArrayBuffer(4) }] },
			"send: attachments[0].content must be a Uint8Array — the file's bytes, never a path or a URL",
		],
		...[
			['an empty file name', ''],
			['a file name that is not a string', 42],
			['a file name holding a path', 'invoices/42.pdf'],
			['a file name climbing out', '../42.pdf'],
			['a file name holding a Windows path', 'C:\\invoices\\42.pdf'],
			['a line break in a file name', 'a.pdf\r\nContent-Type: text/html'],
			['a NUL in a file name', 'a.pdf\u0000.exe'],
			['a C1 control character in a file name', 'a\u0085.pdf'],
			['a right-to-left override in a file name', 'invoice\u202Efdp.exe'],
			['a line separator in a file name', 'a\u2028.pdf'],
			['a file name that is only a dot', '.'],
			['a file name that is only two dots', '..'],
		].map(
			([what, filename]) =>
				[
					what,
					{ ...message, attachments: [{ ...pdf, filename }] },
					'send: attachments[0].filename must be a file name — not empty, not . or .., without / or \\, a line break or a control character',
				] as const,
		),
		...[
			['a content type without a subtype', 'application'],
			['a content type with parameters', 'text/plain; charset=utf-8'],
			['a line break in a content type', 'text/plain\r\nX-Evil: 1'],
			['a space in a content type', 'text /plain'],
			['an empty content type', ''],
			['a content type that is not a string', undefined],
			['a MIME container as a content type', 'multipart/mixed'],
			['a message as a content type', 'message/rfc822'],
			['a message as a content type, in capitals', 'Message/RFC822'],
		].map(
			([what, contentType]) =>
				[
					what,
					{ ...message, attachments: [{ ...pdf, contentType }] },
					"send: attachments[0].contentType must be a file's type/subtype, as application/pdf — never multipart/* or message/*",
				] as const,
		),
	])('refuses %s with MailRefused, naming where', (_, input, text) => {
		expect(refusal(input).message).toBe(text);
	});

	it.each([
		'To',
		'cc',
		'BCC',
		'From',
		'Sender',
		'reply-to',
		'Return-Path',
		'Subject',
		'MIME-Version',
		'Content-Type',
		'content-transfer-encoding',
		'Content-Disposition',
	])('refuses the header %s, which only the message sets', (name) => {
		const error = refusal({
			...message,
			headers: { [name]: 'eve@example.test' },
		});
		expect(error.message).toBe(
			`send: header ${name} is reserved — addresses, the subject and the MIME structure are never custom headers`,
		);
		expect(error.message).not.toContain('eve@example.test');
	});

	it('accepts attachments: bytes, a Buffer, a name outside ASCII, an empty list', () => {
		expect(() =>
			checkMessage({
				...message,
				attachments: [
					pdf,
					{
						filename: 'reçu n° 42 (copie).pdf',
						content: Buffer.from('%PDF-1.7'),
						contentType: 'application/pdf',
					},
					{
						filename: '.ics',
						content: new Uint8Array(),
						contentType: 'text/calendar',
					},
					{
						filename: 'data.json',
						content: new Uint8Array([123, 125]),
						contentType: 'application/vnd.api+json',
					},
				],
			}),
		).not.toThrow();
		expect(() => checkMessage({ ...message, attachments: [] })).not.toThrow();
	});

	it('never puts a refused file name in the message', () => {
		const error = refusal({
			...message,
			attachments: [{ ...pdf, filename: 'secret-7f3a/a.pdf' }],
		});
		expect(error.message).not.toContain('secret-7f3a');
	});

	it('accepts a header that only starts like a reserved one', () => {
		expect(() =>
			checkMessage({
				...message,
				headers: { 'X-To': 'a', 'To-Do': 'b', 'Contentful-Id': 'c' },
			}),
		).not.toThrow();
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
