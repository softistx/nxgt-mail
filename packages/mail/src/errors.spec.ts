import { describe, expect, it } from 'bun:test';
import {
	MailError,
	type MailErrorCode,
	MailFailure,
	MailRefused,
} from './errors';

describe('MailError', () => {
	it("carries the cause, so the transport's error is not lost", () => {
		const cause = new Error('econnrefused');
		const error = new MailFailure('send: the transport could not be reached', {
			cause,
		});

		expect(error.cause).toBe(cause);
		expect(error).toBeInstanceOf(MailError);
		expect(error).toBeInstanceOf(Error);
	});

	it('extends Error and not TypeError, so a catch needs no ordering', () => {
		// A TypeError is a wiring mistake. A subclass of it would have to be
		// tested for BEFORE any TypeError branch.
		expect(new MailFailure('x')).not.toBeInstanceOf(TypeError);
		expect(new MailRefused('x')).not.toBeInstanceOf(TypeError);
	});

	it('names itself and carries its code, so a log line says which refusal it was', () => {
		expect(new MailFailure('x').name).toBe('MailFailure');
		expect(new MailFailure('x').code).toBe('MAIL_FAILED');
		expect(new MailRefused('x').name).toBe('MailRefused');
		expect(new MailRefused('x').code).toBe('MAIL_REFUSED');
	});

	it('has codes a switch can be exhaustive over', () => {
		// If a code is added and this switch is not, `answer` stops returning a
		// number and typecheck fails here rather than in an application.
		const answer = (code: MailErrorCode): number => {
			switch (code) {
				case 'MAIL_FAILED':
					return 503;
				case 'MAIL_REFUSED':
					return 422;
			}
		};

		expect(answer(new MailFailure('x').code)).toBe(503);
		expect(answer(new MailRefused('x').code)).toBe(422);
	});
});
