import { MailRefused } from '../../errors';
import { check, nothingDelivered, rejection, same } from '../assert';
import { sampleAttachment, sampleMessage } from '../sample';
import type { MailerCase } from '../types';

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
		id: 'send.hostileName',
		title: 'a name holding an address and a comma reaches only its own address',
		async run(context) {
			// A name is free text, and quoting it is the transport's job. One that
			// pastes it into a header unquoted hands mallory a copy.
			await context.mailer.send({
				...sampleMessage,
				to: {
					name: 'Ada <mallory@example.test>, "Eve" <eve@example.test>;',
					address: 'ada@example.test',
				},
			});
			const [mail] = await context.delivered();
			check(
				same(mail?.to, ['ada@example.test']),
				'a name let a second recipient through',
			);
		},
	},
	{
		id: 'send.attachment',
		title:
			'an attachment is delivered byte for byte, with its name and its type',
		async run(context) {
			await context.mailer.send({
				...sampleMessage,
				attachments: [sampleAttachment],
			});
			const [mail] = await context.delivered();
			check(
				mail !== undefined,
				'the message with an attachment was not delivered',
			);
			check(
				mail.attachments !== undefined,
				"the harness's delivered() reads back no attachments — read them from the receiving end, or skip send.attachment with the reason",
			);
			check(
				mail.attachments.length === 1,
				`expected 1 delivered attachment, got ${mail.attachments.length}`,
			);
			const [file] = mail.attachments;
			check(
				file?.filename === sampleAttachment.filename,
				'the attachment was not delivered with its file name',
			);
			// A media type is case-insensitive: a parser may lower it.
			check(
				file.contentType.toLowerCase() === sampleAttachment.contentType,
				'the attachment was not delivered with its content type',
			);
			check(
				file.content instanceof Uint8Array &&
					same([...file.content], [...sampleAttachment.content]),
				'the attachment was not delivered byte for byte',
			);
			check(
				mail.text === sampleMessage.text && mail.html === sampleMessage.html,
				'the parts of a message with an attachment were not delivered as sent',
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
