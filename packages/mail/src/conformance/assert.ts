import type { MailerCaseContext } from './types';

/** Throws when `condition` is false. The suite depends on no assertion library. */
export function check(condition: boolean, what: string): asserts condition {
	if (!condition) throw new Error(`conformance: ${what}`);
}

export const same = (a: unknown, b: unknown) =>
	JSON.stringify(a) === JSON.stringify(b);

/**
 * Settles an expected rejection where it is created, and answers the error —
 * or throws when the promise resolved.
 */
export async function rejection(
	promise: Promise<unknown>,
	what: string,
): Promise<unknown> {
	return promise.then(
		() => {
			throw new Error(`conformance: ${what} resolved; it must reject`);
		},
		(error: unknown) => error,
	);
}

/** Throws when the receiving end got anything. */
export async function nothingDelivered(
	context: MailerCaseContext,
	what: string,
) {
	check(
		(await context.delivered()).length === 0,
		`${what}, yet something was delivered`,
	);
}
