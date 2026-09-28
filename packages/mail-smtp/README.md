# @nxgt/mail-smtp

An SMTP transport for [`@nxgt/mail`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail),
on the [`nodemailer`](https://nodemailer.com) you install and configure. It
throws the `MailFailure` and `MailRefused` of its `@nxgt/mail` peer, so
`instanceof` holds whichever transport is wired, and it passes the
`@nxgt/mail/conformance` suite against a real local SMTP server.

```ts
import nodemailer from 'nodemailer';
import { createSmtpMailer } from '@nxgt/mail-smtp';

const mailer = createSmtpMailer({
	transporter: nodemailer.createTransport({
		host: 'smtp.example.com',
		port: 587,
		auth: { user: 'acme', pass: process.env.SMTP_PASSWORD },
	}),
	from: { name: 'Acme', address: 'noreply@acme.test' },
});

const { messageId } = await mailer.send({
	to: 'ada@example.com',
	subject: 'Confirm your address',
	html: '<p>…</p>',
	text: '…',
}); // '<…@acme.test>' — or it throws
```

> **0.x.** A minor version may still change the surface; the changelog says how.

## Install

```sh
bun add @nxgt/mail-smtp @nxgt/mail nodemailer
```

Peers, all required:

- `@nxgt/mail` — the port, the errors and the checks: `^0.5`, the version
  whose conformance suite checks `idempotencyKey`. One copy in your tree, so `error instanceof MailFailure`
  holds.
- `nodemailer` (`>=7 <11`; tested with 10). This package never imports it:
  you create the transporter, with every SMTP option nodemailer has.
- `typescript` (6). Bundler resolution (`"moduleResolution": "bundler"`) is
  what is supported and tested; `nodenext` is out of contract.

Runs on Node `>=20` or Bun; CI tests on Bun only.

## Exports

| Export | What it is |
| --- | --- |
| `createSmtpMailer(options)` | A `Mailer` that hands each message to your nodemailer transporter |
| `SmtpMailerOptions` | `{ transporter, from? }` |
| `SmtpTransporter` | The part of a nodemailer transporter it calls: `sendMail` |
| `SmtpSentInfo` | What `sendMail` resolves with: the id, and the recipients refused while others were accepted |

## Usage

### Options

| Option | Type | Default | |
| --- | --- | --- | --- |
| `transporter` | `SmtpTransporter` | required | What `nodemailer.createTransport(…)` answers, configured by you |
| `from` | `Address` | none | The sender of a message that names none |

```ts
import nodemailer from 'nodemailer';
import { createSmtpMailer } from '@nxgt/mail-smtp';

// An SMTP URL works as well as an options object.
const mailer = createSmtpMailer({
	transporter: nodemailer.createTransport(process.env.SMTP_URL ?? 'smtp://localhost:1025'),
});

await mailer.send({
	to: [{ name: 'Doe, John', address: 'john@example.com' }],
	from: 'billing@acme.test', // required here: this mailer has no default
	replyTo: 'support@acme.test',
	headers: { 'X-Entity-Ref-ID': 'invoice-42' },
	subject: 'Your invoice',
	html: '<p>…</p>',
	text: '…',
});
```

- Every message is checked by `checkMessage` from `@nxgt/mail` first: the
  same refusals, with the same messages, as every transport.
- A message's own `from` wins over the default.
- A name is handed to nodemailer as `{ name, address }`: nodemailer quotes and
  encodes it, so `Doe, John` names one recipient.
- `messageId` is nodemailer's id (`<…@host>`), or `null` when it gives none.
- For marketing mail, build `List-Unsubscribe` and `List-Unsubscribe-Post`
  with `listUnsubscribe` from `@nxgt/mail` rather than by hand; your relay, or
  nodemailer's `dkim` option, must DKIM-sign them — see
  [one-click unsubscribe](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md#one-click-unsubscribe).
- The parts are strings and the attachments bytes: nodemailer is told never
  to read a file or a URL (`disableFileAccess`, `disableUrlAccess`).
- `idempotencyKey` is ignored: SMTP has no such mechanism, so a message sent
  twice is delivered twice. See
  [Setting up — the idempotency key](docs/guide/setup.md#the-idempotency-key).
- `tags` are ignored: SMTP has no tags, so nothing names them in the e-mail.
  `checkMessage` still checks them, so a message that passes here passes a
  transport that sends them.

### Attachments

`attachments` on the message are handed to nodemailer as bytes — a `Buffer`
copied from each `Uint8Array` — with their file name and type:

```ts
import { readFile } from 'node:fs/promises';

await mailer.send({
	to: 'ada@example.com',
	subject: 'Your invoice',
	html: '<p>Your invoice is attached.</p>',
	text: 'Your invoice is attached.',
	attachments: [
		{ filename: 'invoice-42.pdf', content: await readFile('/srv/invoices/42.pdf'), contentType: 'application/pdf' },
	],
});
```

There is no `path` or `href`, as nodemailer would take them: read the file
yourself, where your code decides which files may be read. A file name
outside ASCII is encoded by nodemailer. The server caps the whole message,
attachments in base64 included — a third larger than the files — at about
25 MB sending through Gmail, often 10 to 50 MB elsewhere; over it, the
server answers `552` and `send` throws `MailRefused`. **A large or sensitive
file is a signed link in the template**, not an attachment. See
[Setting up — attachments](docs/guide/setup.md#attachments).

### Inline images — `cid:`

An attachment with a `contentId` is handed to nodemailer as its `cid`: the
file gets a `Content-ID` header, `Content-Disposition: inline`, and sits in a
`multipart/related` beside the HTML that shows it:

```ts
import { readFile } from 'node:fs/promises';

await mailer.send({
	to: 'ada@example.com',
	subject: 'Your receipt',
	html: '<img src="cid:logo@acme.test" alt="Acme"><p>Thank you.</p>',
	text: 'Thank you.',
	attachments: [
		{ filename: 'logo.png', content: await readFile('assets/logo.png'), contentType: 'image/png', contentId: 'logo@acme.test' },
	],
});
```

`checkMessage` refuses a `cid:` the HTML shows with no attachment of that
`contentId`, with `MailRefused`. Needs `@nxgt/mail` 0.6 or later. See
[Setting up — inline images](docs/guide/setup.md#inline-images).

### Scheduling — refused, not sent early

SMTP has no way to schedule a send: a message with `scheduledAt` is refused
with `MailRefused` — `send: scheduledAt is not supported — SMTP has no way to
schedule a send, and sending it now would be wrong` — rather than sent at
once, which would look like success while doing the opposite of what was
asked:

```ts
import { MailRefused } from '@nxgt/mail';

const error = await mailer
	.send({ ...message, scheduledAt: new Date(Date.now() + 86_400_000) })
	.catch((e: unknown) => e);

error instanceof MailRefused; // true — nothing was sent
```

Schedule through a transport that supports it (`@nxgt/mail-resend`), or hold
the e-mail yourself and send it through SMTP, with no `scheduledAt`, when the
moment comes. Needs `@nxgt/mail` 0.7 or later.

### Errors — a refusal or a failure

| When | Throws | `cause` |
| --- | --- | --- |
| The server cannot be reached, a timeout, a `4xx` (try later), credentials refused (`530`–`539`), the sender refused (`5xx` on `MAIL FROM`) | `MailFailure` — `send: the SMTP server could not take the message` | nodemailer's error, with its `code` and `responseCode` |
| A permanent `5xx` on every recipient or on the content (`550`; `552` too large, attachments included; `554`) | `MailRefused` — `send: the SMTP server refused the message` | nodemailer's error |
| Some recipients refused, the others accepted — **they may have the message** | `MailRefused` — `send: the SMTP server refused <n> of <total> recipients, and may have delivered to the others` — or `MailFailure` — `send: the SMTP server could not take <n> of <total> recipients, …` when a refusal is not permanent, or nodemailer gives no reason | nodemailer's error for the first refused recipient |
| No sender, on the message or as a default | `MailRefused` — `send: from is missing — give the message a from, or createSmtpMailer a default one` | — |
| A bad option | `TypeError` from `createSmtpMailer` | — |

```ts
import { MailFailure, MailRefused } from '@nxgt/mail';

try {
	await mailer.send(message);
} catch (error) {
	if (error instanceof MailRefused) {
		// sending it again unchanged fails again: fix the address or the content
	} else if (error instanceof MailFailure) {
		// nothing is known to have been sent: retry later, from a queue you can see
	}
	throw error;
}
```

A message reports a shape, never a value: no address, no password, no
server answer. What the server said is on `cause`. Nothing is retried.
Every case is in [Errors](docs/guide/errors.md).

### Testing

In an application's tests, use `createMemoryMailer()` from `@nxgt/mail`. To
test this transport against a real server, see [Testing](docs/guide/testing.md):
a local `smtp-server`, `mailparser` to read back what arrived, and
`describeMailer`.

### Delivery events — out of scope

SMTP has no webhook: `send` only hands the message to the relay, which then
does its own delivery over SMTP to every recipient's server, one hop at a
time. What happened next — delivered, bounced, deferred — lives in the
**receiving MTA's own logs**, which this package has no access to, or comes
back as a **DSN** (delivery status notification, RFC 3464): a bounce e-mail
sent to the envelope sender, which your application would have to receive
and parse itself, out of scope here. A provider transport that has a
webhook — [`@nxgt/mail-resend/webhooks`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail-resend#webhooks--delivery-events) —
answers `@nxgt/mail`'s neutral `MailEvent` instead; see
[its guide to delivery events](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/events.md).

## Traps

**Close a pooled transporter when the process stops.** With `pool: true`,
nodemailer keeps connections open: call `transporter.close()` on shutdown.

**nodemailer's timeouts are yours to set.** It waits up to two minutes for a
connection by default; a send in a request handler should not. Set
`connectionTimeout`, `greetingTimeout` and `socketTimeout` on the transporter.
A timeout ends in `MailFailure`.

**A `4xx` is a failure, a `5xx` a refusal** — except authentication (`530`–
`539`) and a sender refused at `MAIL FROM`: the next message would be refused
the same way, so it is a failure of the wiring, not of the message.

**`scheduledAt` is refused, never ignored.** Unlike `idempotencyKey` and
`tags`, which SMTP has no room for and the transport quietly drops, a
scheduled send is refused with `MailRefused`: ignoring it would send the
e-mail now, which is the one behaviour `scheduledAt` exists to prevent.

**A retry after a timeout can deliver twice.** SMTP cannot deduplicate, and
the transport ignores `idempotencyKey`: after a `MailFailure` from a
timeout, the server may already have the message. Retry only what you can
afford to send twice.

**Some recipients refused still throws, after the others got it.** The
server may accept one recipient and refuse another; the message then went out
to the accepted one. Retrying it whole sends it to them twice — send to one
recipient per `send` when every result must be all or nothing.

**An attachment is held in memory, whole, and grows a third on the way.**
nodemailer encodes it in base64 into the message it streams; a file of tens
of megabytes is refused by most servers (`552`, `MailRefused`) after it was
read. Send a signed link instead.

**A custom header cannot set an address.** `headers: { Bcc: '…' }` would add
an envelope recipient no check saw: `checkMessage` refuses `To`, `Cc`, `Bcc`,
`From`, `Sender`, `Reply-To`, `Return-Path`, `Subject`, `MIME-Version` and
`Content-*` in `headers`, in any case.

**A string address is only an address.** `'Acme <noreply@acme.test>'` as
`from` is a `TypeError` at wiring and a `MailRefused` on a message; write
`{ name: 'Acme', address: 'noreply@acme.test' }`. A string holding whitespace,
`,`, `;` or `:` is refused too, and nodemailer is handed every address as
`{ name, address }`, so it never parses one.

## Type safety, counted

**6 plausible mistakes, 6 refused** at compile time, each measured by a
`@ts-expect-error` in
[`test/types/refusals.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-smtp/test/types/refusals.ts)
that fails the typecheck the moment it stops holding:

1. No `transporter`.
2. nodemailer's options (`{ host, port }`) as the transporter, instead of what
   `createTransport` answers.
3. The SMTP options given to `createSmtpMailer` itself.
4. A default `from` without its `address`.
5. A `retries` option: the transport tries once.
6. `messageId` read as a `string`: it is `string | null`.

The same file holds the calls that must keep compiling — among them what
`nodemailer.createTransport` answers, from options or a URL, with no cast.

## Documentation

- [The guides](docs/README.md) — setting up nodemailer, the errors, testing.
- [Troubleshooting](docs/troubleshooting.md) — an error message, its cause and
  its fix.
- [Roadmap](docs/roadmap.md) — what is next, and what is deliberately not
  planned.
- [Vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md)
  — the words these pages use, defined once.

## Licence

MIT
