# Setting up

`createResendMailer` sends each message with one `POST /emails` to Resend's
API, over `fetch`: no SDK, no dependency, no Node built-in. It adds the
`Mailer` contract of `@nxgt/mail` — the same refusals as every transport, the
two errors, no retry.

```ts
import { createResendMailer } from '@nxgt/mail-resend';

export const mailer = createResendMailer({
	apiKey: process.env.RESEND_API_KEY ?? '',
	from: { name: 'Acme', address: 'noreply@acme.test' },
});
```

## The signature

```ts
function createResendMailer(options: ResendMailerOptions): Mailer;

interface ResendMailerOptions {
	readonly apiKey: string;
	readonly from?: Address;
	readonly baseUrl?: string;
	readonly fetch?: (url: string, init: RequestInit) => Promise<Response>;
	readonly timeoutMs?: number;
}
```

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `apiKey` | `string` | required | Sent as `Authorization: Bearer …`. Empty, blank or holding whitespace is a `TypeError` |
| `from` | `Address` | none | The sender of a message that has no `from`. Without it, such a message is refused with `MailRefused` |
| `baseUrl` | `string` | `https://api.resend.com` | An `http:` or `https:` URL; `/emails` is appended, a trailing `/` dropped |
| `fetch` | `(url, init) => Promise<Response>` | the global `fetch` | Every request goes through it |
| `timeoutMs` | `number` | `30000` | A positive integer, at most `2147483647`. A send that has no answer by then is aborted and fails with `MailFailure` |

