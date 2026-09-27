import { sendBatch } from '../../batch';
import { MailRefused } from '../../errors';
import { check } from '../assert';
import { sampleMessage } from '../sample';
import type { MailerCase } from '../types';

/**
 * What `sendBatch` must do against any transport: deliver every message it is
 * given, and report one refused message on its own — never as a throw, and
 * never at the cost of the messages beside it.
 */
export const batchCases: readonly MailerCase[] = [
	{
		id: 'batch.deliversEach',
		title: 'a batch delivers each message, and reports each one sent',
		async run(context) {
			const messages = [
				{ ...sampleMessage, subject: 'First' },
				{ ...sampleMessage, subject: 'Second' },
				{ ...sampleMessage, subject: 'Third' },
			];
			const results = await sendBatch(context.mailer, messages);
			check(
				results.length === messages.length,
				`expected ${messages.length} results, got ${results.length}`,
			);
			results.forEach((result, index) => {
				check(
					result.status === 'sent',
					`message ${index} was not sent: ${result.status === 'sent' ? '' : result.error.message}`,
				);
			});
			const delivered = await context.delivered();
			check(
				delivered.length === messages.length,
				`expected ${messages.length} delivered messages, got ${delivered.length}`,
			);
			messages.forEach((message, index) => {
				check(
					delivered[index]?.subject === message.subject,
					'the batch did not deliver its messages in order',
				);
			});
		},
	},
	{
		id: 'batch.refusalPerMessage',
		title:
			'one message a transport refuses is reported refused, on its own — the others are still sent',
		async run(context) {
			const messages = [
				{ ...sampleMessage, subject: 'Before' },
				// `to: []` — `checkMessage` refuses it: no recipient at all.
				{ ...sampleMessage, subject: 'Bad', to: [] },
				{ ...sampleMessage, subject: 'After' },
			];
			const results = await sendBatch(context.mailer, messages);
			check(results.length === 3, `expected 3 results, got ${results.length}`);
			const [before, bad, after] = results;
			check(
				before?.status === 'sent',
				'the message before the refused one was not sent',
			);
			check(
				bad?.status === 'refused',
				'a message with no recipient was not reported refused',
			);
			check(
				bad?.status === 'refused' && bad.error instanceof MailRefused,
				'the refused message did not carry a MailRefused',
			);
			check(
				after?.status === 'sent',
				'the message after the refused one was not sent',
			);
			const delivered = await context.delivered();
			check(
				delivered.length === 2,
				`expected 2 delivered messages (the refused one excluded), got ${delivered.length}`,
			);
			check(
				delivered[0]?.subject === 'Before' && delivered[1]?.subject === 'After',
				'the messages around the refused one were not delivered as sent',
			);
		},
	},
];
