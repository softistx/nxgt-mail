# Errors

`send` resolves only once Resend has answered `2xx`. Otherwise it rejects with
one of the two classes of its `@nxgt/mail` peer — this package defines no
error class, so `error instanceof MailFailure` holds whichever transport the
application wires:

- **`MailRefused`** (`code: 'MAIL_REFUSED'`) — Resend refused the message
  itself. Sending it again unchanged fails again.
- **`MailFailure`** (`code: 'MAIL_FAILED'`) — Resend could not take it:
  unreachable, too slow, rate-limited, or the key refused. Nothing is known
  to have been sent: after a timeout or a dropped connection, Resend may have
  accepted it all the same.

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

## Which answer is which

Resend answers an error as `{ statusCode, name, message }`:

| Resend answers | Typical `name` | Throws |
| --- | --- | --- |
| `400` | `validation_error` | `MailRefused` |
| `413` | — (not in Resend's reference: a request too large for what sits in front of the API; refused, as a resend would fail again) | `MailRefused` |
| `422` | `validation_error`, `missing_required_field`, `invalid_attachment` | `MailRefused` |
| `409` | `invalid_idempotent_request` — the `idempotencyKey` was already used, within 24 hours, for a different message | `MailRefused` |
| `409` | `concurrent_idempotent_requests` — a send with the same key is still in progress | `MailFailure` |
| `401`, `403` | `missing_api_key`, `invalid_api_key`, an unverified domain | `MailFailure` |
| `429` | `rate_limit_exceeded`, `daily_quota_exceeded` | `MailFailure` |
| `5xx` | `internal_server_error` | `MailFailure` |
| any other status | — | `MailFailure` |
| no answer: DNS, a refused connection, TLS | — | `MailFailure` — `send: Resend could not be reached` |
| no answer within `timeoutMs` | — | `MailFailure` — `send: Resend did not answer within <timeoutMs> ms` |

A `401` or `403` is a failure although it is a `4xx`: a bad key or an
unverified domain refuses every message alike. It is the wiring that is
wrong, not the message.

A `409` is decided by its `name`. `invalid_idempotent_request` is a refusal:
the key names another e-mail, and sending this one again under it fails
again — give it its own key. `concurrent_idempotent_requests` is a failure:
the first send with that key has not finished, and a retry later answers
its id. See [Setting up — the idempotency key](setup.md#the-idempotency-key).

```ts
import { MailError, MailRefused } from '@nxgt/mail';

try {
	await mailer.send(message);
} catch (error) {
	const cause = error instanceof MailError ? (error.cause as { status?: number; errorName?: string | null }) : undefined;
	if (error instanceof MailRefused && cause?.errorName === 'invalid_idempotent_request') {
		// a bug in how keys are derived: two different e-mails were given the same one
	}
	throw error;
}
```

## What `cause` holds

For an answer, `cause` is a plain `Error` — the transport defines no class —
carrying what Resend said:

| Property | Type | Example |
| --- | --- | --- |
| `message` | `string` | `Resend answered 422 validation_error` |
| `status` | `number` | `422` |
| `errorName` | `string \| null` | `'validation_error'`, or `null` when the body had none |
| `detail` | `string \| null` | Resend's own `message`, or `null` |

For no answer, `cause` is the `fetch` error — a `TypeError` from the runtime,
or the `TimeoutError` of the timeout.

```ts
import { MailError } from '@nxgt/mail';

try {
	await mailer.send(message);
} catch (error) {
	if (error instanceof MailError) {
		const cause = error.cause as { status?: number; errorName?: string | null };
		logger.warn({ code: error.code, status: cause.status, resend: cause.errorName }, error.message);
	}
	throw error;
}
```

Neither message holds a value: never the key, an address, a subject, or what
Resend said. Resend's own message can quote an address, so it is kept on
`detail` and never put in a `message` — log `detail` only where your logs may
hold one.

## The messages

| `message` | Class | When |
| --- | --- | --- |
| `send: Resend refused the message` | `MailRefused` | A `400`, `413` or `422`, or a `409 invalid_idempotent_request` |
| `send: Resend could not take the message` | `MailFailure` | Any other answer that is not `2xx` — a `409 concurrent_idempotent_requests` included |
| `send: Resend could not be reached` | `MailFailure` | `fetch` threw |
| `send: Resend did not answer within <timeoutMs> ms` | `MailFailure` | The timeout aborted the request |
| `send: from is missing — give the message a from, or createResendMailer a default one` | `MailRefused` | A message without `from`, on a mailer without a default. No request is made |
| `send: Resend takes at most 75 tags on one e-mail` | `MailRefused` | A message with more than 75 `tags`, Resend's limit. No request is made |
| `send: …` from `checkMessage` | `MailRefused` | A message no transport hands over — see [`@nxgt/mail`'s troubleshooting](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#sending) |

## sendBatch

`sendBatch` never throws for a message's own outcome — each
[`MailBatchResult`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md#sending-many-at-once--sendbatch)
carries `refused` or `failed` instead, its `error` one of the same two
classes `send` throws. It still throws directly for a mistake made before
any message is looked at:

| `message` | Class | When |
| --- | --- | --- |
| `sendBatch: messages must be an array of MailMessage` | `TypeError` | `messages` is not an array. Before anything is attempted |

Per message, checked before any request goes out — reported `refused`, never
reaching Resend:

| `message` | Class | When |
| --- | --- | --- |
| `sendBatch: …` from `checkMessage` | `MailRefused` | The same refusals `send` makes — see [`@nxgt/mail`'s troubleshooting](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#sending) |
| `sendBatch: from is missing — give the message a from, or createResendMailer a default one` | `MailRefused` | No `from`, on the message or as a default |
| `sendBatch: attachments are not supported in a batch send — Resend's /emails/batch refuses them; send this message on its own with send` | `MailRefused` | The message has an `attachment` — Resend's batch endpoint does not take them |
| `sendBatch: idempotencyKey is not supported in a batch send — Resend takes one Idempotency-Key per batch request, never one per message; send this message on its own with send` | `MailRefused` | The message has its own `idempotencyKey` — Resend takes one `Idempotency-Key` per batch *request*, never one per message |
| `sendBatch: Resend takes at most 75 tags on one e-mail` | `MailRefused` | More than 75 `tags` on the message, Resend's limit |

Per **request** of up to 100 messages — applied alike to every message the
request carried, because Resend answers the request as a whole, never one
message at a time:

| `message` | Class | When |
| --- | --- | --- |
| `sendBatch: Resend refused the batch request` | `MailRefused` | Resend answers `400`, `413` or `422` for the request |
| `sendBatch: Resend could not take the batch request` | `MailFailure` | Resend answers with any other non-`2xx` status |
| `sendBatch: Resend could not be reached` | `MailFailure` | `fetch` threw |
| `sendBatch: Resend did not answer within <timeoutMs> ms` | `MailFailure` | The timeout aborted the request |

And on one message alone, when Resend's own `2xx` answer for the request did
not include it — a malformed answer, not one this transport has seen from
Resend itself:

| `message` | Class | When |
| --- | --- | --- |
| `sendBatch: Resend's batch answer did not include this message` | `MailFailure` | The request answered `2xx`, but `data` held fewer entries than the chunk sent |

```ts
import type { MailMessage } from '@nxgt/mail';
import type { ResendMailer } from '@nxgt/mail-resend';

declare const mailer: ResendMailer;
declare const messages: readonly MailMessage[];

const results = await mailer.sendBatch(messages);
results.forEach((result, index) => {
	if (result.status === 'sent') return;
	// result.status is 'refused' or 'failed'; result.error is a MailRefused or a MailFailure
	console.error(messages[index]?.subject, result.error.code, result.error.message);
});
```

## Cancel and reschedule

`cancel` and `reschedule` refuse with `@nxgt/mail`'s `MailScheduleRefused` —
not a `MailRefused` or a `MailFailure` — when Resend's answer names a problem
with the *id* rather than the request itself. Resend does not document
precisely what it answers for an id it already sent, or one it never held
pending: this reads a `404` as `UNKNOWN_ID`, and a `400` as `ALREADY_SENT`,
the only two answers observed for either endpoint:

```ts
import { MailScheduleRefused } from '@nxgt/mail';
import type { ResendMailer } from '@nxgt/mail-resend';

declare const mailer: ResendMailer;
declare const messageId: string; // send answered { messageId }, checked not null
declare const logger: { warn(fields: Record<string, unknown>, message: string): void };

try {
	await mailer.cancel(messageId);
} catch (error) {
	if (error instanceof MailScheduleRefused) {
		logger.warn({ code: error.code }, error.message); // 'UNKNOWN_ID' or 'ALREADY_SENT'
		return;
	}
	throw error;
}
```

| `message` | Class | `code` | When |
| --- | --- | --- | --- |
| `cancel: messageId must be the id send answered` | `TypeError` | — | `messageId` is not a non-empty string. Before any request |
| `reschedule: messageId must be the id send answered` | `TypeError` | — | Same, for `reschedule` |
| `reschedule: scheduledAt must be a valid Date` | `MailRefused` | — | `scheduledAt` is not a `Date`, or an invalid one. Before any request |
| `reschedule: scheduledAt is in the past` | `MailRefused` | — | Earlier than now, past a small clock-skew tolerance. Before any request |
| `reschedule: scheduledAt is more than 30 days ahead — Resend's own limit` | `MailRefused` | — | Too far in the future — the same limit `send`'s own `scheduledAt` is held to. Before any request |
| `cancel: Resend has no scheduled message with this id — it may already have been cancelled, or the id is wrong` | `MailScheduleRefused` | `UNKNOWN_ID` | Resend answers `404` |
| `reschedule: Resend has no scheduled message with this id — it may already have been cancelled, or the id is wrong` | `MailScheduleRefused` | `UNKNOWN_ID` | Same, for `reschedule` |
| `cancel: Resend refused to cancel this message — it has already been sent, and is no longer scheduled` | `MailScheduleRefused` | `ALREADY_SENT` | Resend answers `400` |
| `reschedule: Resend refused to reschedule this message — it has already been sent, and is no longer scheduled` | `MailScheduleRefused` | `ALREADY_SENT` | Same, for `reschedule` |
| `cancel: Resend could not take the request` | `MailFailure` | — | Any other non-`2xx` status |
| `reschedule: Resend could not take the request` | `MailFailure` | — | Same, for `reschedule` |
| `cancel: Resend could not be reached` / `reschedule: Resend could not be reached` | `MailFailure` | — | `fetch` threw |
| `cancel: Resend did not answer within <timeoutMs> ms` / `reschedule: Resend did not answer within <timeoutMs> ms` | `MailFailure` | — | The timeout aborted the request |

`messageId` is never printed in a message: it is Resend's own id, but it is
still a credential — one that can cancel or reschedule someone else's send —
so it is kept off every error the same way an address or a key is.

## Wiring — a `TypeError`

A bad option is a mistake in how the application was put together, thrown
when `createResendMailer` is called, never at the first send. No message
prints the value:

| `message` | When |
| --- | --- |
| `createResendMailer: options must be an object, as { apiKey }` | `createResendMailer()`, or the key passed on its own |
| `createResendMailer: apiKey must be a Resend API key — is the environment variable set?` | No `apiKey`, an empty or a blank one |
| `createResendMailer: apiKey holds whitespace — trim the value it was read from` | A key with a space or a line break in it |
| `createResendMailer: baseUrl must be an http: or https: URL` | `baseUrl` without its scheme, or not a string |
| `createResendMailer: fetch must be a function` | `fetch` that is not a function |
| `createResendMailer: timeoutMs must be a positive integer` | `0`, a negative number, a fraction |
| `createResendMailer: timeoutMs must be at most 2147483647 — a longer timer fires at once` | A `timeoutMs` above 2³¹ − 1 ms, about 24.8 days |
| `createResendMailer: from must be an e-mail address, as noreply@example.com or { name, address }` | A default `from` that is not an address — `'Acme <noreply@acme.test>'` included |

## See also

- [Troubleshooting](../troubleshooting.md) — each message, its cause and its
  fix.
- [`@nxgt/mail` — sending](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md)
  — the errors, from the caller's side.
