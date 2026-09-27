# Setting up

`createSmtpMailer` wraps a nodemailer transporter that **you** create: every
SMTP option — host, port, TLS, credentials, a pool, DKIM, timeouts — is
nodemailer's, and this package passes none of its own. What it adds is the
`Mailer` contract of `@nxgt/mail`: the same refusals as every transport, the
two errors, and no retry.

```ts
import nodemailer from 'nodemailer';
import { createSmtpMailer } from '@nxgt/mail-smtp';

export const mailer = createSmtpMailer({
	transporter: nodemailer.createTransport({
		host: 'smtp.example.com',
		port: 587, // STARTTLS; 465 with secure: true
		auth: { user: 'acme', pass: process.env.SMTP_PASSWORD },
	}),
	from: { name: 'Acme', address: 'noreply@acme.test' },
});
```

## The signature

```ts
function createSmtpMailer(options: SmtpMailerOptions): Mailer;

interface SmtpMailerOptions {
	readonly transporter: SmtpTransporter;
	readonly from?: Address;
}
```

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `transporter` | `SmtpTransporter` | required | Receives every message through `sendMail`. What `nodemailer.createTransport(…)` answers fits, with no cast |
| `from` | `Address` | none | The sender of a message that has no `from`. Without it, such a message is refused with `MailRefused` |

`SmtpTransporter` is the one method this package calls — so a test can pass a
hand-written object, and nodemailer is never imported:

```ts
interface SmtpTransporter {
	sendMail(mail: {
		from: { name: string; address: string };
		to: { name: string; address: string }[];
		replyTo?: { name: string; address: string };
		subject: string;
		html: string;
		text: string;
		headers?: Record<string, string>;
		attachments?: { filename: string; content: Buffer; contentType: string; cid?: string }[];
		disableFileAccess: boolean;
		disableUrlAccess: boolean;
	}): Promise<SmtpSentInfo>;
}

// What nodemailer resolves with. `rejected` and `rejectedErrors` are the
// recipients the server refused while it accepted others: `send` throws then.
interface SmtpSentInfo {
	readonly messageId?: string;
	readonly accepted?: readonly unknown[] | undefined;
	readonly rejected?: readonly unknown[] | undefined;
	readonly rejectedErrors?: readonly unknown[] | undefined;
}
```

