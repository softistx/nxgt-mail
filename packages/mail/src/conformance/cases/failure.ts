import { MailError, MailFailure, MailRefused } from '../../errors';
import { check, nothingDelivered, rejection } from '../assert';
import { sampleMessage } from '../sample';
import type { MailerCase } from '../types';

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
