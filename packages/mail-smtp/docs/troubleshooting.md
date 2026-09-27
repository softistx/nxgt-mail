# Troubleshooting `@nxgt/mail-smtp`

Each entry is headed by the message you see. Search this page for the words of
your message.

How the messages are shaped:

- **A message names where the problem is, never the value.** No address, no
  subject, no password, no server reply: what the server said is on the
  error's `cause`, nodemailer's error untouched.
- **Every message starts with the call you wrote**: `send: …` or
  `createSmtpMailer: …`.
- **A `TypeError` is a wiring mistake**, thrown by `createSmtpMailer` when the
  application starts. Fix the code; no handler should answer one.
- **A `MailError` is a refusal at call time**: a `MailFailure`
  (`MAIL_FAILED`) or a `MailRefused` (`MAIL_REFUSED`), the classes of the
  `@nxgt/mail` peer.

A `send: …` message not on this page comes from `checkMessage` in
`@nxgt/mail` — a message no transport hands over. See
[its troubleshooting](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#sending).

## Index

**Sending**
- [`send: the SMTP server could not take the message`](#send-the-smtp-server-could-not-take-the-message)
- [`send: the SMTP server refused the message`](#send-the-smtp-server-refused-the-message)
- [`send: from is missing — give the message a from, or createSmtpMailer a default one`](#send-from-is-missing--give-the-message-a-from-or-createsmtpmailer-a-default-one)

**Wiring**
- [`createSmtpMailer: options must be an object, as { transporter }`](#createsmtpmailer-options-must-be-an-object-as--transporter-)
- [`createSmtpMailer: transporter must be what nodemailer.createTransport(…) answers`](#createsmtpmailer-transporter-must-be-what-nodemailercreatetransport-answers)
- [`createSmtpMailer: from must be an e-mail address, as noreply@example.com or { name, address }`](#createsmtpmailer-from-must-be-an-e-mail-address-as-noreplyexamplecom-or--name-address-)

**Install and types**
- [`error instanceof MailFailure` is `false`](#error-instanceof-mailfailure-is-false)
- [`TS2322: Type 'string | null' is not assignable to type 'string'.`](#ts2322-type-string--null-is-not-assignable-to-type-string)

## Sending

### `send: the SMTP server could not take the message`

A `MailFailure`, code `MAIL_FAILED`. **Nothing was sent.**

**When:** nodemailer could not hand the message over — the server cannot be
reached, the connection dropped or timed out, the server answered a `4xx`
(busy, try later, `421` closing), or refused the credentials (`535`, `530`).

**Why:** none of these is about the message: the same message may go through
later, or once the credentials are fixed.

**Fix:** read `cause` — nodemailer's error:

```ts
import { MailFailure } from '@nxgt/mail';

try {
	await mailer.send(message);
} catch (error) {
	if (error instanceof MailFailure) {
		const { code, responseCode } = error.cause as { code?: string; responseCode?: number };
		// ECONNECTION / ESOCKET: host or port wrong, or the server is down
		// ETIMEDOUT: the server is slow, or a firewall drops the connection
		// EAUTH, 535: user or password wrong; 530: the server wants credentials
		// 4xx: the server is busy or rate-limiting — try later
		console.warn(code, responseCode);
	}
	throw error;
}
```

A retry is yours to decide — from a queue, with a delay. The transport never
retries in secret.

### `send: the SMTP server refused the message`

A `MailRefused`, code `MAIL_REFUSED`.

**When:** the server answered a permanent `5xx` to a recipient (`550` no such
mailbox, `553` address not allowed) or to the content (`552` too large, `554`
rejected — as spam, for example).

**Why:** the server will refuse the same message again; retrying it
unchanged is pointless.

**Fix:** read `cause.responseCode` and `cause.response` to see which; correct
the address or the content. A recipient that does not exist is usually worth
telling the user about.

### `send: from is missing — give the message a from, or createSmtpMailer a default one`

A `MailRefused`, thrown before the transporter is called.

**When:** the message has no `from`, and the mailer was created without one.

**Fix:** give the mailer a default sender, or the message its own:

```ts
import nodemailer from 'nodemailer';
import { createSmtpMailer } from '@nxgt/mail-smtp';

const mailer = createSmtpMailer({
	transporter: nodemailer.createTransport(process.env.SMTP_URL ?? 'smtp://localhost:1025'),
	from: { name: 'Acme', address: 'noreply@acme.test' },
});
```

## Wiring

### `createSmtpMailer: options must be an object, as { transporter }`

A `TypeError`. `createSmtpMailer` was called with nothing, or with the
transporter itself.

```ts
createSmtpMailer(transporter); // ✗
createSmtpMailer({ transporter }); // ✓
```

### `createSmtpMailer: transporter must be what nodemailer.createTransport(…) answers`

A `TypeError`. `transporter` is missing, or has no `sendMail` — nodemailer's
options were passed where its transporter belongs.

```ts
import nodemailer from 'nodemailer';
import { createSmtpMailer } from '@nxgt/mail-smtp';

// ✗ createSmtpMailer({ transporter: { host: 'smtp.example.com', port: 587 } })
createSmtpMailer({ transporter: nodemailer.createTransport({ host: 'smtp.example.com', port: 587 }) }); // ✓
```

### `createSmtpMailer: from must be an e-mail address, as noreply@example.com or { name, address }`

A `TypeError`. The default `from` is not an address. Most often, a name
written inside the string:

```ts
createSmtpMailer({ transporter, from: 'Acme <noreply@acme.test>' }); // ✗
createSmtpMailer({ transporter, from: { name: 'Acme', address: 'noreply@acme.test' } }); // ✓
```

A string is only an address: the transport never parses one, so a name can
never smuggle a second address into a header.

## Install and types

### `error instanceof MailFailure` is `false`

Two copies of `@nxgt/mail` are installed, and the transport throws the other
one's class. `@nxgt/mail` is a **peer** of this package: list it in your own
`package.json`, in a range this package accepts, and install again. `bun pm ls
@nxgt/mail` (or `npm ls @nxgt/mail`) should show one version.

### `TS2322: Type 'string | null' is not assignable to type 'string'.`

`messageId` is `string | null`: nodemailer may give no id, and an absence is
`null`. Decide what an absent id means where you read it:

```ts
const { messageId } = await mailer.send(message);
const reference = messageId ?? 'none';
```
