import { MailRefused } from '../../errors';
import { check, nothingDelivered, rejection } from '../assert';
import { sampleAttachment, sampleMessage } from '../sample';
import type { MailerCase } from '../types';

/**
 * The `send.refuses*` cases: what every transport refuses with `MailRefused`,
 * delivering nothing. Part of `sendCases`, after the deliveries.
 */
export const refusalCases: readonly MailerCase[] = [
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
		id: 'send.refusesAddressHeader',
		title:
			'a Bcc among the custom headers is refused with MailRefused: it would add an unchecked recipient',
		async run(context) {
			// A custom header named Bcc, To or Cc reaches the envelope of an SMTP
			// transport, and writes a line no address check ever saw.
			const error = await rejection(
				context.mailer.send({
					...sampleMessage,
					// biome-ignore lint/style/useNamingConvention: a header's name, as a mail client writes it.
					headers: { Bcc: 'eve@example.test' },
				}),
				'a send with a Bcc header',
			);
			check(
				error instanceof MailRefused,
				'a Bcc header must throw MailRefused',
			);
			check(
				!error.message.includes('eve@example.test'),
				'the refusal message holds the refused value',
			);
			await nothingDelivered(context, 'the message was refused');
		},
	},
	{
		id: 'send.refusesAttachmentPath',
		title:
			'an attachment named with a path is refused with MailRefused: a mail client could save it elsewhere',
		async run(context) {
			const error = await rejection(
				context.mailer.send({
					...sampleMessage,
					attachments: [
						{ ...sampleAttachment, filename: '../secret-7f3a/report.pdf' },
					],
				}),
				'a send with an attachment named with a path',
			);
			check(
				error instanceof MailRefused,
				'an attachment named with a path must throw MailRefused',
			);
			check(
				!error.message.includes('secret-7f3a'),
				'the refusal message holds the refused value',
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
