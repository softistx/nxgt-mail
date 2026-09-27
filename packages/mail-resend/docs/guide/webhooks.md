# Webhooks — delivery events

This page is for `@nxgt/mail-resend/webhooks`: verifying a Resend webhook and
reading what happened to a message after `send` handed it over. If you only
send e-mail, you do not need it.

## Setting up the endpoint

In Resend's dashboard, add a webhook endpoint pointed at your URL, and copy
its **signing secret** (`whsec_…`) — it is shown once. Read it from the
environment the same way as the API key: decide its absence where the
process starts, never at the first `verify`.

```ts
import { createResendWebhook } from '@nxgt/mail-resend/webhooks';

const webhook = createResendWebhook({
	secret: process.env.RESEND_WEBHOOK_SECRET ?? '', // '' is a TypeError at start-up, not a 500 on the first webhook
});
```

`toleranceMs` is the second option, default `300000` (5 minutes) — Svix's own
tolerance, and the one Resend's webhooks are signed under. Widen it only for
a clock genuinely out of sync; narrowing it makes replay harder but a slow
network more likely to fail a legitimate webhook.

## `verify` — the raw body, always

```ts
const event = await webhook.verify(request); // Request, or { headers, body }
```

Resend signs the **exact bytes** it sent, the way Svix does: `svix-id`,
`svix-timestamp` and `svix-signature`, an HMAC-SHA256 over
`${svix-id}.${svix-timestamp}.${body}` where `body` is the raw request body,
byte for byte. A body a framework has already parsed to JSON and would
re-serialize to verify has very likely changed — a different key order,
different spacing, a trailing newline gone — and the signature no longer
matches nothing that was sent. So `verify` either:

- takes the whole `Request` and reads `request.text()` itself, once — pass it
  before anything else has consumed the body; or
- takes `{ headers, body }` where `body` is the raw text your framework
  already read (`await c.req.text()` in Hono, the string a body-parser gives
  you when it is configured to keep the raw text) — **never** `JSON.parse`d
  and re-stringified, and never `undefined` because a middleware upstream
  already consumed the stream.

`headers` is a `Headers`, or a plain record (Node's own
`IncomingHttpHeaders` included — a header sent twice answers its first
value). Header names are read case-insensitively, as HTTP itself does.

## What `verify` answers

A `MailEvent` from `@nxgt/mail` — `delivered`, `bounced` (with
`bounceType`, `hard` or `soft`), `complained`, `delayed`, or, when Resend's
open/click tracking is on, `opened`/`clicked` (both carrying
`tracking: true`) — or `null` for a Resend event type this package does not
map: `email.sent`, `email.scheduled`, `email.failed`, `email.received`,
`email.suppressed`, and any type Resend adds later. `null` is an answer, not
an error: acknowledge it with `202` and move on.

| Resend's `bounce.type` | `bounceType` |
| --- | --- |
| `Permanent` | `hard` — the address itself is bad; suppress it |
| `Temporary`, `Undetermined`, anything else this package does not recognise | `soft` — never assumed permanent on an unfamiliar code |

`messageId` is `data.email_id` — the same id `send` answered as
`SentMail.messageId` — and `recipient` is `data.to[0]`: Resend lists every
recipient of the message there, and an event is reported once per message, so
in a transactional send (one recipient) this is unambiguous.

**No PII beyond what Resend already sends.** `recipient` is the address
Resend reports, never enriched from your own records. `raw` is Resend's own
payload for the event, untouched — for `clicked` it holds `click.ipAddress`
and `click.userAgent`, and open tracking similarly; read `raw` only when you
have decided you want that data, and never log or persist it without a
reason.

## Errors — `verify` throws only when the request cannot be trusted

```ts
import { MailWebhookRefused } from '@nxgt/mail';

try {
	const event = await webhook.verify(request);
} catch (error) {
	if (error instanceof MailWebhookRefused) {
		// error.code is 'INVALID_SIGNATURE' or 'EXPIRED_TIMESTAMP' — answer 401 either way
	}
	throw error;
}
```

| `code` | When | Fix |
| --- | --- | --- |
| `INVALID_SIGNATURE` | A `svix-id`, `svix-timestamp` or `svix-signature` header is missing | Forward every header Resend sent; do not strip `svix-*` headers upstream |
| `INVALID_SIGNATURE` | None of the signatures in `svix-signature` match | Check `secret` is this endpoint's own, and that `body` is the exact raw text — see above |
| `INVALID_SIGNATURE` | The signature matched but the body did not parse as JSON | Almost certainly the same raw-body mistake: a framework re-serialized it before the signature was computed, so it happened to still verify against different bytes |
| `EXPIRED_TIMESTAMP` | `svix-timestamp` is more than `toleranceMs` from now, either way | A genuine webhook arrives within seconds; investigate before widening the tolerance — a very old timestamp on an otherwise-valid signature is a replayed request |

Both codes mean the same thing to a handler: refuse with `401`, never retry.
A signature is fixed by using the right secret and the exact raw body, or the
request was never a genuine webhook from Resend.

A bad option to `createResendWebhook` (no `secret`, one without the
`whsec_` prefix, a non-positive `toleranceMs`) is a bare `TypeError`, at
start-up — no handler should answer one. A `request` that is neither a
`Request` nor `{ headers, body }` is also a `TypeError`, from `verify`
itself.

## Several signatures — secret rotation

`svix-signature` can hold more than one space-separated `v1,<signature>`,
while Resend rotates the endpoint's secret: `verify` accepts the request the
moment **any** of them matches, so both the old and the new secret's
signature verify during the overlap.

## See also

- [`@nxgt/mail`'s guide to delivery events](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/events.md) —
  the full `MailEvent` shape, and `checkMailEvent` for a second provider's
  mapping.
- [Errors](errors.md) — `send`'s own `MailFailure`/`MailRefused`, unrelated to
  webhook verification.
