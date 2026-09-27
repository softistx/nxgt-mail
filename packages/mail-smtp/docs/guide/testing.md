# Testing

Two different things to test, with two different tools:

- **An application that sends e-mail.** Do not start an SMTP server: wire
  `createMemoryMailer()` from `@nxgt/mail` in the tests, read its outbox, and
  make a send fail with `failNext()`. See
  [`@nxgt/mail` — testing](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/testing.md).
- **This transport, against a real SMTP server.** A local
  [`smtp-server`](https://nodemailer.com/extras/smtp-server/) receives, and
  [`mailparser`](https://nodemailer.com/extras/mailparser/) reads back what
  arrived. That is how this package passes `@nxgt/mail/conformance`, and the
  rest of this page shows it.

```sh
bun add -d smtp-server mailparser @types/smtp-server @types/mailparser
```

## A local SMTP server

It keeps what it receives, and fails on demand **the way an SMTP server
fails** — a `421` for an outage, a `554` for a refusal — so the suite proves
the transport's reading of nodemailer's errors, not a wrapper's:

```ts
// smtp-server.ts
import type { AddressInfo } from 'node:net';
import type { DeliveredMail } from '@nxgt/mail/conformance';
import { simpleParser } from 'mailparser';
import { SMTPServer } from 'smtp-server';

type Fault = 'outage' | 'refusal';

export async function startSmtpServer() {
	const delivered: DeliveredMail[] = [];
	const faults: Fault[] = [];
	let attempts = 0;
	const reply = (message: string, responseCode: number) => Object.assign(new Error(message), { responseCode });

	const server = new SMTPServer({
		authOptional: true,
		disabledCommands: ['STARTTLS'],
		logger: false,
		onMailFrom(_address, _session, callback) {
			attempts += 1; // one hand-over
			if (faults[0] === 'outage') {
				faults.shift();
				return callback(reply('Service not available', 421));
			}
			callback();
		},
		onData(stream, session, callback) {
			const refuse = faults[0] === 'refusal';
			if (refuse) faults.shift();
			// skipImageLinks: by default mailparser rewrites each cid: in the HTML
			// as a data: URL, and the HTML read back is not the HTML sent.
			simpleParser(stream, { skipImageLinks: true }).then(
				(parsed) => {
					if (refuse) return callback(reply('Message rejected', 554));
					delivered.push({
						to: session.envelope.rcptTo.map((rcpt) => rcpt.address), // what the envelope named
						subject: parsed.subject ?? '',
						html: typeof parsed.html === 'string' ? parsed.html : '',
						text: parsed.text ?? '',
						attachments: parsed.attachments.map((file) => ({
							filename: file.filename ?? '',
							content: new Uint8Array(file.content), // a Buffer, read back as bytes
							contentType: file.contentType,
							...(file.cid === undefined ? {} : { contentId: file.cid }), // an inline image, no angle brackets
						})),
					});
					callback();
				},
				(error: Error) => callback(error),
			);
		},
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const { port } = server.server.address() as AddressInfo;
	return {
		port,
		delivered,
		faults,
		attempts: () => attempts,
		close: () => new Promise<void>((resolve) => server.close(() => resolve())),
	};
}
```

`to` is read from the **envelope** (`RCPT TO`), not from the `To:` header: it
is who the server was asked to deliver to, and what proves a name did not
smuggle a second recipient in. `attachments` is what `mailparser` decoded,
the file name included: `send.attachment` fails on a harness that leaves it
out. An inline image carries its `contentId`, read from `mailparser`'s `cid`:
`send.inlineImage` fails on a harness that leaves it out. Parse with
`skipImageLinks: true`, or `mailparser` rewrites the HTML's `cid:` URLs as
`data:` URLs and the HTML read back is not the HTML sent.

## The conformance suite

One fresh server and transporter per case, closed after it:

```ts
import { describe, it } from 'bun:test';
import { describeMailer } from '@nxgt/mail/conformance';
import { createSmtpMailer } from '@nxgt/mail-smtp';
import nodemailer from 'nodemailer';
import { startSmtpServer } from './smtp-server';

describeMailer({
	name: 'createSmtpMailer',
	runner: { describe, it }, // bun test puts neither on globalThis
	harness: {
		async open() {
			const server = await startSmtpServer();
			const transporter = nodemailer.createTransport({ host: '127.0.0.1', port: server.port, secure: false, ignoreTLS: true });
			return {
				mailer: createSmtpMailer({ transporter }),
				delivered: async () => [...server.delivered],
				faults: {
					failNext: async (kind) => {
						server.faults.push(kind);
					},
					attempts: async () => server.attempts(),
				},
				async close() {
					transporter.close();
					await server.close();
				},
			};
		},
	},
});
```

All fifteen cases pass: a send answers `SentMail`, the message arrives byte for
byte (accents, an emoji, `&amp;` in a link), every recipient is delivered to,
a hostile name reaches only its own address, an attachment arrives byte for
byte with its name and type, an inline image arrives with its content id, a message with an idempotency key is delivered
without the key written in it, the refusals — a `Bcc` among the custom headers
and an attachment named with a path included — and the three
failure cases — an outage is a `MailFailure` with its `cause` and one attempt,
a refusal a `MailRefused`, and the next send goes through.

## Beyond the suite

The package's own specs
([`src/index.spec.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-smtp/src/index.spec.ts))
add what the suite does not ask of every transport:

- a server that is not listening ends in `MailFailure`, `ESOCKET` on `cause`;
- a recipient refused for good (`550`) is a `MailRefused`, one refused for now
  (`450`) a `MailFailure`;
- one recipient refused while another is accepted still throws — the
  accepted one has the message — and every recipient refused is a
  `MailRefused` only when every refusal is permanent, whatever their order;
- credentials refused (`535`, `EAUTH`), authentication required (`530`) and
  a sender refused at `MAIL FROM` (`550`) are a `MailFailure`;
- a string address is handed to nodemailer as `{ name: '', address }`, so it
  never parses one;
- no error message holds the password or a recipient's address;
- the default `from`, `replyTo` and `headers` reach the server, and the id is
  nodemailer's;
- nodemailer is told never to read a file or a URL;
- `idempotencyKey` is ignored: the same message sent twice is handed over
  twice, and the key appears nowhere in what nodemailer receives;
- attachments are handed over as `{ filename, content, contentType }` with a
  `Buffer` copied from the bytes — a change to the caller's array during the
  send reaches no one — and an empty list sends none;
- an inline image's `contentId` is handed over as nodemailer's `cid`, and a
  plain file gets none;
- a message over the server's size limit (`552`, from `smtp-server`'s `size`)
  is a `MailRefused`, and nothing is delivered.

A transporter can also be a plain object, when a test only needs to see what
was handed over:

```ts
import { expect, test } from 'bun:test';
import { sampleMessage } from '@nxgt/mail/conformance';
import { createSmtpMailer } from '@nxgt/mail-smtp';

test('hands the parts over as strings', async () => {
	const handed: unknown[] = [];
	const mailer = createSmtpMailer({
		transporter: {
			async sendMail(mail) {
				handed.push(mail);
				return { messageId: '<1@test>' };
			},
		},
	});
	expect(await mailer.send(sampleMessage)).toEqual({ messageId: '<1@test>' });
	expect(handed[0]).toMatchObject({ subject: sampleMessage.subject, disableUrlAccess: true });
});
```

## See also

- [`@nxgt/mail` — writing a transport](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/transports.md)
  — the contract, the harness and every case.
- [Errors](errors.md) — the mapping these tests pin down.
