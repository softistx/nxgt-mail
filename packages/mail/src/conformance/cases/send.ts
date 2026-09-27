import { check, same } from '../assert';
import { sampleAttachment, sampleInlineImage, sampleMessage } from '../sample';
import type { MailerCase } from '../types';
import { refusalCases } from './refusals';

/**
 * What every send must do, with no fault injected: deliver what it is given,
 * then refuse what no transport hands over (`./refusals`).
 */
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
		id: 'send.inlineImage',
		title:
			'an inline image is delivered with its content id, byte for byte, beside the HTML that shows it',
		async run(context) {
			const html = `<p>Acme</p><img src="cid:${sampleInlineImage.contentId}" alt="Acme">`;
			await context.mailer.send({
				...sampleMessage,
				html,
				attachments: [sampleInlineImage],
			});
			const [mail] = await context.delivered();
			check(
				mail !== undefined,
				'the message with an inline image was not delivered',
			);
			check(
				mail.attachments !== undefined,
				"the harness's delivered() reads back no attachments — read them from the receiving end, or skip send.inlineImage with the reason",
			);
			check(
				mail.attachments.length === 1,
				`expected 1 delivered attachment, got ${mail.attachments.length}`,
			);
			const [file] = mail.attachments;
			check(
				file !== undefined && file.contentId === sampleInlineImage.contentId,
				'the inline image was not delivered with its content id — the HTML shows a broken image',
			);
			check(
				file.contentType.toLowerCase() === sampleInlineImage.contentType,
				'the inline image was not delivered with its content type',
			);
			check(
				file.content instanceof Uint8Array &&
					same([...file.content], [...sampleInlineImage.content]),
				'the inline image was not delivered byte for byte',
			);
			check(
				mail.html === html,
				'the html part of a message with an inline image was not delivered as sent',
			);
		},
	},
	{
		id: 'send.idempotencyKey',
		title:
			'a message with an idempotency key is delivered, and the key is in none of its recipients, subject, HTML or text',
		async run(context) {
			// A transport either passes the key to a provider that deduplicates, or
			// ignores it. Neither refuses the message, and neither writes the key
			// where the reader sees it. A key per run: a harness that remembers
			// keys, as a provider's sandbox does, would otherwise replay the send.
			const key = `conformance-${crypto.randomUUID()}`;
			const sent = await context.mailer.send({
				...sampleMessage,
				idempotencyKey: key,
			});
			check(
				typeof sent === 'object' && sent !== null && 'messageId' in sent,
				'a send with an idempotency key did not answer SentMail',
			);
			const delivered = await context.delivered();
			check(
				delivered.length === 1,
				`expected 1 delivered message, got ${delivered.length}`,
			);
			const [mail] = delivered;
			check(
				![mail?.subject, mail?.html, mail?.text, ...(mail?.to ?? [])].some(
					(part) => part?.includes(key),
				),
				'the idempotency key was written into the e-mail',
			);
		},
	},
	{
		id: 'send.tags',
		title:
			'a message with tags is delivered, and no tag is in its recipients, subject, HTML or text',
		async run(context) {
			// Tags label the send at the provider: one that takes them sends them
			// there, one that does not ignores them. Neither refuses the message,
			// and neither writes a tag where the reader sees it.
			const run = `conformance-${crypto.randomUUID()}`;
			const sent = await context.mailer.send({
				...sampleMessage,
				tags: { category: 'conformance', run },
			});
			check(
				typeof sent === 'object' && sent !== null && 'messageId' in sent,
				'a send with tags did not answer SentMail',
			);
			const delivered = await context.delivered();
			check(
				delivered.length === 1,
				`expected 1 delivered message, got ${delivered.length}`,
			);
			const [mail] = delivered;
			check(
				![mail?.subject, mail?.html, mail?.text, ...(mail?.to ?? [])].some(
					(part) => part?.includes(run),
				),
				'a tag was written into the e-mail',
			);
		},
	},
	...refusalCases,
];
