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

> **Not published yet.** The package is `private` while the rest of the
> repository — a starter — is written. It is published at `0.1.0` with the
> other packages; the surface below is the one that will ship.

## Install

```sh
bun add @nxgt/mail-smtp @nxgt/mail nodemailer
```

Peers, all required:

- `@nxgt/mail` — the port and the errors. One copy in your tree, so
  `error instanceof MailFailure` holds.
- `nodemailer` (`>=7 <11`; tested with 10). This package never imports it:
  you create the transporter, with every SMTP option nodemailer has.
- `typescript` (6). Bundler resolution (`"moduleResolution": "bundler"`) is
  what is supported and tested; `nodenext` is out of contract.

## Exports

| Export | What it is |
| --- | --- |
| `createSmtpMailer(options)` | A `Mailer` that hands each message to your nodemailer transporter |
| `SmtpMailerOptions` | `{ transporter, from? }` |
| `SmtpTransporter` | The part of a nodemailer transporter it calls: `sendMail` |

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
	headers: { 'List-Unsubscribe': '<https://acme.test/unsubscribe>' },
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
- The parts are strings: nodemailer is told never to read a file or a URL
  (`disableFileAccess`, `disableUrlAccess`).

### Errors — a refusal or a failure

| When | Throws | `cause` |
| --- | --- | --- |
| The server cannot be reached, a timeout, a `4xx` (try later), credentials refused (`530`–`539`) | `MailFailure` — `send: the SMTP server could not take the message` | nodemailer's error, with its `code` and `responseCode` |
| A permanent `5xx` on a recipient or on the content (`550`, `552`, `554`) | `MailRefused` — `send: the SMTP server refused the message` | nodemailer's error |
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
		// nothing was sent: retry later, from a queue you can see
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

## Traps

**Close a pooled transporter when the process stops.** With `pool: true`,
nodemailer keeps connections open: call `transporter.close()` on shutdown.

**nodemailer's timeouts are yours to set.** It waits up to two minutes for a
connection by default; a send in a request handler should not. Set
`connectionTimeout`, `greetingTimeout` and `socketTimeout` on the transporter.
A timeout ends in `MailFailure`.

**A `4xx` is a failure, a `5xx` a refusal** — except authentication (`530`–
`539`): the next message would be refused the same way, so it is a failure
of the wiring, not of the message.

**A string address is only an address.** `'Acme <noreply@acme.test>'` as
`from` is a `TypeError` at wiring and a `MailRefused` on a message; write
`{ name: 'Acme', address: 'noreply@acme.test' }`.

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
