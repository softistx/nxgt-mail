import { allMailerCases } from './cases/index';
import type { MailerCase, MailerHarness, MailerRunner } from './types';

/** Why a case did not run. A skip is always reported with its reason, never silent. */
export const MAILER_SKIP_REASONS = {
	faults:
		'faults not provided: the failure contract is not proven for this transport',
} as const;

/**
 * Runs one case against a freshly opened transport, and closes it, pass or
 * fail. Answers the reason when the case cannot run on this harness.
 */
export async function runMailerCase(
	mailerCase: MailerCase,
	harness: MailerHarness,
): Promise<{ readonly skipped: string } | { readonly passed: true }> {
	const opened = await harness.open();
	let outcome: { readonly skipped: string } | { readonly passed: true };
	try {
		if (mailerCase.needs === 'faults' && opened.faults === undefined) {
			outcome = { skipped: MAILER_SKIP_REASONS.faults };
		} else {
			await mailerCase.run({
				mailer: opened.mailer,
				delivered: () => opened.delivered(),
				faults: opened.faults ?? null,
			});
			outcome = { passed: true };
		}
	} catch (error) {
		// The case's failure is what the author needs to read: a close that
		// fails too must not replace it.
		await opened.close?.().then(
			() => undefined,
			() => undefined,
		);
		throw error;
	}
	await opened.close?.();
	return outcome;
}

function globalRunner(): MailerRunner {
	const { describe, it } = globalThis as unknown as Partial<MailerRunner>;
	if (typeof describe !== 'function' || typeof it !== 'function') {
		throw new TypeError(
			'describeMailer: no test runner found — pass runner: { describe, it } from your test framework',
		);
	}
	return { describe, it };
}

/**
 * Describes every case against one transport, under bun:test, vitest or jest.
 *
 * ```ts
 * import { describe, it } from 'bun:test';
 * import { describeMailer } from '@nxgt/mail/conformance';
 *
 * describeMailer({ name: 'my transport', harness, runner: { describe, it } });
 * ```
 *
 * `runner` defaults to the global `describe` and `it`, when the framework
 * defines them.
 */
export function describeMailer(options: {
	readonly name: string;
	readonly harness: MailerHarness;
	readonly runner?: MailerRunner;
	/** Case ids to skip, each with the reason — reported, never silent. */
	readonly skip?: Readonly<Record<string, string>>;
	/** Declared up front, so a missing `faults` is reported before the first case runs. */
	readonly faults?: boolean;
}): void {
	const runner = options.runner ?? globalRunner();
	const skip = options.skip ?? {};
	for (const id of Object.keys(skip)) {
		if (!allMailerCases.some((c) => c.id === id)) {
			throw new TypeError(`describeMailer: skip names no case: ${id}`);
		}
	}

	runner.describe(`${options.name} — @nxgt/mail conformance`, () => {
		for (const mailerCase of allMailerCases) {
			const title = `${mailerCase.id}: ${mailerCase.title}`;
			const reason =
				skip[mailerCase.id] ??
				(mailerCase.needs === 'faults' && options.faults === false
					? MAILER_SKIP_REASONS.faults
					: undefined);
			if (reason !== undefined) {
				runner.it.skip(`${title} (skipped: ${reason})`, async () => {});
				continue;
			}
			runner.it(title, async () => {
				const result = await runMailerCase(mailerCase, options.harness);
				if ('skipped' in result) {
					throw new Error(
						`conformance: ${mailerCase.id}: ${result.skipped} — pass faults: false to describeMailer to skip it on purpose`,
					);
				}
			});
		}
	});
}
