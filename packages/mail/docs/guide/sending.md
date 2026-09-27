# Sending

This page is for calling `mailer.send`: the shape of what it takes, the
addresses, headers and attachments it accepts, one-click unsubscribe, the
idempotency key that makes a retry safe, what it answers, and what it throws.

```ts
import { createMemoryMailer } from '@nxgt/mail';

const mailer = createMemoryMailer(); // in production, a transport's mailer

const sent = await mailer.send({
	to: 'ada@example.com',
	from: { name: 'Example', address: 'noreply@example.com' },
	subject: 'Your password was changed',
	html: '<p>Your password was changed.</p>',
	text: 'Your password was changed.',
});

sent.messageId; // 'memory-1'
```

## The port

```ts
interface Mailer {
	send(message: MailMessage): Promise<SentMail>;
}

interface SentMail {
	readonly messageId: string | null;
}
```

`send` resolves **only once the transport has handed the e-mail over** to its
provider. `messageId` is the id the provider gave it, or `null` when it gives
none — an absence, not a failure. It is not a promise the e-mail reached an
inbox: a bounce happens after the hand-over, and `send` does not report it.

Anything else rejects, with one of the two errors below. A mailer never
resolves `false` and never logs and resolves.

Depend on `Mailer`, not on a transport, so a test can pass the memory mailer
where production passes SMTP:

```ts
import type { Mailer } from '@nxgt/mail';

export class Accounts {
	constructor(private readonly mailer: Mailer) {}

	async passwordChanged(user: { email: string }): Promise<void> {
		await this.mailer.send({
			to: user.email,
			subject: 'Your password was changed',
			html: '<p>Your password was changed.</p>',
			text: 'Your password was changed.',
		});
	}
}
```

## The message

```ts
interface Rendered {
	readonly subject: string;
	readonly html: string;
	readonly text: string;
}

interface MailMessage extends Rendered {
	readonly to: Address | readonly Address[];
	readonly from?: Address;
	readonly replyTo?: Address;
	readonly headers?: Readonly<Record<string, string>>;
	readonly attachments?: readonly MailAttachment[];
	readonly idempotencyKey?: string;
}

interface MailAttachment {
	readonly filename: string;
	readonly content: Uint8Array;
	readonly contentType: string;
}
```

