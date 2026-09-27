/**
 * Renders the built e-mails in every locale and sends them to a memory
 * mailer: what the code that sends does in your application, with no
 * network. Run it after `maizzle build`, from this folder:
 *
 *   bun run build && bun run send
 *
 * In production, `mailer` is a transport's — `@nxgt/mail-smtp` or
 * `@nxgt/mail-resend` — and the locale comes from the recipient.
 */
import { createMemoryMailer } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';
import type { MailEmails } from './generated/mail'; // written by each `maizzle build`, git-ignored

const mails = createMailRenderer<MailEmails>({ dir: 'dist' }); // reads dist/ now, or throws
const mailer = createMemoryMailer();

for (const locale of mails.locales) {
	await mailer.send({
		to: { name: 'Ada Lovelace', address: 'ada@example.com' },
		from: 'noreply@acme.example',
		...mails.render(
			'verify-email',
			{ name: 'Ada <3', link: 'https://acme.example/verify?token=abc' },
			{ locale },
		),
	});
	await mailer.send({
		to: 'ada@example.com',
		from: 'noreply@acme.example',
		...mails.render('sign-in-code', { code: '621739' }, { locale }),
	});
}

for (const sent of mailer.sent) {
	console.log(sent.subject);
}

// What CI holds: every e-mail in every locale, each filled and escaped.
const subjects = new Set(mailer.sent.map((sent) => sent.subject));
if (mails.locales.length < 2 || subjects.size !== mails.locales.length * 2) {
	throw new Error('send: expected one distinct subject per e-mail and locale');
}
for (const sent of mailer.sent) {
	if (sent.html.includes('{{') || sent.text.includes('{{')) {
		throw new Error('send: a placeholder was left unfilled');
	}
	if (sent.subject.startsWith('Confirm') && !sent.html.includes('Ada &lt;3')) {
		throw new Error('send: the name was not HTML-escaped');
	}
}
