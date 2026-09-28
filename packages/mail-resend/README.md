# @nxgt/mail-resend

A [Resend](https://resend.com) transport for
[`@nxgt/mail`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail),
over `fetch`, with no SDK and no dependency. It throws the `MailFailure` and
`MailRefused` of its `@nxgt/mail` peer, so `instanceof` holds whichever
transport is wired, and it passes the `@nxgt/mail/conformance` suite against a
local server answering as Resend's API does.

```ts
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({
	apiKey: process.env.RESEND_API_KEY ?? '',
	from: { name: 'Acme', address: 'noreply@acme.test' },
});

const { messageId } = await mailer.send({
	to: 'ada@example.com',
	subject: 'Confirm your address',
	html: '<p>…</p>',
	text: '…',
}); // Resend's id — or it throws
```

> **0.x.** A minor version may still change the surface; the changelog says how.

## Install

```sh
bun add @nxgt/mail-resend @nxgt/mail
```

Peers, all required:

- `@nxgt/mail` — the port, the errors and the checks: `^0.5`, the version
  whose conformance suite checks `idempotencyKey`. One copy in your tree, so `error instanceof MailFailure`
  holds.
- `typescript` (6). Bundler resolution (`"moduleResolution": "bundler"`) is
  what is supported and tested; `nodenext` is out of contract.

It runs wherever `fetch` does — Node `>=20` (the active LTS), Bun, Deno, an
edge runtime — and imports no Node built-in. CI tests on Bun only.

## Exports

| Export | What it is |
| --- | --- |
| `createResendMailer(options)` | A `ResendMailer` — a `Mailer` that sends each message with `POST /emails`, plus `sendBatch`, `cancel` and `reschedule` |
| `ResendMailerOptions` | `{ apiKey, from?, baseUrl?, fetch?, timeoutMs? }` |
| `ResendMailer` | The type `createResendMailer` answers: `Mailer` and the three methods above |
| `formatAddress(address)` | An `Address` as Resend reads it: bare, or `"name" <address>` with the name quoted |

## Usage

### Options

| Option | Type | Default | |
| --- | --- | --- | --- |
| `apiKey` | `string` | required | The Resend API key, `re_…` |
| `from` | `Address` | none | The sender of a message that names none |
| `baseUrl` | `string` | `https://api.resend.com` | Where `POST /emails` goes: a proxy, or a test server |
| `fetch` | `(url, init) => Promise<Response>` | the global `fetch` | For a proxy agent, or a test |
| `timeoutMs` | `number` | `30000` | A send taking longer fails with `MailFailure`, whatever `fetch` does with the signal. At most `2147483647` |

```ts
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '', timeoutMs: 10_000 });

await mailer.send({
	to: [{ name: 'Doe, John', address: 'john@example.com' }],
	from: 'billing@acme.test', // required here: this mailer has no default
	replyTo: 'support@acme.test', // sent as reply_to
	headers: { 'X-Entity-Ref-ID': 'invoice-42' },
	subject: 'Your invoice',
	html: '<p>…</p>',
	text: '…',
});
```

- Every message is checked by `checkMessage` from `@nxgt/mail` first: the
  same refusals, with the same messages, as every transport.
- A message's own `from` wins over the default.
- A name is sent as a quoted string — `"Doe, John" <john@example.com>` — so a
  comma or an angle bracket in it never names another recipient.
- `messageId` is Resend's `id`, or `null` when the answer carries none.
- For marketing mail, build `List-Unsubscribe` and `List-Unsubscribe-Post`
  with `listUnsubscribe` from `@nxgt/mail` rather than by hand — see
  [one-click unsubscribe](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md#one-click-unsubscribe).

### Attachments

`attachments` on the message are sent in Resend's `attachments`, each file's
bytes encoded as base64 — with no Node built-in, so it still runs on an edge
runtime:

```ts
const pdf = new Uint8Array(await (await fetch('https://files.acme.test/invoices/42.pdf')).arrayBuffer());

await mailer.send({
	to: 'ada@example.com',
	subject: 'Your invoice',
	html: '<p>Your invoice is attached.</p>',
	text: 'Your invoice is attached.',
	attachments: [{ filename: 'invoice-42.pdf', content: pdf, contentType: 'application/pdf' }],
});
```

Resend's `path` (a URL it would fetch) is never used: an attachment is bytes
your code already holds. Resend takes at most **40 MB per e-mail, after
base64** — a third larger than the files — and refuses more (`MailRefused`).
**A large or sensitive file is a signed link in the template**, not an
attachment. See [Setting up — what a message becomes](docs/guide/setup.md#what-a-message-becomes).

### Inline images — `cid:`

An attachment with a `contentId` is sent with Resend's `content_id`, and the
HTML shows it as `cid:<contentId>`:

```ts
const logo = new Uint8Array(await (await fetch('https://files.acme.test/logo.png')).arrayBuffer());

await mailer.send({
	to: 'ada@example.com',
	subject: 'Your receipt',
	html: '<img src="cid:logo@acme.test" alt="Acme"><p>Thank you.</p>',
	text: 'Thank you.',
	attachments: [{ filename: 'logo.png', content: logo, contentType: 'image/png', contentId: 'logo@acme.test' }],
});
```

`checkMessage` refuses an id over 127 characters — Resend takes fewer than
128 — and a `cid:` the HTML shows with no attachment of that `contentId`,
with `MailRefused`. Resend's dashboard preview does not show inline images
yet; the recipient's mail client does. Needs `@nxgt/mail` 0.6 or later.

### Tags — grouping sends in Resend's dashboard

A message's `tags` are sent as Resend's `tags`, a list of `{ name, value }`:
Resend shows them in its dashboard and sends them with every webhook event.

```ts
await mailer.send({
	to: 'ada@example.com',
	subject: 'Reset your password',
	html: '<p>…</p>',
	text: '…',
	tags: { category: 'passwordReset', plan: 'enterprise' }, // [{ name: 'category', value: 'passwordReset' }, …]
});
```

`checkMessage` holds each name and value to Resend's rule — 1 to 256 ASCII
letters, digits, `_` or `-` — and the transport refuses more than 75 tags,
Resend's limit, with `MailRefused` before sending. No address or secret in a
tag: it lands in Resend's logs and your webhooks. Needs `@nxgt/mail` 0.6 or
later.

### Idempotency — a retry that delivers once

A message's `idempotencyKey` is sent as Resend's `Idempotency-Key` header.
Resend keeps a key for **24 hours**: a retry within them answers the first
send's id, and delivers nothing more.

```ts
import { MailFailure } from '@nxgt/mail';

const receipt = {
	to: 'ada@example.com',
	subject: 'Your receipt',
	html: '<p>Thank you for your order.</p>',
	text: 'Thank you for your order.',
	idempotencyKey: 'order-42/receipt', // from what the e-mail is about, never the time or a random value
};

const sent = await mailer.send(receipt).catch(async (error: unknown) => {
	if (!(error instanceof MailFailure)) throw error;
	return mailer.send(receipt); // a timeout may have delivered it: the key keeps it to one e-mail
});
```

The same key with a **different** message is refused by Resend
(`409 invalid_idempotent_request`, a `MailRefused`): a key names one e-mail.
The same key while its first send is **still in progress**
(`409 concurrent_idempotent_requests`) is a `MailFailure`: retry later. Past
24 hours, the key is forgotten and a retry delivers again. The key never
reaches the e-mail. See
[Setting up — the idempotency key](docs/guide/setup.md#the-idempotency-key).

### Sending many at once — `sendBatch`

`mailer.sendBatch(messages)` calls Resend's `POST /emails/batch` — up to 100
messages per request; above it, split into as many requests as it takes:

```ts
const results = await mailer.sendBatch([
	{ to: 'ada@example.com', subject: 'Welcome', html: '<p>…</p>', text: '…' },
	{ to: 'grace@example.com', subject: 'Welcome', html: '<p>…</p>', text: '…' },
]);
// [{ status: 'sent', sentMail: { messageId: '…' } }, { status: 'sent', sentMail: { messageId: '…' } }]
```

Every message is checked with `checkMessage` before any request goes out — a
malformed one is reported `refused` on its own, and never reaches Resend.
Two things `send` takes are refused in a batch instead, each on its own
message, the rest unaffected: an **attachment** (Resend's batch does not
support them yet) and a message's own **`idempotencyKey`** (Resend takes one
`Idempotency-Key` per batch *request*, in the header, never one per message —
none is sent for a batch request at all, so retrying `sendBatch` itself can
duplicate every message that went through). A request of up to 100 that
Resend refuses, or cannot be reached for, reports every message in it the
same way — `refused` or `failed` — since Resend answers the whole request as
one; a later request still runs, and is reported on its own. See
[Setting up — sendBatch](docs/guide/setup.md#sendbatch).

### Scheduling — `scheduledAt`

A message's `scheduledAt` is sent as Resend's `scheduled_at`, ISO 8601:

```ts
await mailer.send({
	to: 'ada@example.com',
	subject: 'Your trial ends in three days',
	html: '<p>…</p>',
	text: '…',
	scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // '2026-09-30T14:00:00.000Z'
});
```

Resend answers an id right away, as any send does; the e-mail itself goes out
later. `@nxgt/mail`'s `checkMessage` already refuses a `scheduledAt` more than
30 days ahead — [Resend's own limit](https://resend.com/docs/dashboard/emails/schedule-email) —
before anything is sent, so a message accepted here is never refused by
Resend for being too far out. Needs `@nxgt/mail` 0.7 or later.

### Cancel and reschedule

`mailer.cancel(messageId)` stops a message `send` scheduled ahead, before
Resend sends it — its own [`POST /emails/{id}/cancel`](https://resend.com/docs/api-reference/emails/cancel-email).
`mailer.reschedule(messageId, scheduledAt)` moves one to a new time instead —
[`PATCH /emails/{id}`](https://resend.com/docs/api-reference/emails/update-email),
held to the same 30-day and clock-skew rule as `send`'s own `scheduledAt`.

```ts
import { MailScheduleRefused } from '@nxgt/mail';

const { messageId } = await mailer.send({ ...message, scheduledAt: inThreeDays });
if (messageId === null) {
	throw new Error('Resend answered no id: nothing to cancel or reschedule.');
}

try {
	await mailer.cancel(messageId);
} catch (error) {
	if (error instanceof MailScheduleRefused && error.code === 'ALREADY_SENT') {
		// too late: it already went out
	}
	throw error;
}
```

Both resolve once Resend confirms it, and both refuse with
`@nxgt/mail`'s `MailScheduleRefused` — `UNKNOWN_ID` for an id Resend does not
hold pending (already cancelled, or never valid), `ALREADY_SENT` for one it
already sent — Resend documents neither answer precisely; this reads a `404`
as `UNKNOWN_ID` and a `400` as `ALREADY_SENT`, the only two observed for these
endpoints. Anything else is a `MailFailure`, Resend's answer as the `cause`.
See [Setting up — cancel and reschedule](docs/guide/setup.md#cancel-and-reschedule).

### Errors — a refusal or a failure

| When | Throws | `cause` |
| --- | --- | --- |
| `400`, `422` — Resend refuses the message, an attachment over the size limit included; `413` — a request too large for what sits in front of the API; `409 invalid_idempotent_request` — the `idempotencyKey` already used for a different message | `MailRefused` — `send: Resend refused the message` | an `Error` with `status`, `errorName` and Resend's `detail` |
| `401`, `403`, `429`, `5xx`, `409 concurrent_idempotent_requests` — the same key's first send still in progress — any other status | `MailFailure` — `send: Resend could not take the message` | the same |
| A network error | `MailFailure` — `send: Resend could not be reached` | the `fetch` error |
| No answer within `timeoutMs` | `MailFailure` — `send: Resend did not answer within <timeoutMs> ms` | the `TimeoutError` |
| No sender, on the message or as a default | `MailRefused` — `send: from is missing — give the message a from, or createResendMailer a default one` | — |
| A bad option | `TypeError` from `createResendMailer` | — |

```ts
import { MailFailure, MailRefused } from '@nxgt/mail';

try {
	await mailer.send(message);
} catch (error) {
	if (error instanceof MailRefused) {
		// sending it again unchanged fails again: fix the address or the content
	} else if (error instanceof MailFailure) {
		// nothing is known to have been sent: a bad key, a rate limit, an outage — retry later, from a queue
	}
	throw error;
}
```

A message reports a shape, never a value: never the key, an address or what
Resend said — that is on `cause.detail`. Nothing is retried. Every case is in
[Errors](docs/guide/errors.md).

### Testing

In an application's tests, use `createMemoryMailer()` from `@nxgt/mail`. To
test this transport, see [Testing](docs/guide/testing.md): a local Bun server
answering as Resend does, `baseUrl` pointed at it, and `describeMailer`.

## Webhooks — delivery events

`@nxgt/mail-resend/webhooks` verifies Resend's webhook signature and answers
a neutral `MailEvent` from `@nxgt/mail`: what happened to a message after
`send` handed it over.

```ts
// A plain fetch handler
import { MailWebhookRefused } from '@nxgt/mail';
import { createResendWebhook } from '@nxgt/mail-resend/webhooks';

declare function suppress(recipient: string): Promise<void>; // your own: stop sending to this address

const webhook = createResendWebhook({ secret: process.env.RESEND_WEBHOOK_SECRET ?? '' });

export default {
	async fetch(request: Request): Promise<Response> {
		try {
			const event = await webhook.verify(request);
			if (event === null) return new Response(null, { status: 202 }); // an event type this package does not map
			if (event.type === 'bounced' && event.bounceType === 'hard') await suppress(event.recipient);
			return new Response(null, { status: 202 });
		} catch (error) {
			if (error instanceof MailWebhookRefused) return new Response(null, { status: 401 });
			throw error;
		}
	},
};
```

```ts
// Hono — c.req.raw is the standard Request; verify reads its raw body itself
import { MailWebhookRefused } from '@nxgt/mail';
import { createResendWebhook } from '@nxgt/mail-resend/webhooks';
import { Hono } from 'hono';

declare function suppress(recipient: string): Promise<void>; // your own: stop sending to this address

const webhook = createResendWebhook({ secret: process.env.RESEND_WEBHOOK_SECRET ?? '' });
const app = new Hono();

app.post('/webhooks/resend', async (c) => {
	try {
		const event = await webhook.verify(c.req.raw);
		if (event === null) return c.body(null, 202);
		if (event.type === 'bounced' && event.bounceType === 'hard') await suppress(event.recipient);
		return c.body(null, 202);
	} catch (error) {
		if (error instanceof MailWebhookRefused) return c.body(null, 401);
		throw error;
	}
});
```

| Export | What it is |
| --- | --- |
| `createResendWebhook(options)` | `{ secret, toleranceMs? } → { verify(request) }` |
| `ResendWebhookOptions` | `{ secret, toleranceMs? }` — `toleranceMs` defaults to `300000` (5 minutes) |
| `ResendWebhookRequest` | `Request`, or `{ headers, body }` when a framework already read the raw body |
| `ResendWebhook` | `{ verify(request): Promise<MailEvent \| null> }` |
| `MailWebhookHeaders` | The headers `verify` reads: a `Headers`, or a plain record (case-insensitive; a repeated header answers its first value) |

- **Give `verify` the raw body, never a parsed one.** The signature is an
  HMAC over the exact bytes Resend sent; a body already parsed to JSON and
  re-serialized has different key order or whitespace, and no longer
  matches. Pass the `Request` itself — `verify` reads `request.text()` — or,
  if your framework has already read the body as **text** (not JSON), pass
  `{ headers, body }`.
- **Verifies Resend's Svix signature**: the headers `svix-id`,
  `svix-timestamp` and `svix-signature`, a secret `whsec_…`, HMAC-SHA256 over
  `${svix-id}.${svix-timestamp}.${body}`, `svix-signature` holding one or more
  space-separated `v1,<signature>` (any one matching is enough — Resend
  rotates the secret this way), and `svix-timestamp` within `toleranceMs` of
  now, either way.
- **Web Crypto only** (`crypto.subtle`, `atob`/`btoa`) — no Node built-in, so
  this runs on Node, Bun, Deno, an edge runtime or a Cloudflare Worker alike.
- **An event type Resend sends but this package does not map is `null`** —
  `email.sent`, `email.scheduled`, `email.failed`, `email.received`,
  `email.suppressed`, and any type Resend adds later — never a throw.
- **A bad or old signature throws `MailWebhookRefused`** from the `@nxgt/mail`
  peer, with a `code`: `INVALID_SIGNATURE` (a header missing, no signature
  matches, or the body was not the exact raw text) or `EXPIRED_TIMESTAMP` (the
  timestamp is outside `toleranceMs`). Both mean the same thing to a
  handler — `401`, never retried.

See [Resend's event types](https://resend.com/docs/dashboard/webhooks/event-types),
[verifying webhook requests](https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests)
and [Svix's signing algorithm](https://docs.svix.com/receiving/verifying-payloads/how-manual),
and [`@nxgt/mail`'s guide to delivery events](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/events.md)
for the `MailEvent` shape. Needs `@nxgt/mail` 0.8 or later.

## Traps

**Read the key where the process starts, and decide its absence there.**
`apiKey: process.env.RESEND_API_KEY` does not compile (`string | undefined`);
`?? ''` makes an unset variable a `TypeError` at start-up, not a failure at
the first send.

**A key read from a file keeps its line break.** A key holding whitespace is
refused at wiring; trim it.

**Attachments count against Resend's 40 MB after base64.** A 30 MB file
is at it once encoded, before the rest of the body; Resend answers `422`
`invalid_attachment`. The whole request is also held in memory while it is
sent; past a few megabytes, send a signed link.

**A `403` is a failure, not a refusal.** An invalid key or an unverified
sending domain refuses every message alike: it is the wiring that is wrong.

**A `429` is a failure.** Resend rate-limits per second; slow down or queue.
The transport does not wait and retry for you.

**A timeout does not mean nothing was sent.** After `timeoutMs`, or a
connection dropped mid-request, Resend may have accepted the e-mail: a retry
without a key can send it twice. Set `idempotencyKey: 'order-42/receipt'`,
and retry within Resend's 24 hours.

**A batch request refuses or fails as a whole.** Resend answers one request
of up to 100 messages as one; a malformed message anywhere in it, or an
outage, is reported for **every** message of that request, not only the bad
one — `sendBatch` cannot tell which one it was about. Keep a batch to
messages you have already checked (`sendBatch`'s own pre-check catches what
`checkMessage` would), and read every result: `sent`, `refused` or `failed`.

**`cancel` and `reschedule` need the id `send` answered, not your own.**
`messageId` is Resend's own id, from `SentMail.messageId` — not an order id
or any id of your own; passing one of those is `MailScheduleRefused` with
`UNKNOWN_ID`, since Resend never held that id pending.

## Type safety, counted

**12 plausible mistakes, 12 refused** at compile time, each measured by a
`@ts-expect-error` in
[`test/types/refusals.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-resend/test/types/refusals.ts)
that fails the typecheck the moment it stops holding:

1. No `apiKey`.
2. An `apiKey` that may be `undefined` — `process.env.RESEND_API_KEY` as is.
3. `timeoutMs` written as a duration (`'30s'`).
4. A default `from` without its `address`.
5. Resend's wire format in the options (`reply_to`): a message carries its
   `replyTo`.
6. A `retries` option: the transport tries once.
7. `messageId` read as a `string`: it is `string | null`.
8. `createResendWebhook` without a `secret`.
9. `verify` given an already-parsed body instead of the raw text.
10. A `MailWebhookErrorCode` the union does not declare.
11. `sendBatch` given one message instead of a list, even of one.
12. `reschedule`'s `scheduledAt` given as an ISO string rather than a `Date`.

The same file holds the calls that must keep compiling — among them a `fetch`
written as a plain function, a webhook verified against a `Request` or
`{ headers, body }`, and `sendBatch`, `cancel` and `reschedule` called as
`ResendMailer` declares them.

## Documentation

- [The guides](docs/README.md) — the options, the errors, testing.
- [Troubleshooting](docs/troubleshooting.md) — an error message, its cause and
  its fix.
- [Roadmap](docs/roadmap.md) — what is next, and what is deliberately not
  planned.
- [Vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md)
  — the words these pages use, defined once.

## Licence

MIT