Options are checked when the mailer is created, and a mistake is a bare
`TypeError` — see [Errors — wiring](errors.md#wiring--a-typeerror).

## The transporter

### From options, or from a URL

```ts
import nodemailer from 'nodemailer';
import { createSmtpMailer } from '@nxgt/mail-smtp';

// Port 465: TLS from the first byte.
const implicitTls = createSmtpMailer({
	transporter: nodemailer.createTransport({
		host: 'smtp.example.com',
		port: 465,
		secure: true,
		auth: { user: 'acme', pass: process.env.SMTP_PASSWORD },
	}),
	from: 'noreply@acme.test',
});

// A URL, as a hosting provider often gives it.
const fromUrl = createSmtpMailer({
	transporter: nodemailer.createTransport(process.env.SMTP_URL ?? 'smtp://localhost:1025'),
	from: 'noreply@acme.test',
});
```

### Timeouts

nodemailer waits up to two minutes for a connection and ten for a quiet
socket. A send awaited in a request handler should give up sooner:

```ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
	host: 'smtp.example.com',
	port: 587,
	auth: { user: 'acme', pass: process.env.SMTP_PASSWORD },
	connectionTimeout: 10_000,
	greetingTimeout: 10_000,
	socketTimeout: 20_000,
});
```

A timeout ends in `MailFailure`, nodemailer's `ETIMEDOUT` or `ESOCKET` error
as its `cause`.

### A pool

With `pool: true`, nodemailer keeps connections open and sends several messages
over each. Close it when the process stops, or the process waits for it:

```ts
import nodemailer from 'nodemailer';
import { createSmtpMailer } from '@nxgt/mail-smtp';

const transporter = nodemailer.createTransport({
	pool: true,
	maxConnections: 5,
	host: 'smtp.example.com',
	port: 587,
	auth: { user: 'acme', pass: process.env.SMTP_PASSWORD },
});
export const mailer = createSmtpMailer({ transporter, from: 'noreply@acme.test' });

process.on('SIGTERM', () => transporter.close());
```

## The sender

A message's own `from` wins; the default is used when it has none; with
neither, the send is refused with `MailRefused` before the transporter is
called:

```ts
import { createSmtpMailer, type SmtpTransporter } from '@nxgt/mail-smtp';

declare const transporter: SmtpTransporter;

const mailer = createSmtpMailer({ transporter, from: { name: 'Acme', address: 'noreply@acme.test' } });

await mailer.send({ to: 'ada@example.com', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' }); // from Acme
await mailer.send({
	to: 'ada@example.com',
	from: 'billing@acme.test', // this one wins
	subject: 'Your invoice',
	html: '<p>…</p>',
	text: '…',
});
```

A string is only an address: `'Acme <noreply@acme.test>'` is refused. Write
`{ name: 'Acme', address: 'noreply@acme.test' }`.

## What a message becomes

| `MailMessage` | Handed to nodemailer as |
| --- | --- |
| `to` — one address or several | `to`, always a list |
| a string address | `{ name: '', address }`: nodemailer never parses a string, so the address it sends to is the one `checkMessage` checked |
| an `{ name, address }` | the same object: nodemailer quotes and encodes the name, so `Doe, John` or `Ada <mallory@example.test>` stays one recipient's name |
| `from`, `replyTo` | `from`, `replyTo` |
| `subject`, `html`, `text` | the same, as strings — the e-mail is `multipart/alternative` |
| `headers` | `headers`, copied — `List-Unsubscribe` from [`listUnsubscribe`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md#one-click-unsubscribe) included, which your relay or nodemailer's `dkim` option must DKIM-sign |
| `idempotencyKey` | nothing: ignored — see [below](#the-idempotency-key) |
| `attachments`, each `{ filename, content, contentType }` | `attachments`, each `{ filename, content: Buffer, contentType }` — the bytes copied into a `Buffer`, never a `path` or an `href`; the e-mail is then `multipart/mixed`. Left out when the list is empty |
| an attachment's `contentId` | its `cid`: nodemailer writes the `Content-ID` header, marks the file `inline` and puts it in a `multipart/related` beside the HTML. Left out when the attachment has none |
| — | `disableFileAccess: true`, `disableUrlAccess: true`: a part or an attachment is never read from a file or fetched from a URL |

Before any of it, `checkMessage` from `@nxgt/mail` refuses what no transport
hands over — no recipient, something that is not an address, a line break in
the subject or a header, a custom header that would set an address, the
subject or the MIME structure (`Bcc`, `To`, `Content-Type`…). Its messages are listed in
[`@nxgt/mail`'s troubleshooting](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#sending).

`send` answers `{ messageId }`: nodemailer's `Message-ID` (`<…@acme.test>`), or
`null` when the transporter answers none — an absence, not a failure.

## The idempotency key

SMTP has no idempotency: a server takes every message it is handed, and
cannot tell a retry from a new e-mail. The transport therefore **ignores**
`idempotencyKey` — it neither refuses the message nor writes the key into it
— and a message sent twice is delivered twice:

```ts
const once = {
	to: 'ada@example.com',
	subject: 'Your receipt',
	html: '<p>Thank you for your order.</p>',
	text: 'Thank you for your order.',
	idempotencyKey: 'order-42/receipt', // still checked by checkMessage; not sent
};

await mailer.send(once);
await mailer.send(once); // a second e-mail
```

Setting the key is still worth it when the same code may run on a
transport that deduplicates, as `@nxgt/mail-resend`. Over SMTP, a retry
after a `MailFailure` from a timeout or a dropped connection may deliver
twice: the server may have taken the message before the connection ended.

**Relaying through Resend's SMTP server** (`smtp.resend.com`)? Resend reads
its own `Resend-Idempotency-Key` header there. The transport does not set it
from `idempotencyKey`; set it yourself among the headers, with the same
value:

```ts
const key = 'order-42/receipt';

await mailer.send({
	to: 'ada@example.com',
	subject: 'Your receipt',
	html: '<p>Thank you for your order.</p>',
	text: 'Thank you for your order.',
	idempotencyKey: key,
	headers: { 'Resend-Idempotency-Key': key }, // read by Resend's relay; any other server passes it on as a header
});
```

On any other server, that header travels with the e-mail to the recipient:
set it only when the relay is Resend's.

## Attachments

```ts
import { readFile } from 'node:fs/promises';
import nodemailer from 'nodemailer';
import { createSmtpMailer } from '@nxgt/mail-smtp';

const mailer = createSmtpMailer({
	transporter: nodemailer.createTransport(process.env.SMTP_URL ?? 'smtp://localhost:1025'),
	from: 'billing@acme.test',
});

await mailer.send({
	to: 'ada@example.com',
	subject: 'Your invoice',
	html: '<p>Your invoice is attached.</p>',
	text: 'Your invoice is attached.',
	attachments: [
		{ filename: 'facture n° 42.pdf', content: await readFile('/srv/invoices/42.pdf'), contentType: 'application/pdf' },
		{ filename: 'invoice.ics', content: new TextEncoder().encode('BEGIN:VCALENDAR…'), contentType: 'text/calendar' },
	],
});
```

- Each attachment is checked by `checkMessage` first: bytes as a
  `Uint8Array`, a file name not empty, not `.` or `..`, without `/`, `\`, a line break (U+2028 and U+2029 included), a control character or a format character such as a right-to-left override, a `type/subtype` that is not `multipart/*` or `message/*` (which
  nodemailer would write unencoded, as parts of the message) — see
  [`@nxgt/mail` — attachments](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md#attachments).
- The bytes are **copied** into a `Buffer` when `send` is called: changing
  your array while the message is on its way changes nothing.
- nodemailer writes each one as a base64 MIME part, the name encoded
  (RFC 2231) when it is not ASCII.
- nodemailer's `path`, `href`, `raw` and streams are never used, and
  `disableFileAccess` and `disableUrlAccess` stay on: an attachment is bytes
  your code already holds.

**Size.** The server caps the whole message after encoding — base64 makes a
file a third larger. Gmail's SMTP takes about 25 MB; other servers advertise
their limit in `EHLO` (`SIZE`), often 10 to 50 MB. Over it, the server
answers `552` once the message is sent, and `send` throws `MailRefused`:
[Errors](errors.md#which-smtp-answer-is-which). A large or sensitive file is a
signed, expiring link in the template instead, which never sits in an inbox.

## Inline images

An attachment with a `contentId` is an image the HTML shows as
`cid:<contentId>`. It is handed to nodemailer as its `cid`, which writes it
with a `Content-ID` header and `Content-Disposition: inline`, inside a
`multipart/related` beside the HTML part:

```ts
import { readFile } from 'node:fs/promises';
import nodemailer from 'nodemailer';
import { createSmtpMailer } from '@nxgt/mail-smtp';

const mailer = createSmtpMailer({
	transporter: nodemailer.createTransport(process.env.SMTP_URL ?? 'smtp://localhost:1025'),
	from: 'billing@acme.test',
});
const logo = await readFile('assets/logo.png'); // once, at start-up

await mailer.send({
	to: 'ada@example.com',
	subject: 'Your receipt',
	html: '<img src="cid:logo@acme.test" alt="Acme" width="120"><p>Thank you.</p>',
	text: 'Thank you.',
	attachments: [{ filename: 'logo.png', content: logo, contentType: 'image/png', contentId: 'logo@acme.test' }],
});
```

- `checkMessage` checks the id first — 1 to 127 letters, digits and `.` `_`
  `~` `+` `-` with at most one `@`, unique in the message — and refuses a
  `cid:` the HTML quotes as an attribute value that no attachment's
  `contentId` names: see
  [`@nxgt/mail` — inline images](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md#inline-images--cid).
- The id is passed without angle brackets; nodemailer adds them in the header.
- It is still an attachment: bytes only, counted in the message's size.

## With the renderer

What `@nxgt/mail/renderer` answers spreads into the message:

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';
import nodemailer from 'nodemailer';
import { createSmtpMailer } from '@nxgt/mail-smtp';

const mails = createMailRenderer({ dir: 'dist' });
const mailer = createSmtpMailer({
	transporter: nodemailer.createTransport(process.env.SMTP_URL ?? 'smtp://localhost:1025'),
	from: 'noreply@acme.test',
});

await mailer.send({
	to: 'ada@example.com',
	...mails.render('verify-email', { name: 'Ada', link: 'https://app.example.com/verify?token=abc' }, { locale: 'fr' }),
});
```

## See also

- [Errors](errors.md) — what `send` throws, and when.
- [Testing](testing.md) — a local SMTP server, and the conformance suite.