| Field | Type | Required | Effect |
| --- | --- | --- | --- |
| `subject` | `string` | yes | The subject line. No line break: a line break in a subject is a header injection |
| `html` | `string` | yes | The HTML part, sent as is — escaping is the renderer's job |
| `text` | `string` | yes | The plain-text part. Every e-mail has one |
| `to` | `Address \| readonly Address[]` | yes | One recipient or several, at least one |
| `from` | `Address` | no | The sender. `checkMessage` does not require one: a transport is usually wired with a default sender, and one without a default may refuse a message without `from` — see its documentation |
| `replyTo` | `Address` | no | Where replies go |
| `headers` | `Record<string, string>` | no | Extra headers, such as `X-Entity-Ref-ID`, or the two of [one-click unsubscribe](#one-click-unsubscribe) |
| `attachments` | `readonly MailAttachment[]` | no | Files sent with the e-mail, in order, as bytes — see [Attachments](#attachments). An empty list is the same as none |
| `idempotencyKey` | `string` | no | Names this send, so sending it again delivers it once where the transport can deduplicate — see [Idempotency](#idempotency--sending-once). 1 to 256 visible ASCII characters |

`Rendered` is what the renderer answers — `mails.render('verify-email', { name, link })`
fills the values only known at send time into a built Maizzle template — and a
rendered e-mail is spread into the message and addressed:

```ts
import { type Mailer } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' });

export async function sendVerification(mailer: Mailer, to: string, name: string, link: string): Promise<void> {
	await mailer.send({ to, ...mails.render('verify-email', { name, link }) });
}
```

See [Rendering](rendering.md). Any function answering the same shape fits too:

```ts
import type { Mailer, Rendered } from '@nxgt/mail';

// Hand-written: any function answering Rendered is accepted.
function welcome(): Rendered {
	return {
		subject: 'Welcome aboard',
		html: '<p>Welcome aboard.</p>',
		text: 'Welcome aboard.',
	};
}

export async function sendWelcome(mailer: Mailer, email: string): Promise<void> {
	await mailer.send({ ...welcome(), to: email });
}
```

Escaping is the renderer's job: `createMailRenderer` HTML-escapes every value
it fills into `html` ([Rendering — escaping](rendering.md#escaping)). A
hand-written function that interpolates a value must escape it in `html`
itself.

## Addresses

```ts
type Address = string | { readonly name: string; readonly address: string };
```

A string is **only** an address. A display name goes in the object form, so a
transport never parses one — and a string a parser would read as more than
one mailbox is refused. A name is free text — `Doe, John` is a name — and
is refused only when it holds a line break; quoting or encoding it in a header
is the transport's job, which the conformance suite checks:

```ts
import type { MailMessage, Rendered } from '@nxgt/mail';

declare const rendered: Rendered;

const message: MailMessage = {
	...rendered,
	to: ['ada@example.com', { name: 'Grace Hopper', address: 'grace@example.com' }],
	from: { name: 'Example', address: 'noreply@example.com' },
	replyTo: 'support@example.com',
};
```

What is checked is deliberately loose: one `@`, something on each side, and
none of what an address list reads as structure — no whitespace, no angle
bracket, no `,` or `;` (a second address), no `:` (a group). Whether the
mailbox exists is the receiving server's question.

| Written | Answer |
| --- | --- |
| `'ada@example.com'` | accepted |
| `{ name: 'Ada', address: 'ada@example.com' }` | accepted |
| `'Ada <ada@example.com>'` | `MailRefused`: `send: to is not an e-mail address` |
| `'root,ada@example.com'` | `MailRefused`: `send: to is not an e-mail address` — a provider parsing it would send to `ada` alone, or to two mailboxes |
| `{ name: 'Doe, John', address: 'john@example.com' }` | accepted: a name is free text |
| no `to`, or `to: []` | `MailRefused`: `send: to must hold at least one address` |
| `to: [undefined]` | `MailRefused`: `send: to[0] is not an e-mail address` |
| `{ name: 'A\r\nBcc: x@y.z', address: 'a@b.c' }` in `from` | `MailRefused`: `send: from.name must be a string without a line break` |
| `{ name: 'Ada' }` | a compile error: `address` is required |

`addressOf(address)` answers the bare address of either form, and
`recipientsOf(message)` every recipient's, in order — mostly useful to a
transport:

```ts
import { addressOf, recipientsOf } from '@nxgt/mail';

addressOf({ name: 'Ada', address: 'ada@example.com' }); // 'ada@example.com'
recipientsOf({
	to: ['a@example.com', { name: 'B', address: 'b@example.com' }],
	subject: 's',
	html: 'h',
	text: 't',
}); // ['a@example.com', 'b@example.com']
```

## Headers

A header name is letters, digits and hyphens; neither a name nor a value may
hold a line break. What the transport writes from the message — the
addresses, the subject, the MIME structure — cannot be set here: `To`, `Cc`,
`Bcc`, `From`, `Sender`, `Reply-To`, `Return-Path`, `Subject`,
`MIME-Version` and any `Content-*` are refused, in any case. A `Bcc` among
the headers would reach an SMTP envelope as a recipient no check saw:

```ts
import type { MailMessage, Rendered } from '@nxgt/mail';

declare const rendered: Rendered;

const message: MailMessage = {
	...rendered,
	to: 'ada@example.com',
	headers: { 'X-Entity-Ref-ID': 'welcome-42' },
};
```

`List-Unsubscribe` and `List-Unsubscribe-Post` are headers like any other,
but write them with [`listUnsubscribe`](#one-click-unsubscribe), which checks
the URL.

| Written | Answer |
| --- | --- |
| `{ 'X Bad': 'v' }` | `MailRefused`: `send: a header name must be letters, digits and hyphens` |
| `{ 'X-Ref': 'a\r\nb' }` | `MailRefused`: `send: header X-Ref must be a string without a line break` |
| `{ Bcc: 'eve@example.com' }` | `MailRefused`: `send: header Bcc is reserved — addresses, the subject and the MIME structure are never custom headers` |
| `{ 'content-type': 'text/plain' }` | `MailRefused`: `send: header content-type is reserved — …` |

## One-click unsubscribe

`listUnsubscribe` answers the two headers that give an e-mail the
"Unsubscribe" button Gmail and Yahoo show next to the sender (RFC 8058, with
RFC 2369's `List-Unsubscribe`), to spread into `headers`:

```ts
import { listUnsubscribe } from '@nxgt/mail';

listUnsubscribe({ url: 'https://example.com/unsubscribe?token=s3cr3t' });
// {
//   'List-Unsubscribe': '<https://example.com/unsubscribe?token=s3cr3t>',
//   'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
// }

listUnsubscribe({ url: 'https://example.com/unsubscribe?token=s3cr3t', mailto: 'unsubscribe@example.com' });
// 'List-Unsubscribe': '<https://example.com/unsubscribe?token=s3cr3t>, <mailto:unsubscribe@example.com>'
```

```ts
interface ListUnsubscribeOptions {
	readonly url: string;
	readonly mailto?: string;
}

interface ListUnsubscribeHeaders {
	readonly 'List-Unsubscribe': string;
	readonly 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click';
}

function listUnsubscribe(options: ListUnsubscribeOptions): ListUnsubscribeHeaders;
```

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `url` | `string` | required | The `https:` URL a mail client POSTs `List-Unsubscribe=One-Click` to. One per recipient, carrying what identifies them — `https://example.com/unsubscribe?token=…`. Written first in `List-Unsubscribe` |
| `mailto` | `string` | none | A bare address that unsubscribes whoever writes to it, for clients that only send mail. Written after the URL as `<mailto:…>` |

The headers travel as any other: `checkMessage` accepts them, and every
transport sends them unchanged. Spread them into `headers` — alone, as
`headers: { ...listUnsubscribe({ url }) }`, or beside headers of your own:

```ts
import { listUnsubscribe, type MailMessage, type Rendered } from '@nxgt/mail';

declare const rendered: Rendered;
declare const token: string;

const message: MailMessage = {
	...rendered,
	to: 'ada@example.com',
	headers: {
		...listUnsubscribe({ url: `https://example.com/unsubscribe?token=${encodeURIComponent(token)}` }),
		'X-Entity-Ref-ID': 'newsletter-2026-09',
	},
};
```

### What Gmail and Yahoo require

Since 2024, a sender of bulk mail to Gmail or Yahoo addresses must, on
marketing and subscribed mail:

- carry **both** headers, `List-Unsubscribe` with an `https:` URL and
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click`;
- have them covered by a **DKIM signature** of the sending domain, so nobody
  can add or change them on the way;
- honour the unsubscribe promptly — within two days.

The DKIM signature is the sender's, not this package's: `listUnsubscribe`
writes the headers, and whatever signs the message must include them.

| Transport | Who signs |
| --- | --- |
| `@nxgt/mail-resend` | Resend, with the DKIM key of your verified domain — the custom headers included |
| `@nxgt/mail-smtp` | Your relay, or nodemailer's own `dkim` option on the transporter you create. A relay that does not DKIM-sign leaves the headers unsigned, and the message fails the requirement |

### Which e-mails carry it

**Marketing and bulk mail** — a newsletter, a digest, a product announcement,
anything the recipient subscribed to and can stop receiving.

**Not transactional mail** — a password reset, a sign-in code, an e-mail
verification, a receipt, a security alert. The recipient cannot opt out of
those, and an "Unsubscribe" button next to a sign-in code invites them to
try. Leave `headers` without it.

### The endpoint

The URL is yours. It must:

- **unsubscribe on a `POST`** whose form body is `List-Unsubscribe=One-Click`
  — sent as `application/x-www-form-urlencoded` or `multipart/form-data`,
  which `request.formData()` both reads;
- do it **with no login, no confirmation page and no redirect**, from the
  URL alone — the mail client sends no cookie, so the endpoint takes no CSRF
  token either — and answer **2xx**;
- on a **`GET`** — the same URL in the body of the e-mail, clicked by a
  person — **show a page, never unsubscribe**: link scanners and previews
  fetch every URL in an e-mail. The page's button can post the same form.

```ts
// Yours: the token store.
declare function unsubscribeByToken(token: string): Promise<boolean>; // false: unknown token

export async function unsubscribeHandler(request: Request): Promise<Response> {
	const token = new URL(request.url).searchParams.get('token') ?? '';

	if (request.method === 'POST') {
		const form = await request.formData();
		if (form.get('List-Unsubscribe') !== 'One-Click') return new Response(null, { status: 400 });
		await unsubscribeByToken(token); // an unknown token answers 200 too: nothing to tell a mail client
		return new Response(null, { status: 200 });
	}

	// GET: a person followed the link in the e-mail. Show, do not act.
	const page = `<!doctype html><title>Unsubscribe</title>
<form method="post"><input type="hidden" name="List-Unsubscribe" value="One-Click">
<button>Unsubscribe</button></form>`;
	return new Response(page, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
```

The form posts to its own URL, token included, so the page and the mail
client take the same path. In a framework, mount it at the URL you pass:
with Hono, `app.on(['GET', 'POST'], '/unsubscribe', (c) => unsubscribeHandler(c.req.raw))`.

### The token is a credential

Anyone holding the URL can unsubscribe that recipient. Make the token
unguessable (random, or signed), keep it valid for as long as the e-mail may
be read, and **never log it** — nor the URL that carries it, nor the query
string of the endpoint's access log. `listUnsubscribe` does its part: a
refused `url` is reported by the rule it broke, never quoted.

### Commas must be percent-encoded

`List-Unsubscribe` is a comma-separated list of URLs: a raw `,` in the URL
would start a second one, so it is refused. `encodeURIComponent` and
`URLSearchParams` both write `%2C`; a URL built with `URL` is passed as
`url.href` — a `URL` object is a compile error:

```ts
import { listUnsubscribe } from '@nxgt/mail';

declare const token: string;

const url = new URL('https://example.com/unsubscribe');
url.searchParams.set('token', token);
url.searchParams.set('lists', 'news,offers'); // written lists=news%2Coffers

listUnsubscribe({ url: url.href });
```

### Refusals

The URL and the address are checked when the headers are built, before
anything is sent. A `MailRefused` names the rule, never the value:

| Written | Answer |
| --- | --- |
| `url: 'https://example.com/u?token=…'`, `'https://example.com:8443/u?list=a%2Cb'` | accepted |
| `url: 'http://example.com/u'`, `'mailto:u@example.com'`, `'/unsubscribe'`, `''` | `MailRefused`: `listUnsubscribe: url must be an https: URL without whitespace, <, > or a raw comma` |
| a `url` holding a space, a tab, a line break, `<`, `>` or a raw `,` | `MailRefused`: the same message |
| `mailto: 'Unsub <u@example.com>'`, `'u@example.com, v@example.com'`, `'unsubscribe'`, `'mailto:u@example.com'` | `MailRefused`: `listUnsubscribe: mailto must be a bare e-mail address, as unsubscribe@example.com` |
| `listUnsubscribe(null)` | `TypeError`: `listUnsubscribe: options must be an object, as { url }` |
| `url: new URL(…)` | a compile error; at run time `TypeError`: `listUnsubscribe: url must be a string` |
| `mailto: 42` | a compile error; at run time `TypeError`: `listUnsubscribe: mailto must be a string` |

A `TypeError` is a mistake in the code, not in the data: no request handler
should answer one. A `MailRefused` usually means a URL built from a value that
was not encoded — keep the call inside the `try` that handles `MailError`.

### A realistic case — a newsletter, one URL per subscriber

```ts
import { listUnsubscribe, MailError, type Mailer } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';

// Yours: the subscriber store.
declare function subscribersOf(list: string): AsyncIterable<{ id: string; email: string; name: string; token: string }>;

const mails = createMailRenderer({ dir: 'dist' });

export async function sendIssue(mailer: Mailer, issue: string): Promise<{ sent: number; failed: string[] }> {
	let sent = 0;
	const failed: string[] = [];
	for await (const subscriber of subscribersOf('news')) {
		const unsubscribe = `https://example.com/unsubscribe?token=${encodeURIComponent(subscriber.token)}`;
		try {
			await mailer.send({
				to: subscriber.email,
				...mails.render('newsletter', { name: subscriber.name, unsubscribe }), // the link in the body
				headers: { ...listUnsubscribe({ url: unsubscribe }) }, // the button in the mail client
				idempotencyKey: `newsletter-${issue}/${subscriber.id}`,
			});
			sent += 1;
		} catch (error) {
			if (!(error instanceof MailError)) throw error;
			failed.push(subscriber.id); // an id, never the address or the token
		}
	}
	return { sent, failed };
}
```

## Attachments

An attachment is a file's **bytes**, its name and its type:

| Field | Type | Effect |
| --- | --- | --- |
| `filename` | `string` | The name the recipient's mail client shows and saves it as. Not empty, not `.` or `..`; no `/` or `\`, no line break, no control or format character. Accents and spaces are fine: the transport encodes the name |
| `content` | `Uint8Array` | The bytes, sent as they are. A Node `Buffer` is a `Uint8Array` |
| `contentType` | `string` | A bare `type/subtype`, as `application/pdf` or `text/calendar` — no parameters, and never `multipart/*` or `message/*`, which are not files. Nothing guesses it from the file name |

```ts
import { readFile } from 'node:fs/promises';
import type { Mailer } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' });

export async function sendInvoice(mailer: Mailer, to: string, name: string, number: string): Promise<void> {
	const pdf = await readFile(`invoices/${number}.pdf`); // your storage: a Buffer
	await mailer.send({
		to,
		...mails.render('invoice', { name, number }),
		attachments: [{ filename: `invoice-${number}.pdf`, content: pdf, contentType: 'application/pdf' }],
	});
}
```

Bytes from anywhere fit — a file read with `readFile`, a PDF your code just
generated, what `fetch` answered (`new Uint8Array(await response.arrayBuffer())`),
or text you encoded (`new TextEncoder().encode(csv)`).

**There is no `path`, no URL and no stream.** A transport never reads a file
from disk or fetches a URL to attach it: a value that came from outside —
a file name in a request, a link in a database — can then never make an
e-mail carry a file it should not. The SMTP transport tells nodemailer so
explicitly. Read the file yourself, where you decide which files may be read.

**A large or sensitive file is a link.** Every provider caps the whole
message — about 25 MB sending through Gmail, 40 MB at Resend once encoded —
and base64, which every transport uses on the way, makes a file a third
larger. A file in an e-mail also stays in an inbox forever, forwarded or not.
Put a signed, expiring URL in the template instead; a
[URL variable](rendering.md) is already checked (`http:`, `https:` or
`mailto:` only):

```ts
import type { Mailer } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';

declare function signedUrl(key: string, expiresInSeconds: number): Promise<string>; // your storage

const mails = createMailRenderer({ dir: 'dist' });

export async function sendExport(mailer: Mailer, to: string, key: string): Promise<void> {
	const link = await signedUrl(key, 24 * 3600);
	await mailer.send({ to, ...mails.render('export-ready', { link }) });
}
```

Inline images — a `cid:` the HTML points at — are not supported yet: a
logo belongs on an `https:` URL, which is what the templates of
`@nxgt/mail-ui` already use.

`checkMessage` refuses, naming where and never the file's name:

| Written | Answer |
| --- | --- |
| `attachments: pdf` — one, not in a list | a compile error; at run time `MailRefused`: `send: attachments must be an array` |
| `[null]` | `MailRefused`: `send: attachments[0] must be an object, as { filename, content, contentType }` |
| `{ filename, content: '%PDF-1.7', contentType }`, or `{ filename, path, contentType }` | a compile error; at run time `MailRefused`: `send: attachments[0].content must be a Uint8Array — the file's bytes, never a path or a URL` |
| `filename: 'invoices/42.pdf'`, `'..\\42.pdf'`, `'..'`, `''`, or one holding a line break or a right-to-left override | `MailRefused`: `send: attachments[0].filename must be a file name — not empty, not . or .., without / or \, a line break or a control character` |
| `contentType: 'text/plain; charset=utf-8'`, `'pdf'`, or `'message/rfc822'` | `MailRefused`: `send: attachments[0].contentType must be a file's type/subtype, as application/pdf — never multipart/* or message/*` |
| `attachments: []` | accepted: the same as none |

A message the provider refuses — too large, or an attachment it will not
carry — is a `MailRefused` from the transport (an SMTP `552`; a Resend `400`,
`413` or `422`), and sending it again unchanged fails again: send a link
instead.

## Idempotency — sending once

A send that fails with `MailFailure` may still have reached the provider: a
timeout, a dropped connection. Retrying it can deliver the e-mail twice.
`idempotencyKey` names the send, so a transport that can deduplicate delivers
it once however often it is sent:

```ts
import type { Mailer, Rendered } from '@nxgt/mail';

export async function sendReceipt(mailer: Mailer, order: { id: string; email: string }, rendered: Rendered): Promise<void> {
	await mailer.send({
		...rendered,
		to: order.email,
		idempotencyKey: `order-${order.id}/receipt`, // the same for every retry of this receipt
	});
}
```

**Derive the key from what the e-mail is about** — an order id, a user id
and a purpose (`user-7/welcome`, `invitation-19`) — **never from the time or
a random value**: a retry would carry a new key, and deliver again. **A key
names one e-mail**: two different e-mails about the same thing need two keys
(`order-42/receipt`, `order-42/shipped`) — a transport that deduplicates
refuses a different message under a key it already delivered.

```ts
declare const order: { id: string };
declare const userId: string;
declare const resetRequestId: string;

const receipt = `order-${order.id}/receipt`; // one receipt per order
const welcome = `user-${userId}/welcome`; // one welcome per user
const reset = `password-reset/${resetRequestId}`; // per request, not per user: a second request is a second e-mail

const wrong = `receipt-${Date.now()}`; // a retry gets a new key, and delivers again
const wrongToo = crypto.randomUUID(); // the same
```

**What each transport does with it:**

| Transport | Effect |
| --- | --- |
| `createMemoryMailer()` | The same message under a key it already delivered answers that delivery's `messageId`, and delivers nothing more; a different message under that key is a `MailRefused`. A send that failed leaves its key free. See [Testing — idempotency](testing.md#idempotencykey--a-retry-delivers-once) |
| `@nxgt/mail-resend` | Sent as Resend's `Idempotency-Key` header. Resend keeps a key for 24 hours: a retry within them answers the first send's id and delivers nothing more; the same key with a different message is refused (`MailRefused`) |
| `@nxgt/mail-smtp` | Ignored: SMTP has no such mechanism, so a message sent twice is delivered twice |

A transport that cannot deduplicate ignores the key; it never refuses the
message for carrying one. So a key is always safe to set, and only makes a
retry safe where the transport honours it. It is never written into the
e-mail itself.

`checkMessage` refuses a key that is not 1 to 256 visible ASCII characters —
empty, too long, holding a space, a line break or an accented letter, or not
a string — without quoting it:

| Written | Answer |
| --- | --- |
| `'order-42/receipt'`, `'a:b_c.d~e'`, `'k'.repeat(256)` | accepted |
| `''`, `'k'.repeat(257)`, `'order 42'`, `'commande-42-reçu'`, `'order-42\r\nX-Evil: 1'`, `42` | `MailRefused`: `send: idempotencyKey must be 1 to 256 visible ASCII characters, as order-42/receipt` |

A transport that deduplicates also refuses **a different message** under a
key it already delivered, with `MailRefused` — the memory mailer with
`send: idempotencyKey was already used for a different message — a key names one e-mail`,
Resend's transport with `send: Resend refused the message` on its `409`.
Sending it again fails again: give that e-mail its own key.

A retry from a queue, with the key the job carries:

```ts
import { MailFailure, type Mailer, type MailMessage } from '@nxgt/mail';

// Yours: the queue that runs a job again later.
declare function retryLater(job: { message: MailMessage }, delaySeconds: number): Promise<void>;

export async function runSendJob(mailer: Mailer, job: { message: MailMessage }): Promise<void> {
	try {
		await mailer.send(job.message); // job.message.idempotencyKey was set when the job was queued
	} catch (error) {
		if (error instanceof MailFailure) return retryLater(job, 60); // the same key: delivered once, where the transport deduplicates
		throw error; // MailRefused: sending it again fails again
	}
}
```

## Errors

```ts
type MailErrorCode = 'MAIL_FAILED' | 'MAIL_REFUSED';

interface MailErrorOptions {
	readonly cause?: unknown; // the error that caused this one, typically the transport's
}

abstract class MailError extends Error {
	abstract readonly code: MailErrorCode;
	constructor(message: string, options?: MailErrorOptions);
}
class MailFailure extends MailError {
	readonly code: 'MAIL_FAILED';
}
class MailRefused extends MailError {
	readonly code: 'MAIL_REFUSED';
}
```

| Code | Class | When | Sending it again |
| --- | --- | --- | --- |
| `MAIL_FAILED` | `MailFailure` | The transport could not hand the e-mail over: a refused connection, a timeout, a 5xx from the provider, an expired credential. The transport's error is the `cause`. **Nothing is known to have been sent**: after a timeout or a dropped connection the provider may have taken it all the same | May work later — with an [`idempotencyKey`](#idempotency--sending-once), without a second delivery where the transport deduplicates. Never report it as sent |
| `MAIL_REFUSED` | `MailRefused` | The e-mail itself was refused, before or by the transport: no recipient, something that is not an address, a line break in the subject or a header, a reserved header, an attachment that is not bytes or is badly named, an unsubscribe URL that is not `https:` or holds a raw comma, a malformed idempotency key or one already used for a different message, or the provider answering that the message is malformed or too large | Fails again, unchanged |

`MailError` is **abstract**: catch it, test `instanceof MailError`, but
`new MailError(…)` does not compile — a bare one would pass a `code` check and
fail `instanceof MailFailure`. What is thrown is always one of the two
subclasses. `MailError` extends `Error`, not `TypeError`, so a `catch` needs no
ordering.
`code` is a union, so a `switch` over it is exhaustive: when a code is added, a
function like `statusOf` below stops compiling instead of answering
`undefined`.

```ts
import { MailError, type MailErrorCode, type Mailer, type MailMessage } from '@nxgt/mail';

export function statusOf(code: MailErrorCode): number {
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

**An error's `message` reports a shape, never a value.** It names where the
problem is — `send: to[1] is not an e-mail address` — and never the address,
the subject or a link: the link in a verification e-mail is a credential, and
an address is personal data. What the provider said is on `cause`, for your
logs.

A refusal that can only come from how the application was wired — a bad option
passed to a transport's factory — is a bare `TypeError`. No request handler
should answer one, so none needs to tell it apart.

## A realistic case — a sign-up handler

The account is created whatever happens to the e-mail; what the visitor is told
depends on whether the e-mail left:

```ts
import { MailError, type Mailer } from '@nxgt/mail';
import { type MailRenderer } from '@nxgt/mail/renderer';

// Yours: your user store, your token issuer.
declare function createUser(email: string): Promise<{ id: string; email: string; name: string }>;
declare function issueVerificationToken(userId: string): Promise<string>;

export function signUpHandler(mailer: Mailer, mails: MailRenderer) {
	return async (request: Request): Promise<Response> => {
		const { email } = (await request.json()) as { email: string };
		const user = await createUser(email);
		const token = await issueVerificationToken(user.id);
		const link = `https://app.example.com/verify?token=${encodeURIComponent(token)}`;

		try {
			// Inside the try: render throws MailRefused for a link that is not a safe URL.
			await mailer.send({ to: user.email, ...mails.render('verify-email', { name: user.name, link }) });
		} catch (error) {
			if (!(error instanceof MailError)) throw error;
			// MAIL_FAILED: offer "send it again" later. MAIL_REFUSED: the address is unusable.
			return Response.json({ userId: user.id, emailSent: false, code: error.code }, { status: 201 });
		}
		return Response.json({ userId: user.id, emailSent: true }, { status: 201 });
	};
}
```

## See also

- [Rendering](rendering.md) — filling a Maizzle build into the `Rendered` a message spreads.
- [Testing](testing.md) — the memory mailer, and making a send fail on purpose.
- [Locales](locales.md) — choosing the locale an e-mail is rendered in.
- [Writing a transport](transports.md) — implementing the port.
- [Troubleshooting](../troubleshooting.md) — each error message, its cause and
  its fix.