Options are checked when the mailer is created, and a mistake is a bare
`TypeError` — see [Errors — wiring](errors.md#wiring--a-typeerror).

## The key

Read it where the process starts, and decide there what an unset variable
means. `process.env.RESEND_API_KEY` is `string | undefined`, which does not
compile as `apiKey`:

```ts
import { createResendMailer } from '@nxgt/mail-resend';

// An unset variable: a TypeError now, at start-up — never a failure at the first send.
const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '' });
```

A key read from a file keeps its final line break, and `fetch` would refuse
the header at every send. A key holding whitespace is refused at wiring
instead:

```ts
import { readFileSync } from 'node:fs';
import { createResendMailer } from '@nxgt/mail-resend';

const apiKey = readFileSync('/run/secrets/resend', 'utf8').trim();
const mailer = createResendMailer({ apiKey });
```

The key is never written in an error message.

## The sender

A message's own `from` wins; the default is used when it has none; with
neither, the send is refused with `MailRefused` before any request:

```ts
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({
	apiKey: process.env.RESEND_API_KEY ?? '',
	from: { name: 'Acme', address: 'noreply@acme.test' },
});

await mailer.send({ to: 'ada@example.com', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' }); // from Acme
await mailer.send({
	to: 'ada@example.com',
	from: 'billing@acme.test', // this one wins
	subject: 'Your invoice',
	html: '<p>…</p>',
	text: '…',
});
```

The sending domain must be verified in Resend; one that is not is answered
`403`, a `MailFailure`.

## A proxy, a region, a test server — `baseUrl` and `fetch`

`baseUrl` moves every request; `fetch` replaces the function that makes it:

```ts
import { createResendMailer } from '@nxgt/mail-resend';

// Through a gateway of your own.
const viaGateway = createResendMailer({
	apiKey: process.env.RESEND_API_KEY ?? '',
	baseUrl: 'https://mail-gateway.internal.example',
});

// With a fetch that logs each request's timing.
const timed = createResendMailer({
	apiKey: process.env.RESEND_API_KEY ?? '',
	fetch: async (url, init) => {
		const started = performance.now();
		try {
			return await fetch(url, init);
		} finally {
			console.info('resend', Math.round(performance.now() - started), 'ms');
		}
	},
});
```

A `fetch` you pass receives the `AbortSignal` of the timeout in `init.signal`:
pass `init` on, and the request is aborted when it fires. The timeout holds
either way — the send stops waiting for a `fetch` that ignores the signal and
fails with `MailFailure` — but only a `fetch` that passes the signal on
stops the request itself.

## The timeout

`timeoutMs` (30 seconds by default) bounds the request: past it, the request
is aborted and the send fails with `MailFailure` —
`send: Resend did not answer within 30000 ms`. Resend may still have accepted
the message; the id is simply unknown. The bound covers the answer's body
too: a `2xx` whose body never ends answers `{ messageId: null }` once the
timeout passes. It is a timer, so at most `2147483647` ms — a longer one
would fire at once, and is refused at wiring. A send awaited in a request handler
usually wants less:

```ts
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '', timeoutMs: 10_000 });
```

## What a message becomes

```ts
await mailer.send({
	to: ['ada@example.com', { name: 'Doe, "John"', address: 'john@example.com' }],
	replyTo: 'support@acme.test',
	headers: { 'X-Entity-Ref-ID': 'invoice-42' },
	subject: 'Hi',
	html: '<p>Hi</p>',
	text: 'Hi',
	attachments: [{ filename: 'hello.txt', content: new TextEncoder().encode('Hello'), contentType: 'text/plain' }],
});
```

```http
POST /emails HTTP/1.1
Host: api.resend.com
Authorization: Bearer re_…
Content-Type: application/json

{
  "from": "\"Acme\" <noreply@acme.test>",
  "to": ["ada@example.com", "\"Doe, \\\"John\\\"\" <john@example.com>"],
  "subject": "Hi",
  "html": "<p>Hi</p>",
  "text": "Hi",
  "reply_to": "support@acme.test",
  "headers": { "X-Entity-Ref-ID": "invoice-42" },
  "attachments": [
    { "filename": "hello.txt", "content": "SGVsbG8=", "content_type": "text/plain" }
  ]
}
```

- Every address goes through `formatAddress`: a bare address as is, a name as
  a quoted string with `"` and `\` escaped — so a comma or an angle bracket in
  a name never names another recipient. It is exported, for code that builds
  Resend requests of its own:

  ```ts
  import { formatAddress } from '@nxgt/mail-resend';

  formatAddress({ name: 'Doe, John', address: 'john@example.com' }); // '"Doe, John" <john@example.com>'
  ```

- `replyTo` is sent as `reply_to`, Resend's name for it; `reply_to` and
  `headers` are left out when the message has none.
- `headers` are sent as written, and Resend DKIM-signs the message with your
  domain's key — check that the `DKIM-Signature` of a received message names
  the headers you rely on in `h=`; build `List-Unsubscribe` with `listUnsubscribe` from
  `@nxgt/mail` — see
  [one-click unsubscribe](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md#one-click-unsubscribe).
- Each attachment is sent as `{ filename, content, content_type }`: its bytes
  as base64, encoded in slices with `btoa` — no `Buffer`, so it runs on an
  edge runtime — and its type as `content_type`, Resend's name for it.
  Resend's `path`, a URL it would fetch, is never used. `attachments` is left
  out when the list is empty.
- An attachment's `contentId` is sent as `content_id`, Resend's name for it:
  the attachment is then an inline image the HTML shows as
  `cid:<contentId>`. `content_id` is left out of an attachment without one.
  `checkMessage` has refused, first, an id Resend would not take (128
  characters or more, or outside letters, digits, `.` `_` `~` `+` `-` and one
  `@`) and a `cid:` in the HTML that no attachment names — see
  [`@nxgt/mail` — inline images](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md#inline-images--cid).

  ```json
  { "filename": "logo.png", "content": "iVBORw0K…", "content_type": "image/png", "content_id": "logo@acme.test" }
  ```
- `tags` are sent as Resend's `tags`, a list of `{ name, value }` in the
  record's order, and left out when there are none. `checkMessage` has held
  each name and value to 1 to 256 ASCII letters, digits, `_` or `-`; more
  than 75 tags is refused with `MailRefused` —
  `send: Resend takes at most 75 tags on one e-mail` — and nothing is sent.

  ```json
  "tags": [{ "name": "category", "value": "passwordReset" }, { "name": "plan", "value": "enterprise" }]
  ```
- `scheduledAt` is sent as Resend's `scheduled_at`, ISO 8601
  (`message.scheduledAt.toISOString()`), and left out of a message that has
  none. `checkMessage` has already refused a value that is not a valid
  `Date`, in the past, or more than 30 days ahead — Resend's own limit — so a
  message that reaches Resend is always within it.

  ```json
  "scheduled_at": "2026-09-30T14:00:00.000Z"
  ```
- Resend takes at most 40 MB per e-mail **after** base64, which makes a file
  a third larger; over it, the answer is a `4xx` and `send` throws
  `MailRefused`. A large or sensitive file is a signed link in the template
  instead.
- Before any of it, `checkMessage` from `@nxgt/mail` refuses what no transport
  hands over. Its messages are listed in
  [`@nxgt/mail`'s troubleshooting](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#sending).

`send` answers `{ messageId }`: Resend's `id`, or `null` when a `2xx` answer
carries none, or is not JSON — the message was accepted, the id is absent.

## The idempotency key

A message's `idempotencyKey` is sent as Resend's `Idempotency-Key` header —
never in the JSON body, so it never reaches the e-mail — and a message
without one sends no such header:

```ts
await mailer.send({
	to: 'ada@example.com',
	subject: 'Your receipt',
	html: '<p>Thank you for your order.</p>',
	text: 'Thank you for your order.',
	idempotencyKey: 'order-42/receipt',
});
```

```http
POST /emails HTTP/1.1
Host: api.resend.com
Authorization: Bearer re_…
Content-Type: application/json
Idempotency-Key: order-42/receipt

{ "from": "\"Acme\" <noreply@acme.test>", "to": ["ada@example.com"], "subject": "Your receipt", … }
```

Resend remembers a key for **24 hours**. What it answers a second request
with the same key:

| The second request | Resend answers | `send` |
| --- | --- | --- |
| the same message, after the first was accepted | `200`, the first send's `id` | resolves with that `messageId`; nothing more is delivered |
| a different message — another subject, recipient, attachment | `409 invalid_idempotent_request` | rejects with `MailRefused`: sending it again fails again. Give that e-mail its own key |
| any message, while the first is still in progress | `409 concurrent_idempotent_requests` | rejects with `MailFailure`: retry later, with the same key |
| any message, more than 24 hours later | a new send | resolves with a new id: the e-mail is delivered again |

Derive the key from what the e-mail is about — `order-42/receipt`,
`user-7/welcome` — never from the time or a random value, or every retry
carries a new key. `checkMessage` refuses a key that is not 1 to 256 visible
ASCII characters, before any request. The transport itself retries nothing:
the key is what makes **your** retry safe.

A job that retries after a failure, with the key it was queued with:

```ts
import { MailFailure, type MailMessage } from '@nxgt/mail';
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '', from: 'noreply@acme.test' });

