import { MailError, MailFailure, MailRefused } from '../errors';
import type { MailMessage } from '../types';
import type { MailerCase, MailerCaseContext } from './types';

/** Throws when `condition` is false. The suite depends on no assertion library. */
function check(condition: boolean, what: string): asserts condition {
	if (!condition) throw new Error(`conformance: ${what}`);
}

const same = (a: unknown, b: unknown) =>
	JSON.stringify(a) === JSON.stringify(b);

/**
 * Settles an expected rejection where it is created, and answers the error —
 * or throws when the promise resolved.
 */
async function rejection(
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

/** A message with the characters a transport most often mangles. */
export const sampleMessage: MailMessage = {
	to: 'ada@example.test',
	from: 'noreply@example.test',
	subject: 'Réinitialisez votre mot de passe — ça expire à 23 h',
	html: '<p>Bonjour Ada 👋, <a href="https://example.test/r?t=abc&amp;x=1">réinitialiser</a></p>',
	text: 'Bonjour Ada 👋,\n\nréinitialiser : https://example.test/r?t=abc&x=1\n',
};

async function nothingDelivered(context: MailerCaseContext, what: string) {
	check(
		(await context.delivered()).length === 0,
		`${what}, yet something was delivered`,
	);
}

/** What every send must do, with no fault injected. */
export const sendCases: readonly MailerCase[] = [
	{
		id: 'send.answersSentMail',
		title: 'a send answers SentMail, with a string id or null',
		async run({ mailer }) {
			const sent = await mailer.send(sampleMessage);
			check(
				typeof sent === 'object' && sent !== null && 'messageId' in sent,
				'send did not answer an object with messageId',
			);
			check(
				sent.messageId === null ||
					(typeof sent.messageId === 'string' && sent.messageId !== ''),
				'messageId must be a non-empty string or null',
			);
		},
	},
	{
		id: 'send.deliversBytes',
		title:
			'a message is delivered byte for byte: accents, an emoji, a text part',
		async run(context) {
			await context.mailer.send(sampleMessage);
			const delivered = await context.delivered();
			check(
				delivered.length === 1,
				`expected 1 delivered message, got ${delivered.length}`,
			);
			const [mail] = delivered;
			check(
				mail?.subject === sampleMessage.subject,
				'the subject was not delivered as sent',
			);
			check(
				mail?.html === sampleMessage.html,
				'the html part was not delivered as sent',
			);
			check(
				mail?.text === sampleMessage.text,
				'the text part was not delivered as sent',
			);
		},
	},
	{
		id: 'send.recipients',
		title:
			'every recipient is delivered to, written as a string or with a name',
		async run(context) {
			await context.mailer.send({
				...sampleMessage,
				to: [
					'ada@example.test',
					{ name: 'Grace Hopper', address: 'grace@example.test' },
				],
			});
			const [mail] = await context.delivered();
			check(
				same(mail?.to, ['ada@example.test', 'grace@example.test']),
				'the recipients delivered are not the recipients sent',
			);
		},
	},
	{
		id: 'send.refusesNoRecipient',
		title:
			'a message with no recipient is refused with MailRefused, and nothing is sent',
		async run(context) {
			const error = await rejection(
				context.mailer.send({ ...sampleMessage, to: [] }),
				'a send with no recipient',
			);
			check(
				error instanceof MailRefused,
				'a send with no recipient must throw MailRefused',
			);
			await nothingDelivered(context, 'the message was refused');
		},
	},
	{
		id: 'send.refusesLineBreakInSubject',
		title:
			'a line break in the subject is refused with MailRefused: it is a header injection',
		async run(context) {
			const error = await rejection(
				context.mailer.send({
					...sampleMessage,
					subject: 'Hello\r\nBcc: eve@example.test',
				}),
				'a send with a line break in the subject',
			);
			check(
				error instanceof MailRefused,
				'a line break in the subject must throw MailRefused',
			);
			await nothingDelivered(context, 'the message was refused');
		},
	},
	{
		id: 'send.refusesWithoutTheValue',
		title: 'a refusal names where the problem is, never the value',
		async run({ mailer }) {
			const error = await rejection(
				mailer.send({ ...sampleMessage, to: 'not-an-address-7f3a' }),
				'a send to something that is not an address',
			);
			check(
				error instanceof MailRefused,
				'a malformed address must throw MailRefused',
			);
			check(
				!error.message.includes('not-an-address-7f3a'),
				'the refusal message holds the refused value',
			);
		},
	},
];

/** What a send must do when the transport fails. Needs {@link MailerFaults}. */
export const failureCases: readonly MailerCase[] = [
	{
		id: 'failure.outage',
		title:
			'an outage throws MailFailure with the cause, and nothing is retried',
		needs: 'faults',
		async run(context) {
			const faults = context.faults;
			check(faults !== null, 'faults are required');
			await faults.failNext('outage');
			const error = await rejection(
				context.mailer.send(sampleMessage),
				'a send during an outage',
			);
			// The class is the one imported from @nxgt/mail: a transport that
			// defines its own copy fails here.
			check(
				error instanceof MailFailure,
				'an outage must throw MailFailure from @nxgt/mail',
			);
			check(error instanceof MailError, 'MailFailure must extend MailError');
			check(
				error.code === 'MAIL_FAILED',
				'an outage must carry the code MAIL_FAILED',
			);
			check(
				error.cause !== undefined,
				"an outage must carry the transport's error as cause",
			);
			check(
				(await faults.attempts()) === 1,
				'the transport retried a failed hand-over',
			);
			await nothingDelivered(context, 'the hand-over failed');
		},
	},
	{
		id: 'failure.refusal',
		title: 'a message the provider refuses throws MailRefused with the cause',
		needs: 'faults',
		async run(context) {
			const faults = context.faults;
			check(faults !== null, 'faults are required');
			await faults.failNext('refusal');
			const error = await rejection(
				context.mailer.send(sampleMessage),
				'a refused send',
			);
			check(
				error instanceof MailRefused,
				'a refusal must throw MailRefused from @nxgt/mail',
			);
			check(
				error.code === 'MAIL_REFUSED',
				'a refusal must carry the code MAIL_REFUSED',
			);
			check(
				error.cause !== undefined,
				"a refusal must carry the transport's error as cause",
			);
			check(
				(await faults.attempts()) === 1,
				'the transport retried a refused message',
			);
		},
	},
	{
		id: 'failure.recovers',
		title: 'after a failure, the next send goes through',
		needs: 'faults',
		async run(context) {
			const faults = context.faults;
			check(faults !== null, 'faults are required');
			await faults.failNext('outage');
			await rejection(
				context.mailer.send(sampleMessage),
				'a send during an outage',
			);
			await context.mailer.send(sampleMessage);
			check(
				(await context.delivered()).length === 1,
				'the send after a failure was not delivered',
			);
		},
	},
];

/** Every case, in the order they are described. */
export const allMailerCases: readonly MailerCase[] = [
	...sendCases,
	...failureCases,
];
