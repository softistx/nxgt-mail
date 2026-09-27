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
- [`send: the SMTP server refused <n> of <total> recipients, and may have delivered to the others`](#send-the-smtp-server-refused-n-of-total-recipients-and-may-have-delivered-to-the-others)
- [`send: the SMTP server could not take <n> of <total> recipients, and may have delivered to the others`](#send-the-smtp-server-could-not-take-n-of-total-recipients-and-may-have-delivered-to-the-others)
- [`send: from is missing — give the message a from, or createSmtpMailer a default one`](#send-from-is-missing--give-the-message-a-from-or-createsmtpmailer-a-default-one)
- [`send: scheduledAt is not supported — SMTP has no way to schedule a send, and sending it now would be wrong`](#send-scheduledat-is-not-supported--smtp-has-no-way-to-schedule-a-send-and-sending-it-now-would-be-wrong)

**Wiring**
- [`createSmtpMailer: options must be an object, as { transporter }`](#createsmtpmailer-options-must-be-an-object-as--transporter-)
- [`createSmtpMailer: transporter must be what nodemailer.createTransport(…) answers`](#createsmtpmailer-transporter-must-be-what-nodemailercreatetransport-answers)
- [`createSmtpMailer: from must be an e-mail address, as noreply@example.com or { name, address }`](#createsmtpmailer-from-must-be-an-e-mail-address-as-noreplyexamplecom-or--name-address-)

**Install and types**
- [`error instanceof MailFailure` is `false`](#error-instanceof-mailfailure-is-false)
- [`TS2322: Type 'string | null' is not assignable to type 'string'.`](#ts2322-type-string--null-is-not-assignable-to-type-string)

## Sending

### `send: the SMTP server could not take the message`

A `MailFailure`, code `MAIL_FAILED`. **Nothing is known to have been sent**:
after a timeout or a connection dropped once the message was on its way, the
server may have taken it all the same.

**When:** nodemailer could not hand the message over — the server cannot be
reached, the connection dropped or timed out, the server answered a `4xx`
(busy, try later, `421` closing), refused the credentials (`535`, `530`) or
the sender (`550` on `MAIL FROM`: `cause.command` is `'MAIL FROM'`), or
refused every recipient with at least one refusal for now (`450`).

**Why:** none of these is about the message: the same message may go through
later, or once the credentials or the sender are fixed.

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
		// 5xx with command 'MAIL FROM': the server refuses this sender — check from
		// 4xx: the server is busy or rate-limiting — try later
		console.warn(code, responseCode);
	}
	throw error;
}
```

A retry is yours to decide — from a queue, with a delay. The transport never
retries in secret.

An `idempotencyKey` does not make that retry safe here: SMTP has no
idempotency, and this transport ignores the key. If the first attempt went
through after all, the retry delivers a second copy — weigh that before
retrying after a timeout.

### `send: the SMTP server refused the message`

A `MailRefused`, code `MAIL_REFUSED`.

**When:** the server answered a permanent `5xx` to every recipient (`550` no
such mailbox, `553` address not allowed) or to the content (`552` too large,
`554` rejected — as spam, for example).

**Why:** the server will refuse the same message again; retrying it
unchanged is pointless.

**Fix:** read `cause.responseCode` and `cause.response` to see which — with
every recipient refused, `cause.rejectedErrors` holds one error per
recipient; correct the address or the content. A recipient that does not
exist is usually worth telling the user about.

A `552` on a message with attachments is the server's size limit — the
whole message, after base64 has made each file a third larger. Sending it
again fails again: send the file as a signed link in the template instead.

```ts
import { MailRefused } from '@nxgt/mail';

try {
	await mailer.send(message);
} catch (error) {
	const cause = error instanceof MailRefused ? (error.cause as { responseCode?: number }) : null;
	if (cause?.responseCode === 552 && message.attachments?.length) {
		// too large: resend with a link to the file rather than the file
	}
	throw error;
}
```

### `send: the SMTP server refused <n> of <total> recipients, and may have delivered to the others`

A `MailRefused`, code `MAIL_REFUSED`. **The accepted recipients may already
have the message.**

**When:** a message to several recipients: the server refused `<n>` of them
for good (`550`, `553`) and accepted the others. nodemailer resolves then;
the transport throws, since the send did not reach everyone it named.

**Why:** a refused recipient is refused again; the accepted ones were handed
the message.

**Fix:** do not retry the message whole — it would reach the accepted
recipients twice. `cause` is nodemailer's error for the first refused
recipient: its `responseCode`, and `recipient`.

```ts
import { MailRefused } from '@nxgt/mail';

declare function markUndeliverable(recipient: string | undefined, responseCode: number | undefined): Promise<void>;

try {
	await mailer.send(message);
} catch (error) {
	if (error instanceof MailRefused && error.message.includes('may have delivered to the others')) {
		const { recipient, responseCode } = error.cause as { recipient?: string; responseCode?: number };
		// Mark `recipient` as undeliverable, and do not send again to the others.
		await markUndeliverable(recipient, responseCode);
	}
	throw error;
}
```

Sending to one recipient per `send` makes every result all or nothing.

### `send: the SMTP server could not take <n> of <total> recipients, and may have delivered to the others`

A `MailFailure`, code `MAIL_FAILED`. **The accepted recipients may already
have the message.**

**When:** a message to several recipients: the server accepted some, and
refused `<n>` with one refusal at least for now (a `4xx`, `450` mailbox
busy) or for a reason that is not the message (`530`–`539`), or nodemailer
reported the refusals without a reason.

**Why:** the refused recipients may be reachable later; the accepted ones
were handed the message.

**Fix:** retry for the refused recipients only, later — never the message
whole. `cause` is nodemailer's error for the first refused recipient.
Sending to one recipient per `send` makes every result all or nothing.

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

### `send: scheduledAt is not supported — SMTP has no way to schedule a send, and sending it now would be wrong`

A `MailRefused`, thrown before the transporter is called.

**When:** the message carries `scheduledAt`.

**Why:** SMTP takes the message the moment it is handed over — there is no
field, no header and no later step that delays it. Sending it now instead of
refusing it would silently do the opposite of what `scheduledAt` asked for.

**Fix:** schedule through a transport that supports it, `@nxgt/mail-resend`;
or hold the e-mail yourself — a job scheduled for that moment — and send it
through SMTP, with no `scheduledAt`, when the moment comes:

```ts
declare const sendAt: Date;
declare function scheduleJob(at: Date, run: () => Promise<void>): void;

scheduleJob(sendAt, () => mailer.send({ ...message /* no scheduledAt */ }));
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