// Yours: the queue that runs a job again later — well within 24 hours.
declare function retryIn(seconds: number): Promise<void>;

export async function sendReceiptJob(order: { id: string; email: string }, rendered: Omit<MailMessage, 'to'>): Promise<void> {
	try {
		await mailer.send({ ...rendered, to: order.email, idempotencyKey: `order-${order.id}/receipt` });
	} catch (error) {
		// A timeout, a 5xx, a 409 still in progress: the same key, later, delivers at most once.
		if (error instanceof MailFailure) return retryIn(60);
		throw error; // MailRefused: fix the message, or its key
	}
}
```

## With the renderer

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';
import { createResendMailer } from '@nxgt/mail-resend';

const mails = createMailRenderer({ dir: 'dist' });
const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '', from: 'noreply@acme.test' });

await mailer.send({
	to: 'ada@example.com',
	...mails.render('verify-email', { name: 'Ada', link: 'https://app.example.com/verify?token=abc' }, { locale: 'fr' }),
});
```

## sendBatch

`mailer.sendBatch(messages)` sends many messages in one call, over Resend's
`POST /emails/batch`, and answers one result per message, in the same
order — never a throw for one message's own outcome:

```ts
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '', from: 'noreply@acme.test' });

const results = await mailer.sendBatch([
	{ to: 'ada@example.com', subject: 'Welcome', html: '<p>…</p>', text: '…' },
	{ to: 'grace@example.com', subject: 'Welcome', html: '<p>…</p>', text: '…' },
]);
// [{ status: 'sent', sentMail: { messageId: 'resend-1' } }, { status: 'sent', sentMail: { messageId: 'resend-2' } }]
```

### The signature

```ts
function sendBatch(messages: readonly MailMessage[]): Promise<readonly MailBatchResult[]>;

type MailBatchResult =
	| { readonly status: 'sent'; readonly sentMail: SentMail }
	| { readonly status: 'refused'; readonly error: MailRefused }
	| { readonly status: 'failed'; readonly error: MailFailure };
```

