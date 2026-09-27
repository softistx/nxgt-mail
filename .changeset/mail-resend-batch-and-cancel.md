---
"@nxgt/mail-resend": minor
---

`createResendMailer(...)` now answers a `sendBatch`, a `cancel` and a
`reschedule`, beside `send`.

`sendBatch(messages)` calls Resend's `POST /emails/batch` — up to 100
messages per request (Resend's own limit); above it, split into as many
requests as it takes. Every message is checked with `checkMessage` first, and
two things `send` takes are refused in a batch instead, each on its own
message, the rest unaffected: an attachment (Resend's batch does not support
them yet) and a message's own `idempotencyKey` (Resend takes one
`Idempotency-Key` per batch request, in the header, never one per message —
none is sent for a batch request at all). A request of up to 100 that Resend
refuses, or cannot be reached for, reports every message in it the same way —
`refused` or `failed` — since Resend answers the whole request as one; a
later request still runs, and is reported on its own.

`cancel(messageId)` calls Resend's `POST /emails/{id}/cancel`, to stop a
message `send` scheduled ahead before it goes out. `reschedule(messageId,
scheduledAt)` calls its `PATCH /emails/{id}`, to move a scheduled message to a
new time, held to the same 30-day and clock-skew rule as `send`. Both refuse
with `@nxgt/mail`'s `MailScheduleRefused` — code `UNKNOWN_ID` for an id
Resend does not hold pending, `ALREADY_SENT` for one it already sent — and
throw `MailFailure` for anything else, Resend's answer as the `cause`.
