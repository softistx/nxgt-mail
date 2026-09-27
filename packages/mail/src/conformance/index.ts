/**
 * `@nxgt/mail/conformance` — **what makes the transport contract checkable.**
 *
 * A transport author runs this against their transport, and it fails one that
 * breaks the contract of the port — above all *a failure throws*: an outage
 * that resolves, or a transport that retries in secret, or its own copy of
 * `MailFailure` that `instanceof` rejects.
 *
 * Three layers, and the lowest depends on no test runner:
 *
 * - the cases, as data — `sendCases`, `failureCases`, `allMailerCases`;
 * - `runMailerCase`, which runs one against a harness;
 * - `describeMailer`, which describes them all under bun:test, vitest or jest.
 */

export {
	allMailerCases,
	batchCases,
	failureCases,
	sendCases,
} from './cases/index';
export {
	describeMailer,
	MAILER_SKIP_REASONS,
	runMailerCase,
} from './describe';
export { checkMailEvent, sampleMailEvent } from './events';
export { referenceMailerHarness } from './reference';
export {
	sampleAttachment,
	sampleInlineImage,
	sampleMessage,
} from './sample';
export type {
	DeliveredMail,
	MailerCase,
	MailerCaseContext,
	MailerFaults,
	MailerHarness,
	MailerRunner,
	OpenedMailer,
} from './types';