**Up to 100 messages per request — Resend's own limit ("Trigger up to 100
batch emails at once.").** Above it, `sendBatch` splits `messages` into as
many requests as it takes, in order: 101 messages become two requests, of
100 and 1.

```ts
const messages = Array.from({ length: 101 }, (_, index) => ({
	to: 'ada@example.com',
	subject: `Message ${index}`,
	html: '<p>…</p>',
	text: '…',
}));

const results = await mailer.sendBatch(messages); // two requests to /emails/batch, of 100 and 1
```

**Every message is checked with `checkMessage` before any of them is
sent** — a message near the end that is malformed is known *before* the
ones ahead of it go out, so its result is `refused` from the start, and it
never reaches Resend:

```ts
const tooManyTags = Object.fromEntries(Array.from({ length: 76 }, (_, index) => [`tag${index}`, 'x']));

const results = await mailer.sendBatch([
	{ to: 'ada@example.com', subject: 'Welcome', html: '<p>…</p>', text: '…' },
	{ to: 'nobody@example.com', subject: 'Rejected', html: '<p>…</p>', text: '…', tags: tooManyTags }, // caught before the first request
	{ to: 'grace@example.com', subject: 'Welcome', html: '<p>…</p>', text: '…' },
]);
// [{ status: 'sent', … }, { status: 'refused', error }, { status: 'sent', … }] — the request carries only the two valid messages
```

**Two things `send` takes are refused here instead, each on its own
message, the rest of the batch unaffected:**

| What | Why | Message |
| --- | --- | --- |
| an `attachment` | Resend's `/emails/batch` does not support them | `sendBatch: attachments are not supported in a batch send — Resend's /emails/batch refuses them; send this message on its own with send` |
| the message's own `idempotencyKey` | Resend takes one `Idempotency-Key` per batch *request*, in the header, never one per message — and sends no such header for a batch request at all, so retrying `sendBatch` itself can duplicate every message that went through | `sendBatch: idempotencyKey is not supported in a batch send — Resend takes one Idempotency-Key per batch request, never one per message; send this message on its own with send` |

```ts
const pdf = new Uint8Array(await (await fetch('https://files.acme.test/invoices/42.pdf')).arrayBuffer());

const results = await mailer.sendBatch([
	{
		to: 'ada@example.com',
		subject: 'Your invoice',
		html: '<p>…</p>',
		text: '…',
		attachments: [{ filename: 'invoice-42.pdf', content: pdf, contentType: 'application/pdf' }],
	},
	{ to: 'grace@example.com', subject: 'Welcome', html: '<p>…</p>', text: '…', idempotencyKey: 'welcome-grace' },
]);
// both refused, on their own — send either one on its own with send instead
```

A message with more than 75 `tags`, or without a `from` — its own or a
default — is refused the same way `send` refuses it:
`sendBatch: Resend takes at most 75 tags on one e-mail`,
`sendBatch: from is missing — give the message a from, or createResendMailer
a default one`.

**A request of up to 100 is answered by Resend as a whole**: if Resend
refuses it (a malformed message anywhere in it, once past the checks above)
or cannot be reached, *every* message of that request is reported the same
way — `refused` or `failed` — because Resend gives back one answer for the
whole request, never one per message. A request further along that Resend
does accept still runs, and is reported on its own:

```ts
// One request of, say, 60 messages: Resend refuses it (a 400, a 422…).
// results[0] through results[59] are all { status: 'refused', error }, the
// same MailRefused, even though only one of the 60 messages was at fault.
```

`messages` that is not an array is a bare `TypeError` —
`sendBatch: messages must be an array of MailMessage` — before anything is
attempted.

Wired into a job that sends a digest and requeues only the recipients whose
request failed:

```ts
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '', from: 'noreply@acme.test' });

declare function requeue(to: string): Promise<void>; // yours: try this recipient again later

