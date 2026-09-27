# Troubleshooting `@nxgt/mail-resend`

Each entry is headed by the message you see. Search this page for the words of
your message.

How the messages are shaped:

- **A message names where the problem is, never the value.** Never the key,
  an address, a subject or what Resend said: Resend's answer is on the
  error's `cause` — `status`, `errorName`, and its own message as `detail`.
- **Every message starts with the call you wrote**: `send: …` or
  `createResendMailer: …`.
- **A `TypeError` is a wiring mistake**, thrown by `createResendMailer` when
  the application starts. Fix the code; no handler should answer one.
- **A `MailError` is a refusal at call time**: a `MailFailure`
  (`MAIL_FAILED`) or a `MailRefused` (`MAIL_REFUSED`), the classes of the
  `@nxgt/mail` peer.

A `send: …` message not on this page comes from `checkMessage` in
`@nxgt/mail` — a message no transport hands over. See
[its troubleshooting](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#sending).

## Index

**Sending**
- [`send: Resend refused the message`](#send-resend-refused-the-message)
- [`send: Resend could not take the message`](#send-resend-could-not-take-the-message)
- [`send: Resend could not be reached`](#send-resend-could-not-be-reached)
- [`send: Resend did not answer within <timeoutMs> ms`](#send-resend-did-not-answer-within-timeoutms-ms)
- [`send: from is missing — give the message a from, or createResendMailer a default one`](#send-from-is-missing--give-the-message-a-from-or-createresendmailer-a-default-one)
- [`send: Resend takes at most 75 tags on one e-mail`](#send-resend-takes-at-most-75-tags-on-one-e-mail)
- [`Resend answered <status> <name>`](#resend-answered-status-name)

**Batch sending**
- [`sendBatch: messages must be an array of MailMessage`](#sendbatch-messages-must-be-an-array-of-mailmessage)
- [`sendBatch: from is missing — give the message a from, or createResendMailer a default one`](#sendbatch-from-is-missing--give-the-message-a-from-or-createresendmailer-a-default-one)
- [`sendBatch: attachments are not supported in a batch send — Resend's /emails/batch refuses them; send this message on its own with send`](#sendbatch-attachments-are-not-supported-in-a-batch-send--resends-emailsbatch-refuses-them-send-this-message-on-its-own-with-send)
- [`sendBatch: idempotencyKey is not supported in a batch send — Resend takes one Idempotency-Key per batch request, never one per message; send this message on its own with send`](#sendbatch-idempotencykey-is-not-supported-in-a-batch-send--resend-takes-one-idempotency-key-per-batch-request-never-one-per-message-send-this-message-on-its-own-with-send)
- [`sendBatch: Resend takes at most 75 tags on one e-mail`](#sendbatch-resend-takes-at-most-75-tags-on-one-e-mail)
- [`sendBatch: Resend refused the batch request`](#sendbatch-resend-refused-the-batch-request)
- [`sendBatch: Resend could not take the batch request`](#sendbatch-resend-could-not-take-the-batch-request)
- [`sendBatch: Resend did not answer within <timeoutMs> ms`](#sendbatch-resend-did-not-answer-within-timeoutms-ms)
- [`sendBatch: Resend could not be reached`](#sendbatch-resend-could-not-be-reached)

**Cancelling and rescheduling**
- [`cancel: messageId must be the id send answered`](#cancel-messageid-must-be-the-id-send-answered)
- [`reschedule: messageId must be the id send answered`](#reschedule-messageid-must-be-the-id-send-answered)
- [`reschedule: scheduledAt must be a valid Date`](#reschedule-scheduledat-must-be-a-valid-date)
- [`reschedule: scheduledAt is in the past`](#reschedule-scheduledat-is-in-the-past)
- [`reschedule: scheduledAt is more than 30 days ahead — Resend's own limit`](#reschedule-scheduledat-is-more-than-30-days-ahead--resends-own-limit)
- [`cancel: Resend has no scheduled message with this id — it may already have been cancelled, or the id is wrong`](#cancel-resend-has-no-scheduled-message-with-this-id--it-may-already-have-been-cancelled-or-the-id-is-wrong)
- [`reschedule: Resend has no scheduled message with this id — it may already have been cancelled, or the id is wrong`](#reschedule-resend-has-no-scheduled-message-with-this-id--it-may-already-have-been-cancelled-or-the-id-is-wrong)
- [`cancel: Resend refused to cancel this message — it has already been sent, and is no longer scheduled`](#cancel-resend-refused-to-cancel-this-message--it-has-already-been-sent-and-is-no-longer-scheduled)
- [`reschedule: Resend refused to reschedule this message — it has already been sent, and is no longer scheduled`](#reschedule-resend-refused-to-reschedule-this-message--it-has-already-been-sent-and-is-no-longer-scheduled)
- [`cancel: Resend could not take the request`](#cancel-resend-could-not-take-the-request)
- [`reschedule: Resend could not take the request`](#reschedule-resend-could-not-take-the-request)
- [`cancel: Resend did not answer within <timeoutMs> ms` / `cancel: Resend could not be reached`](#cancel-resend-did-not-answer-within-timeoutms-ms--cancel-resend-could-not-be-reached)
- [`reschedule: Resend did not answer within <timeoutMs> ms` / `reschedule: Resend could not be reached`](#reschedule-resend-did-not-answer-within-timeoutms-ms--reschedule-resend-could-not-be-reached)

**Wiring**
- [`createResendMailer: options must be an object, as { apiKey }`](#createresendmailer-options-must-be-an-object-as--apikey-)
- [`createResendMailer: apiKey must be a Resend API key — is the environment variable set?`](#createresendmailer-apikey-must-be-a-resend-api-key--is-the-environment-variable-set)
- [`createResendMailer: apiKey holds whitespace — trim the value it was read from`](#createresendmailer-apikey-holds-whitespace--trim-the-value-it-was-read-from)
- [`createResendMailer: baseUrl must be an http: or https: URL`](#createresendmailer-baseurl-must-be-an-http-or-https-url)
- [`createResendMailer: fetch must be a function`](#createresendmailer-fetch-must-be-a-function)
- [`createResendMailer: timeoutMs must be a positive integer`](#createresendmailer-timeoutms-must-be-a-positive-integer)
- [`createResendMailer: timeoutMs must be at most 2147483647 — a longer timer fires at once`](#createresendmailer-timeoutms-must-be-at-most-2147483647--a-longer-timer-fires-at-once)
- [`createResendMailer: from must be an e-mail address, as noreply@example.com or { name, address }`](#createresendmailer-from-must-be-an-e-mail-address-as-noreplyexamplecom-or--name-address-)

**Webhooks**
- [`verify: svix-id, svix-timestamp or svix-signature is missing`](#verify-svix-id-svix-timestamp-or-svix-signature-is-missing)
- [`verify: svix-timestamp must be a Unix timestamp, in seconds`](#verify-svix-timestamp-must-be-a-unix-timestamp-in-seconds)
- [`verify: svix-timestamp is more than <toleranceMs>ms from now`](#verify-svix-timestamp-is-more-than-tolerancemsms-from-now)
- [`verify: svix-signature does not match — check the secret, and that the body given was the exact raw text Resend sent`](#verify-svix-signature-does-not-match--check-the-secret-and-that-the-body-given-was-the-exact-raw-text-resend-sent)
- [`verify: the signature matched but the body is not JSON — check that the exact raw body was given, not one re-serialized by a framework`](#verify-the-signature-matched-but-the-body-is-not-json--check-that-the-exact-raw-body-was-given-not-one-re-serialized-by-a-framework)
- [`verify: request must be a Request, or { headers, body } with the raw text body`](#verify-request-must-be-a-request-or--headers-body--with-the-raw-text-body)
- [`createResendWebhook: options must be an object, as { secret }`](#createresendwebhook-options-must-be-an-object-as--secret-)
- [`createResendWebhook: secret must be Resend's signing secret, whsec_… — from the endpoint's settings page`](#createresendwebhook-secret-must-be-resends-signing-secret-whsec--from-the-endpoints-settings-page)
- [`createResendWebhook: toleranceMs must be a positive integer`](#createresendwebhook-tolerancems-must-be-a-positive-integer)

**Install and types**
- [`error instanceof MailFailure` is `false`](#error-instanceof-mailfailure-is-false)
- [`TS2322: Type 'string | undefined' is not assignable to type 'string'.`](#ts2322-type-string--undefined-is-not-assignable-to-type-string)
- [`TS2322: Type 'string | null' is not assignable to type 'string'.`](#ts2322-type-string--null-is-not-assignable-to-type-string)

## Sending

### `send: Resend refused the message`

A `MailRefused`, code `MAIL_REFUSED`.

**When:** Resend answered `400`, `413` or `422`: a field it does not accept —
an address in a form it refuses, a header it does not allow, a subject too
long, an attachment it will not carry (a `422` `invalid_attachment`, over
40 MB once encoded in base64 included, a third larger than the files) — or a
`413`, a request too large for what sits in front of the API. Or a `409`
`invalid_idempotent_request`: the message's `idempotencyKey` was already used,
within Resend's 24 hours, for a different message — a key per user rather
than per e-mail, or a template, a variable or a recipient that changed
between two attempts at the same e-mail.

**Why:** Resend will refuse the same message again; retrying it unchanged is
pointless. For a `409`, the first message with that key was taken; this one
was not, and will not be under that key.

**Fix:** read `cause.errorName` and `cause.detail` — Resend's own words:

```ts
import { MailRefused } from '@nxgt/mail';

try {
	await mailer.send(message);
} catch (error) {
	if (error instanceof MailRefused && error.cause instanceof Error) {
		const { status, errorName, detail } = error.cause as Error & {
			status?: number;
			errorName?: string | null;
			detail?: string | null;
		};
		console.warn(status, errorName, detail); // 422 validation_error Invalid `to` field. …
		if (status === 409 && errorName === 'invalid_idempotent_request') {
			// The key already named another message: it is not one key per e-mail.
			console.warn('idempotencyKey reused for a different message');
		}
	}
	throw error;
}
```

`detail` may quote an address: keep it out of logs that must not hold one.

For a message too large (`cause.status` `413`, or a `422` whose `detail`
names the size), sending it again fails again: send the file as a signed
link in the template instead of an attachment.

For an `invalid_idempotent_request`, make the key name one e-mail — derived
from what it is about, the same on every attempt at it — and render that
e-mail the same way on every attempt:

```ts
await mailer.send({ ...message, idempotencyKey: `user-${user.id}` }); // ✗ every e-mail to that user
await mailer.send({ ...message, idempotencyKey: `order-${order.id}/receipt` }); // ✓ this e-mail
```

A message that was meant to be different — a corrected receipt — is a new
e-mail: give it a new key (`order-42/receipt-2`).

### `send: Resend could not take the message`

A `MailFailure`, code `MAIL_FAILED`. **Nothing is known to have been sent**:
Resend answered that it did not take the message, but a `5xx` can come from
a server that accepted it before failing.

**When:** Resend answered with a status that is neither `2xx` nor a refusal:

| `cause.status` | Usually | Fix |
| --- | --- | --- |
| `401` | No key reached Resend | Check the key the process was started with |
| `403` | An invalid or revoked key; a sending domain not verified; a test key sending to someone else than the account's owner | Check the key, and verify the `from` domain in Resend |
| `409` `concurrent_idempotent_requests` | A send with the same `idempotencyKey` is still in progress — a retry, or a second worker, that started before the first attempt finished | Retry later, with the same key: once the first finishes, the retry answers its id |
| `429` | The rate limit or the daily quota | Send less often, or from a queue that spaces the sends |
| `5xx` | Resend is failing | Retry later |

The transport does not retry: a retry is yours to decide, where you can see
it. With an `idempotencyKey`, a retry of the same message within 24 hours is
safe: if the first attempt went through, Resend answers its id and delivers
nothing more.

```ts
import { MailFailure } from '@nxgt/mail';

try {
	await mailer.send({ ...message, idempotencyKey: `order-${order.id}/receipt` });
} catch (error) {
	const errorName = error instanceof MailFailure
		? (error.cause as { errorName?: string | null } | undefined)?.errorName
		: undefined;
	if (errorName === 'concurrent_idempotent_requests') {
		// The first attempt is still running: retry later, with the same key.
	}
	throw error;
}
```

### `send: Resend could not be reached`

A `MailFailure`. **Nothing is known to have been sent**: a connection that
dropped after the request left may have delivered it to Resend.

**When:** `fetch` threw before any answer: DNS, a refused connection, TLS, a
proxy in the way, or a `baseUrl` pointing nowhere. `cause` is the `fetch`
error.

**Fix:** check the network from the process's host
(`curl -I https://api.resend.com`), and `baseUrl` if you set one.

### `send: Resend did not answer within <timeoutMs> ms`

A `MailFailure`. `cause` is the `TimeoutError` that aborted the request.

**When:** no answer within `timeoutMs` (30 seconds by default) — whatever
`fetch` is used: one that ignores the signal is no longer waited for.

**Why:** the request was aborted: Resend may still have accepted the e-mail,
but the transport cannot know, and does not say it was sent.

**Fix:** a slow network or a slow proxy — raise `timeoutMs`, or retry later.
Before retrying, weigh that the first send may have gone through.

### `send: from is missing — give the message a from, or createResendMailer a default one`

A `MailRefused`, thrown before any request.

**When:** the message has no `from`, and the mailer was created without one.

**Fix:** give the mailer a default sender, or the message its own:

```ts
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({
	apiKey: process.env.RESEND_API_KEY ?? '',
	from: { name: 'Acme', address: 'noreply@acme.test' },
});
```

### `send: Resend takes at most 75 tags on one e-mail`

A `MailRefused`, `code: 'MAIL_REFUSED'`.

**When:** `send`, with a message whose `tags` hold more than 75 entries.
Nothing is sent.
**Why:** Resend takes at most 75 tags per e-mail and refuses more; the
transport refuses first, so the request is never made.
**Fix:** keep the tags you filter or group by in Resend's dashboard — a
category, a plan, an account id — and drop the rest:

```ts
const tags = { category: 'receipt', plan: 'enterprise' };
```

### `Resend answered <status> <name>`

The message of the `cause` of a `MailRefused` or a `MailFailure` — for
example `Resend answered 422 validation_error`, or `Resend answered 503` when
the body named no error. See the entry of the error it is the cause of,
above; `cause.detail` holds Resend's own message.

## Batch sending

Every message here is thrown by `mailer.sendBatch(messages)`, Resend's own
implementation — `POST /emails/batch`, up to 100 messages per request, split
into as many requests as it takes. See
[Setting up — sendBatch](guide/setup.md#sendbatch) for the full behaviour,
and [Errors — sendBatch](guide/errors.md#sendbatch) for the table this
section expands.

### `sendBatch: messages must be an array of MailMessage`

A `TypeError`, thrown before anything is attempted.

**When:** `mailer.sendBatch(messages)`, with `messages` that is not an array
— a single message on its own, `undefined`, or a value read from somewhere
without being checked.
**Why:** `sendBatch` answers exactly one result per message, in the same
order; there is nothing to index without a list.
**Fix:** pass a list, even of one:

```ts
const results = await mailer.sendBatch([message]); // not mailer.sendBatch(message)
```

### `sendBatch: from is missing — give the message a from, or createResendMailer a default one`

A `MailRefused`, reported as `{ status: 'refused', error }` for that message
alone, before any request. The rest of the batch is unaffected.

**When:** one of `messages` has no `from`, and the mailer was created without
one.
**Fix:** give the mailer a default sender, or that message its own — same
fix as [`send`'s own](#send-from-is-missing--give-the-message-a-from-or-createresendmailer-a-default-one):

```ts
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({
	apiKey: process.env.RESEND_API_KEY ?? '',
	from: { name: 'Acme', address: 'noreply@acme.test' },
});
```

### `sendBatch: attachments are not supported in a batch send — Resend's /emails/batch refuses them; send this message on its own with send`

A `MailRefused`, reported for that message alone, before any request. The
rest of the batch is unaffected.

**When:** one of `messages` has one or more `attachments`.
**Why:** Resend's `/emails/batch` has no attachments field at all — unlike
the other per-message refusals here, this one is not a limit `send` would
also hit, it is a whole field the batch endpoint does not carry.
**Fix:** send that message on its own, over `send`:

```ts
import type { MailMessage } from '@nxgt/mail';

declare const withAttachment: MailMessage;
declare const rest: readonly MailMessage[];

await mailer.send(withAttachment);
await mailer.sendBatch(rest);
```

### `sendBatch: idempotencyKey is not supported in a batch send — Resend takes one Idempotency-Key per batch request, never one per message; send this message on its own with send`

A `MailRefused`, reported for that message alone, before any request. The
rest of the batch is unaffected.

**When:** one of `messages` carries its own `idempotencyKey`.
**Why:** Resend takes at most one `Idempotency-Key`, per batch *request* —
never one per message inside it — and `sendBatch` sends no `Idempotency-Key`
header for a batch request at all, so a key on one of several messages
cannot be honoured for that message alone. Retrying `sendBatch` itself, with
no such header, can duplicate every message that already went through.
**Fix:** send that message on its own, over `send`, where its key is
honoured:

```ts
import type { MailMessage } from '@nxgt/mail';

declare const withKey: MailMessage;
declare const rest: readonly MailMessage[];

await mailer.send(withKey); // idempotencyKey honoured here
await mailer.sendBatch(rest);
```

### `sendBatch: Resend takes at most 75 tags on one e-mail`

A `MailRefused`, reported for that message alone, before any request. The
rest of the batch is unaffected.

**When:** one of `messages` has more than 75 entries in `tags`.
**Why:** the same limit as [`send`'s own](#send-resend-takes-at-most-75-tags-on-one-e-mail).
**Fix:** keep the tags you filter or group by in Resend's dashboard, and drop
the rest.

### `sendBatch: Resend refused the batch request`

A `MailRefused`. **Every message of the request this batch fell into is
reported this way** — the same `error`, even though only one of up to 100
messages may be at fault. Resend answers the request as a whole, never one
message at a time, so `sendBatch` cannot single out which one.

**When:** Resend answered `400`, `413` or `422` for a chunk of up to 100
messages — the same statuses as [`send: Resend refused the message`](#send-resend-refused-the-message),
for the request as a whole.
**Why:** a malformed message anywhere in that request, once past the
per-message checks above, or a request too large for what sits in front of
the API.
**Fix:** read `cause.errorName` and `cause.detail`, as with `send`. A chunk
of 100 is harder to narrow down than one message: keep chunks smaller, or
send the suspect message on its own first, to find it:

```ts
const results = await mailer.sendBatch(messages);
results.forEach((result, index) => {
	if (result.status === 'refused') console.warn(messages[index]?.subject, result.error.cause);
});
```

A request further along in the same call that Resend does accept still
runs, and is reported on its own — only the messages of the refused request
are affected.

### `sendBatch: Resend could not take the batch request`

A `MailFailure`. **Every message of that request is reported `failed`** —
nothing is known to have been sent for any of them, the same as
[`send: Resend could not take the message`](#send-resend-could-not-take-the-message).

**When:** Resend answered a chunk's request with any status that is neither
`2xx` nor a refusal — `401`, `403`, `429`, a `5xx`.
**Fix:** the same table as `send`'s own failure — a key problem, a rate
limit, an outage. A request further along that Resend does accept still
runs, and is reported on its own.

### `sendBatch: Resend did not answer within <timeoutMs> ms`

A `MailFailure`. **Every message of that request's chunk is reported
`failed`.** `cause` is the `TimeoutError` that aborted the request — the
same as [`send: Resend did not answer within <timeoutMs> ms`](#send-resend-did-not-answer-within-timeoutms-ms),
for the whole chunk rather than one message.

**When:** no answer within `timeoutMs` for one of the requests `sendBatch`
made.
**Fix:** a slow network or a slow proxy — raise `timeoutMs`, or retry the
messages reported `failed` later. Before retrying, weigh that the chunk may
have gone through all the same.

### `sendBatch: Resend could not be reached`

A `MailFailure`. **Every message of that request's chunk is reported
`failed`** — the same as [`send: Resend could not be reached`](#send-resend-could-not-be-reached),
for the whole chunk.

**When:** `fetch` threw before any answer, for one of the requests
`sendBatch` made: DNS, a refused connection, TLS, a proxy in the way.
**Fix:** check the network from the process's host, and retry the messages
reported `failed` — a chunk further along in the same call that did reach
Resend is reported on its own, and is unaffected.

## Cancelling and rescheduling

Every message here is thrown by `mailer.cancel(messageId)` or
`mailer.reschedule(messageId, scheduledAt)`, against a message `send`
scheduled ahead with `scheduledAt` and has not sent yet. `messageId` is never
printed: it is Resend's own id, but it is still a credential — one that can
cancel or reschedule someone else's send. See
[Setting up — Cancel and reschedule](guide/setup.md#cancel-and-reschedule)
and [Errors — Cancel and reschedule](guide/errors.md#cancel-and-reschedule).

### `cancel: messageId must be the id send answered`

A `TypeError`, thrown before any request.

**When:** `mailer.cancel(messageId)`, with `messageId` missing, not a
string, or an empty string.
**Why:** `messageId` must be the id `send` answered — `SentMail.messageId` —
never an id of your own (an order id, a queue job id): Resend never held any
other id pending.
**Fix:** pass the id `send` answered, checked not `null` first:

```ts
const { messageId } = await mailer.send(message);
if (messageId === null) throw new Error('Resend answered with no id'); // rare

await mailer.cancel(messageId);
```

### `reschedule: messageId must be the id send answered`

A `TypeError`, thrown before any request. The same check as
[`cancel`'s own](#cancel-messageid-must-be-the-id-send-answered), for
`reschedule`.

### `reschedule: scheduledAt must be a valid Date`

A `MailRefused`, thrown before any request.

**When:** `mailer.reschedule(messageId, scheduledAt)`, with a `scheduledAt`
that is not a `Date` — an ISO string, a number — or is an invalid `Date`
(`new Date(Number.NaN)`).
**Why:** the same rule `checkScheduledAt` holds `send`'s own `scheduledAt`
to, applied here too — see
[`send: scheduledAt must be a valid Date`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#send-scheduledat-must-be-a-valid-date).
**Fix:** pass a `Date`:

```ts
await mailer.reschedule(messageId, new Date('2027-01-01T09:00:00.000Z'));
```

### `reschedule: scheduledAt is in the past`

A `MailRefused`, thrown before any request.

**When:** `scheduledAt` is more than about a minute earlier than now.
**Why:** the same rule as
[`send: scheduledAt is in the past`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#send-scheduledat-is-in-the-past):
a reschedule into the past is not a schedule, it is a mistake.
**Fix:** check the moment before rescheduling.

### `reschedule: scheduledAt is more than 30 days ahead — Resend's own limit`

A `MailRefused`, thrown before any request.

**When:** `scheduledAt` is more than 30 days from now.
**Why:** Resend's own limit on a scheduled send — the same one `send`'s own
`scheduledAt` is held to; see
[`send: scheduledAt is more than 30 days ahead`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#send-scheduledat-is-more-than-30-days-ahead--resends-own-limit).
**Fix:** reschedule closer, or hold the new date yourself and reschedule
again once you are within the window.

### `cancel: Resend has no scheduled message with this id — it may already have been cancelled, or the id is wrong`

A `MailScheduleRefused` from the `@nxgt/mail` peer, code `UNKNOWN_ID`.

**When:** Resend answered `404` for `mailer.cancel(messageId)`.
**Why:** Resend does not document precisely what it answers for an id it
never held pending — this reads a `404` as `UNKNOWN_ID`, the only such
answer observed. Either the message was already cancelled, or `messageId`
never named a message Resend has pending.
**Fix:** there is nothing left to cancel — treat it the same as a successful
cancel:

```ts
import { MailScheduleRefused } from '@nxgt/mail';

try {
	await mailer.cancel(messageId);
} catch (error) {
	if (error instanceof MailScheduleRefused && error.code === 'UNKNOWN_ID') {
		return; // already cancelled, or never a valid id — nothing to do
	}
	throw error;
}
```

### `reschedule: Resend has no scheduled message with this id — it may already have been cancelled, or the id is wrong`

A `MailScheduleRefused` from the `@nxgt/mail` peer, code `UNKNOWN_ID`. The
same cause and fix as
[`cancel`'s own](#cancel-resend-has-no-scheduled-message-with-this-id--it-may-already-have-been-cancelled-or-the-id-is-wrong),
for `reschedule`.

### `cancel: Resend refused to cancel this message — it has already been sent, and is no longer scheduled`

A `MailScheduleRefused` from the `@nxgt/mail` peer, code `ALREADY_SENT`.

**When:** Resend answered `400` for `mailer.cancel(messageId)`.
**Why:** the message went out before the cancel request reached Resend —
this reads a `400` as `ALREADY_SENT`, the only such answer observed.
**Fix:** nothing to do — the e-mail was already sent, which is what a
cancel would have prevented:

```ts
import { MailScheduleRefused } from '@nxgt/mail';

try {
	await mailer.cancel(messageId);
} catch (error) {
	if (error instanceof MailScheduleRefused && error.code === 'ALREADY_SENT') {
		return; // it already went out
	}
	throw error;
}
```

### `reschedule: Resend refused to reschedule this message — it has already been sent, and is no longer scheduled`

A `MailScheduleRefused` from the `@nxgt/mail` peer, code `ALREADY_SENT`. The
same cause and fix as
[`cancel`'s own](#cancel-resend-refused-to-cancel-this-message--it-has-already-been-sent-and-is-no-longer-scheduled),
for `reschedule`.

### `cancel: Resend could not take the request`

A `MailFailure`. **Nothing about the cancel is known to have taken effect.**

**When:** Resend answered `mailer.cancel(messageId)` with any status that is
neither `2xx` nor `404` nor `400` — `401`, `403`, `429`, a `5xx`.
**Fix:** the same table as [`send: Resend could not take the message`](#send-resend-could-not-take-the-message)
— a key problem, a rate limit, an outage. Retry later; whether the message
is still worth cancelling by then is yours to decide.

### `reschedule: Resend could not take the request`

A `MailFailure`. The same cause and fix as
[`cancel`'s own](#cancel-resend-could-not-take-the-request), for
`reschedule`.

### `cancel: Resend did not answer within <timeoutMs> ms` / `cancel: Resend could not be reached`

Both a `MailFailure`. **Nothing about the cancel is known to have taken
effect** — the same as [`send`'s own](#send-resend-did-not-answer-within-timeoutms-ms).

**When:** no answer within `timeoutMs` for `mailer.cancel(messageId)`, or
`fetch` threw before any answer — DNS, a refused connection, TLS.
**Fix:** check the network, or raise `timeoutMs`; retry later, weighing that
the cancel may have taken effect all the same.

### `reschedule: Resend did not answer within <timeoutMs> ms` / `reschedule: Resend could not be reached`

Both a `MailFailure`. The same cause and fix as
[`cancel`'s own](#cancel-resend-did-not-answer-within-timeoutms-ms--cancel-resend-could-not-be-reached),
for `reschedule`.

## Wiring

### `createResendMailer: options must be an object, as { apiKey }`

A `TypeError`. `createResendMailer` was called with nothing, or with the key
itself:

```ts
createResendMailer(process.env.RESEND_API_KEY ?? ''); // ✗
createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '' }); // ✓
```

### `createResendMailer: apiKey must be a Resend API key — is the environment variable set?`

A `TypeError`. `apiKey` is missing, empty or blank — most often an environment
variable that is not set where the process runs. The value is never printed.

**Fix:** set `RESEND_API_KEY` for that process (a deployment's secrets, a
`.env` the process actually loads).

### `createResendMailer: apiKey holds whitespace — trim the value it was read from`

A `TypeError`. The key holds a space or a line break — a key read from a file
or a secret mount keeps its final line break. Sent as is, every request would
fail.

```ts
import { readFileSync } from 'node:fs';
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({ apiKey: readFileSync('/run/secrets/resend', 'utf8').trim() });
```

### `createResendMailer: baseUrl must be an http: or https: URL`

A `TypeError`. `baseUrl` is not a string, or has no scheme:

```ts
createResendMailer({ apiKey, baseUrl: 'api.resend.com' }); // ✗
createResendMailer({ apiKey, baseUrl: 'https://api.resend.com' }); // ✓ — the default
```

### `createResendMailer: fetch must be a function`

A `TypeError`. `fetch` was given something that is not a function — a URL, or
an agent meant for another option. Pass a function `(url, init) =>
Promise<Response>`, or leave it out for the global `fetch`.

### `createResendMailer: timeoutMs must be a positive integer`

A `TypeError`. `timeoutMs` is `0`, negative, a fraction or not a number. It is
milliseconds: `10_000` for ten seconds.

### `createResendMailer: timeoutMs must be at most 2147483647 — a longer timer fires at once`

A `TypeError`. `timeoutMs` is above 2³¹ − 1 milliseconds, about 24.8 days —
often a value in microseconds, or a duration meant as "never". A timer that
long fires at once, and every send would time out.

**Fix:** a timeout in milliseconds, far below the bound; leave it out for the
default, 30 seconds:

```ts
createResendMailer({ apiKey, timeoutMs: Number.MAX_SAFE_INTEGER }); // ✗
createResendMailer({ apiKey, timeoutMs: 60_000 }); // ✓ — one minute
```

### `createResendMailer: from must be an e-mail address, as noreply@example.com or { name, address }`

A `TypeError`. The default `from` is not an address. Most often, a name
written inside the string:

```ts
createResendMailer({ apiKey, from: 'Acme <noreply@acme.test>' }); // ✗
createResendMailer({ apiKey, from: { name: 'Acme', address: 'noreply@acme.test' } }); // ✓
```

## Webhooks

Every message here is thrown by `createResendWebhook(options).verify(request)`,
from `@nxgt/mail-resend/webhooks`. See [Webhooks](guide/webhooks.md) for
setting up the endpoint.

### `verify: svix-id, svix-timestamp or svix-signature is missing`

A `MailWebhookRefused`, code `INVALID_SIGNATURE`.

**When:** `request` did not carry one of Resend's three headers.
**Why:** a proxy, a gateway or a framework's router stripped it — some strip
anything starting with an underscore-free custom prefix, or lower-case only
a subset of headers before your handler sees them.
**Fix:** forward every header Resend sent, unchanged, to the handler that
calls `verify`; check with a raw request log if you cannot tell which layer
drops it.

### `verify: svix-timestamp must be a Unix timestamp, in seconds`

A `MailWebhookRefused`, code `INVALID_SIGNATURE`.

**When:** the `svix-timestamp` header was not all digits.
**Why:** something rewrote it — a proxy that reformats headers, or a
hand-built test request with an ISO string instead of Resend's Unix seconds.
**Fix:** pass the header exactly as received.

### `verify: svix-timestamp is more than <toleranceMs>ms from now`

A `MailWebhookRefused`, code `EXPIRED_TIMESTAMP`.

**When:** the timestamp sits further from the current time than
`toleranceMs` (default 5 minutes), either in the past or the future.
**Why:** most often clock skew between your server and real time — rarer, a
replayed or very late-delivered request.
**Fix:** check your server's clock (NTP) first. If the skew is genuine and
small, widen `toleranceMs`; do not widen it to work around a webhook queue
that is minutes behind — fix the backlog instead, since a wide tolerance
also widens the window a captured request could be replayed in.

### `verify: svix-signature does not match — check the secret, and that the body given was the exact raw text Resend sent`

A `MailWebhookRefused`, code `INVALID_SIGNATURE`.

**When:** none of the `v1,…` signatures in `svix-signature` matched what
`options.secret` computes over `${svix-id}.${svix-timestamp}.${body}`.
**Why:** almost always one of two things: the wrong secret (a different
endpoint's, or a stale one after rotation with no overlap), or `body` is not
the exact raw text Resend sent — parsed to JSON and re-serialized, trimmed,
re-encoded, or read after another middleware already consumed the stream.
**Fix:**

```ts
// ✗ — body already JSON, re-stringified: key order and spacing can differ
const body = JSON.stringify(await request.json());

// ✓ — the raw text, or the Request itself
const body = await request.text();
const event = await webhook.verify({ headers: request.headers, body });
// or, simplest:
const event = await webhook.verify(request);
```

### `verify: the signature matched but the body is not JSON — check that the exact raw body was given, not one re-serialized by a framework`

A `MailWebhookRefused`, code `INVALID_SIGNATURE`.

**When:** the signature matched, but `JSON.parse(body)` failed.
**Why:** a body that happens to still verify (identical bytes) but is not
JSON at all is almost never real: check the request came from Resend's own
IPs, and that nothing upstream (a proxy re-encoding the body while somehow
preserving the exact bytes the signature covers) is doing something unusual.
**Fix:** log the raw body once, from a trusted environment, and compare it
byte for byte with what Resend's dashboard shows was sent for that delivery.

### `verify: request must be a Request, or { headers, body } with the raw text body`

A bare `TypeError`.

**When:** `request` was neither a `Request` nor an object with a string
`body` and an object `headers`.
**Why:** a wiring mistake — often `{ headers, body: await request.json() }`,
whose `body` is an object, not the raw text.
**Fix:** pass the `Request`, or `{ headers, body: await request.text() }`.

### `createResendWebhook: options must be an object, as { secret }`

A bare `TypeError`, at wiring.

### `createResendWebhook: secret must be Resend's signing secret, whsec_… — from the endpoint's settings page`

A bare `TypeError`, at wiring.

**When:** `secret` was missing, empty, or did not start with `whsec_`.
**Fix:** copy the **signing secret** from the webhook endpoint's settings
page in Resend's dashboard — not the API key (`re_…`), a different
credential for a different purpose.

### `createResendWebhook: toleranceMs must be a positive integer`

A bare `TypeError`, at wiring. `toleranceMs` is milliseconds, greater than
zero.

## Install and types

### `error instanceof MailFailure` is `false`

Two copies of `@nxgt/mail` are installed, and the transport throws the other
one's class. `@nxgt/mail` is a **peer** of this package: list it in your own
`package.json`, in a range this package accepts, and install again. `bun pm ls
@nxgt/mail` (or `npm ls @nxgt/mail`) should show one version.

### `TS2322: Type 'string | undefined' is not assignable to type 'string'.`

On `apiKey: process.env.RESEND_API_KEY`. Decide what an unset variable means
where you read it; `?? ''` makes it a `TypeError` at start-up:

```ts
const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '' });
```

### `TS2322: Type 'string | null' is not assignable to type 'string'.`

`messageId` is `string | null`: an answer may carry no id, and an absence is
`null`. Decide what an absent id means where you read it:

```ts
const { messageId } = await mailer.send(message);
const reference = messageId ?? 'none';
```
