import { describe, expect, it } from 'bun:test';
import {
	signUnsubscribeToken,
	verifyUnsubscribeToken,
} from './unsubscribe-token';

const secret = 'a-secret-of-at-least-32-characters!';
const claims = { user: 'u_1', list: 'news' };

function thrown(run: () => unknown): Error {
	try {
		run();
	} catch (error) {
		return error as Error;
	}
	throw new Error('expected a throw');
}

describe('signUnsubscribeToken and verifyUnsubscribeToken', () => {
	it('round-trips an object, an array and a string', () => {
		for (const value of [claims, ['t', 'u', 'news'], 'plain', 7, false]) {
			const token = signUnsubscribeToken(value, secret);
			expect(verifyUnsubscribeToken(token, secret)).toEqual(value);
		}
	});

	it('writes base64url(claims).base64url(signature), safe in a URL', () => {
		const token = signUnsubscribeToken({ note: 'é/+?=&' }, secret);
		expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
		expect(encodeURIComponent(token)).toBe(token);
	});

	it('is deterministic for the same claims and secret', () => {
		expect(signUnsubscribeToken(claims, secret)).toBe(
			signUnsubscribeToken(claims, secret),
		);
	});

	it('answers null for a tampered signature', () => {
		const token = signUnsubscribeToken(claims, secret);
		const [body, sig] = token.split('.') as [string, string];
		const flipped = (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1);
		expect(verifyUnsubscribeToken(`${body}.${flipped}`, secret)).toBeNull();
	});

	it('answers null for tampered claims', () => {
		const token = signUnsubscribeToken(claims, secret);
		const sig = token.split('.')[1] as string;
		const other = signUnsubscribeToken({ user: 'u_2', list: 'news' }, secret);
		const otherBody = other.split('.')[0] as string;
		expect(verifyUnsubscribeToken(`${otherBody}.${sig}`, secret)).toBeNull();
	});

	it('answers null for a truncated token', () => {
		const token = signUnsubscribeToken(claims, secret);
		expect(verifyUnsubscribeToken(token.slice(0, -4), secret)).toBeNull();
		expect(
			verifyUnsubscribeToken(token.split('.')[0] as string, secret),
		).toBeNull();
		expect(verifyUnsubscribeToken(token.slice(0, 10), secret)).toBeNull();
	});

	it('answers null for anything that is not a token', () => {
		for (const bad of ['', '.', 'a.b.c', 'not a token', '..']) {
			expect(verifyUnsubscribeToken(bad, secret)).toBeNull();
		}
		expect(
			verifyUnsubscribeToken(undefined as unknown as string, secret),
		).toBeNull();
	});

	it('answers null under another secret', () => {
		const token = signUnsubscribeToken(claims, secret);
		expect(
			verifyUnsubscribeToken(token, 'another-secret-of-at-least-32-chars!'),
		).toBeNull();
	});

	it('answers null for a validly signed body of another version or shape', () => {
		const { createHmac } =
			require('node:crypto') as typeof import('node:crypto');
		const forge = (payload: string): string => {
			const body = Buffer.from(payload).toString('base64url');
			const sig = createHmac('sha256', secret).update(body).digest('base64url');
			return `${body}.${sig}`;
		};
		expect(verifyUnsubscribeToken(forge('[2,{"a":1}]'), secret)).toBeNull();
		expect(verifyUnsubscribeToken(forge('{"a":1}'), secret)).toBeNull();
		expect(verifyUnsubscribeToken(forge('not json'), secret)).toBeNull();
		expect(verifyUnsubscribeToken(forge('[1]'), secret)).toBeNull();
		expect(verifyUnsubscribeToken(forge('[1,{"a":1}]'), secret)).toEqual({
			a: 1,
		});
	});

	it('refuses a secret shorter than 32 characters, on both sides', () => {
		const short = 'x'.repeat(31);
		const sign = thrown(() => signUnsubscribeToken(claims, short));
		expect(sign).toBeInstanceOf(TypeError);
		expect(sign.message).toBe(
			'signUnsubscribeToken: the secret must be a string of at least 32 characters',
		);
		const token = signUnsubscribeToken(claims, secret);
		const verify = thrown(() => verifyUnsubscribeToken(token, short));
		expect(verify).toBeInstanceOf(TypeError);
		expect(verify.message).toBe(
			'verifyUnsubscribeToken: the secret must be a string of at least 32 characters',
		);
		expect(() => signUnsubscribeToken(claims, 'x'.repeat(32))).not.toThrow();
		expect(() =>
			signUnsubscribeToken(claims, undefined as unknown as string),
		).toThrow(TypeError);
	});

	it('refuses claims that JSON cannot hold, and null, without quoting the secret', () => {
		for (const bad of [undefined, null, () => 1, Symbol('x')]) {
			const error = thrown(() => signUnsubscribeToken(bad as never, secret));
			expect(error).toBeInstanceOf(TypeError);
			expect(error.message).not.toContain(secret);
		}
		const cyclic: Record<string, unknown> = {};
		cyclic.self = cyclic;
		expect(() => signUnsubscribeToken(cyclic as never, secret)).toThrow(
			TypeError,
		);
	});
});