export async function sendWeeklyDigest(recipients: readonly string[]): Promise<void> {
	const messages = recipients.map((to) => ({
		to,
		subject: 'This week at Acme',
		html: '<p>…</p>',
		text: '…',
	}));
	const results = await mailer.sendBatch(messages);
	await Promise.all(
		results.flatMap((result, index) => {
			const recipient = recipients[index];
			return result.status === 'failed' && recipient !== undefined ? [requeue(recipient)] : [];
		}),
	);
}
```

See [Errors — sendBatch](errors.md#sendbatch) for every message it throws or
reports, and [`@nxgt/mail`'s guide to `sendBatch`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md#sending-many-at-once--sendbatch)
for the port-level function this method backs.

## Cancel and reschedule

`mailer.cancel(messageId)` stops a message `send` scheduled ahead
(`scheduledAt`), before Resend sends it: Resend's
[`POST /emails/{id}/cancel`](https://resend.com/docs/api-reference/emails/cancel-email).
`mailer.reschedule(messageId, scheduledAt)` moves one to a new time instead:
Resend's [`PATCH /emails/{id}`](https://resend.com/docs/api-reference/emails/update-email),
sending `{ scheduled_at: scheduledAt.toISOString() }`. Both resolve once
Resend confirms:

```ts
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '', from: 'noreply@acme.test' });

const { messageId } = await mailer.send({
	to: 'ada@example.com',
	subject: 'Your trial ends in three days',
	html: '<p>…</p>',
	text: '…',
	scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
});
if (messageId === null) throw new Error('Resend answered with no id'); // rare — see "What a message becomes", above

await mailer.reschedule(messageId, new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)); // push it out a day
```

### The signature

```ts
function cancel(messageId: string): Promise<void>;
function reschedule(messageId: string, scheduledAt: Date): Promise<void>;
```

**`messageId` must be the id `send` answered — `SentMail.messageId` — never
an id of your own** (an order id, a queue job id): Resend never held any
other id pending, so it is refused as `UNKNOWN_ID`, below. A `messageId`
that is not a non-empty string is a bare `TypeError`, before any request:
`cancel: messageId must be the id send answered` /
`reschedule: messageId must be the id send answered`.

**`reschedule`'s `scheduledAt` is held to the same rule as `send`'s own** —
a valid `Date`, no earlier than now (within a small clock-skew tolerance),
no more than 30 days ahead, Resend's own limit — via `checkScheduledAt` from
`@nxgt/mail`, before any request:

```ts
declare const messageId: string; // send answered { messageId }, checked not null

await mailer.reschedule(messageId, new Date(Date.now() - 60_000)); // MailRefused: reschedule: scheduledAt is in the past
```

| `message` | When |
| --- | --- |
| `reschedule: scheduledAt must be a valid Date` | Not a `Date`, or an invalid one |
| `reschedule: scheduledAt is in the past` | Earlier than now, past the clock-skew tolerance |
| `reschedule: scheduledAt is more than 30 days ahead — Resend's own limit` | Too far in the future |

**Resend does not document precisely what it answers for an id it already
sent, or one it never held** — this reads a `404` as `UNKNOWN_ID`, and a
`400` as `ALREADY_SENT`, the only two answers observed for either endpoint.
Both are the `@nxgt/mail` peer's `MailScheduleRefused`, never a `MailRefused`
or a `MailFailure`:

```ts
import { MailScheduleRefused } from '@nxgt/mail';

declare const messageId: string; // send answered { messageId }, checked not null

try {
	await mailer.cancel(messageId);
} catch (error) {
	if (error instanceof MailScheduleRefused) {
		if (error.code === 'UNKNOWN_ID') {
			// already cancelled, or never a valid id — nothing to do
		} else {
			// ALREADY_SENT: too late, it already went out
		}
		return;
	}
	throw error; // MailFailure: Resend could not take the request — retry later
}
```

Anything else Resend answers — `401`, `403`, `429`, `5xx`, an outage, a
timeout — is a `MailFailure`, `cancel: Resend could not take the request` or
`reschedule: Resend could not take the request`, Resend's answer as the
`cause`, the same as `send`'s own failures.

See [Errors — cancel and reschedule](errors.md#cancel-and-reschedule) for
every message, and [`@nxgt/mail`'s guide to scheduling](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md#scheduling--scheduledat)
for `scheduledAt` on `send` itself.

## See also

- [Errors](errors.md) — what `send`, `sendBatch`, `cancel` and `reschedule`
  throw, and when.
- [Testing](testing.md) — a local server answering as Resend does, and the
  conformance suite.
