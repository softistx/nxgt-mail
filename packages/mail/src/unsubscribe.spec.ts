import { describe, expect, it } from 'bun:test';
import { MailRefused } from './errors';
import { createMemoryMailer } from './memory';
import { checkMessage } from './message';
import { listUnsubscribe } from './unsubscribe';

const url = 'https://example.test/unsubscribe?token=s3cr3t';

function thrown(run: () => unknown): Error {
	try {
		run();
	} catch (error) {
		return error as Error;
	}
	throw new Error('expected a throw');
}

describe('listUnsubscribe', () => {
	it('answers the two headers of one-click unsubscribe', () => {
		expect(listUnsubscribe({ url })).toEqual({
			'List-Unsubscribe': `<${url}>`,
			'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
		});
	});

	it('adds the mailto after the URL', () => {
		expect(
			listUnsubscribe({ url, mailto: 'unsubscribe@example.test' })[
				'List-Unsubscribe'
			],
		).toBe(`<${url}>, <mailto:unsubscribe@example.test>`);
	});

	it('gives headers checkMessage accepts, and a transport sends as they are', async () => {
		const headers = listUnsubscribe({ url, mailto: 'u@example.test' });
		const message = {
			to: 'ada@example.test',
			subject: 'News',
			html: '<p>News</p>',
			text: 'News',
			headers: { ...headers, 'X-Entity-Ref-ID': 'news-42' },
		};
		expect(() => checkMessage(message)).not.toThrow();
		const mailer = createMemoryMailer();
		await mailer.send(message);
		expect(mailer.sent[0]?.headers).toMatchObject(headers);
	});

	it('keeps a percent-encoded comma, and a port', () => {
		const encoded = 'https://example.test:8443/u?list=a%2Cb';
		expect(listUnsubscribe({ url: encoded })['List-Unsubscribe']).toBe(
			`<${encoded}>`,
		);
	});

	it.each([
		['an http: URL', 'http://example.test/u'],
		['a mailto: URL', 'mailto:u@example.test'],
		['a relative URL', '/unsubscribe?token=s3cr3t'],
		['an empty URL', ''],
		['a line break', 'https://example.test/u\r\nBcc: eve@example.test'],
		['a space', 'https://example.test/u?t=a b'],
		['an angle bracket', 'https://example.test/u>, <https://evil.test'],
		['a raw comma', 'https://example.test/u?list=a,b'],
		['a tab', 'https://example.test/u\t'],
	])('refuses %s with MailRefused, never quoting it', (_, bad) => {
		const error = thrown(() => listUnsubscribe({ url: bad }));
		expect(error).toBeInstanceOf(MailRefused);
		expect(error.message).toBe(
			'listUnsubscribe: url must be an https: URL without whitespace, <, > or a raw comma',
		);
	});

	it('never quotes the token of a refused URL', () => {
		const error = thrown(() =>
			listUnsubscribe({ url: 'http://example.test/u?token=s3cr3t' }),
		);
		expect(error.message).not.toContain('s3cr3t');
	});

	it.each([
		['a display name', 'Unsub <u@example.test>'],
		['two addresses', 'u@example.test, v@example.test'],
		['no @', 'unsubscribe'],
		['a mailto: prefix', 'mailto:u@example.test'],
	])('refuses a mailto with %s', (_, mailto) => {
		const error = thrown(() => listUnsubscribe({ url, mailto }));
		expect(error).toBeInstanceOf(MailRefused);
		expect(error.message).toBe(
			'listUnsubscribe: mailto must be a bare e-mail address, as unsubscribe@example.com',
		);
	});

	it('refuses what is not text with a TypeError, as a mistake in the code', () => {
		expect(() => listUnsubscribe(null as never)).toThrow(
			new TypeError('listUnsubscribe: options must be an object, as { url }'),
		);
		expect(() =>
			listUnsubscribe({ url: new URL(url) as unknown as string }),
		).toThrow(new TypeError('listUnsubscribe: url must be a string'));
		expect(() => listUnsubscribe({ url, mailto: 42 as never })).toThrow(
			new TypeError('listUnsubscribe: mailto must be a string'),
		);
	});
});
