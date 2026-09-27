# Errors

`send` resolves only once the SMTP server has accepted the message. Otherwise
it rejects with one of the two classes of its `@nxgt/mail` peer — this package
defines no error class, so `error instanceof MailFailure` holds whichever
transport the application wires:

- **`MailRefused`** (`code: 'MAIL_REFUSED'`) — the message itself was
  refused. Sending it again unchanged fails again.
- **`MailFailure`** (`code: 'MAIL_FAILED'`) — the server could not take it:
  unreachable, busy, or the credentials refused. Nothing was sent; a later
  attempt may work.

Nothing is retried. Whether and when to retry is yours to decide, where you
can see it.

```ts
import { MailError, type MailErrorCode, type Mailer, type MailMessage } from '@nxgt/mail';

function statusOf(code: MailErrorCode): number {
	switch (code) {
		case 'MAIL_FAILED':
			return 503;
		case 'MAIL_REFUSED':
			return 422;
	}
}

export async function sendOrRespond(mailer: Mailer, message: MailMessage): Promise<Response> {
	try {
		await mailer.send(message);
		return new Response(null, { status: 202 });
	} catch (error) {
		if (!(error instanceof MailError)) throw error;
		return Response.json({ code: error.code }, { status: statusOf(error.code) });
	}
}
```

## Which SMTP answer is which

nodemailer rejects with an error carrying a `code` (`ECONNECTION`, `ESOCKET`,
`ETIMEDOUT`, `EAUTH`, `EENVELOPE`, `EMESSAGE`…) and, when the server answered,
a `responseCode`. The transport reads both:

| What happened | nodemailer's error | Throws |
| --- | --- | --- |
| The server cannot be reached, the connection drops, a timeout | `ECONNECTION`, `ESOCKET`, `ETIMEDOUT` | `MailFailure` |
| The server closes the door (`421`), is busy or refuses for now (`4xx`) | any, with a `4xx` | `MailFailure` |
| Credentials refused (`535`), authentication required (`530`) | `EAUTH`, or `EENVELOPE` with `530`–`539` | `MailFailure` |
| A recipient refused for good (`550`, `553`) | `EENVELOPE` with a `5xx` | `MailRefused` |
| The content refused for good (`552` too large, `554` rejected) | `EMESSAGE` with a `5xx` | `MailRefused` |
| Anything else | — | `MailFailure` |

Authentication is a failure although it is a `5xx`: the next message would be
refused the same way, whatever it holds. It is the wiring that is wrong, not
the message.

## What `cause` holds

The error is nodemailer's, untouched: read `code`, `responseCode`, `command`
and `response` from it to log what the server said.

```ts
import { MailError } from '@nxgt/mail';

try {
	await mailer.send(message);
} catch (error) {
	if (error instanceof MailError) {
		const cause = error.cause as { code?: string; responseCode?: number };
		logger.warn({ code: error.code, smtp: cause.code, reply: cause.responseCode }, error.message);
	}
	throw error;
}
```

An error's `message` reports a shape, never a value: it never holds an
address, a subject, a password or the server's reply. `cause` is nodemailer's
error, and **its** message can quote the server, which can quote an address —
log `cause.code` and `cause.responseCode` rather than the whole error when
your logs must not hold one.

## The messages

| `message` | Class | When |
| --- | --- | --- |
| `send: the SMTP server could not take the message` | `MailFailure` | Every failure in the table above |
| `send: the SMTP server refused the message` | `MailRefused` | A permanent `5xx` on a recipient or on the content |
| `send: from is missing — give the message a from, or createSmtpMailer a default one` | `MailRefused` | A message without `from`, on a mailer without a default. The transporter is not called |
| `send: …` from `checkMessage` | `MailRefused` | A message no transport hands over — see [`@nxgt/mail`'s troubleshooting](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#sending) |

## Wiring — a `TypeError`

A bad option is a mistake in how the application was put together, thrown
when `createSmtpMailer` is called, never at the first send:

| `message` | When |
| --- | --- |
| `createSmtpMailer: options must be an object, as { transporter }` | `createSmtpMailer()` or `createSmtpMailer(transporter)` |
| `createSmtpMailer: transporter must be what nodemailer.createTransport(…) answers` | No `transporter`, or one without `sendMail` — nodemailer's options passed instead of the transporter |
| `createSmtpMailer: from must be an e-mail address, as noreply@example.com or { name, address }` | A default `from` that is not an address — `'Acme <noreply@acme.test>'` included |

## See also

- [Troubleshooting](../troubleshooting.md) — each message, its cause and its
  fix.
- [`@nxgt/mail` — sending](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md)
  — the errors, from the caller's side.
