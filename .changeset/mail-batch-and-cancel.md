---
"@nxgt/mail": minor
---

`sendBatch(mailer, messages)`: sends many messages and answers one
`MailBatchResult` per message, in the same order — `{ status: 'sent',
sentMail }`, `{ status: 'refused', error }` or `{ status: 'failed', error }`.
Unlike `send`, a batch never throws for one message's own outcome: nothing is
silently dropped, and one bad message never hides what happened to the
others. Every message is checked with `checkMessage` before any of them is
sent. `Mailer` gains an optional `sendBatch` a transport implements to use
its provider's own batching (Resend's `POST /emails/batch`); `sendBatch(mailer,
messages)` calls it when present, and otherwise sends each message in turn
over `send` — every `Mailer`, including a third-party one written before this
existed, works with it. `withRetry` passes a `sendBatch` through untouched
(no retry, no idempotency key added); `withTelemetry` gives it its own span,
`mail.sendBatch`, with a count of `sent`, `refused` and `failed` messages.

`checkScheduledAt(scheduledAt, where?)` is now exported, so a provider's own
`reschedule` can hold a new `scheduledAt` to the same rule `send` does.
`MailScheduleRefused` (codes `ALREADY_SENT`, `UNKNOWN_ID`) is what a
provider-specific action against a message scheduled ahead — Resend's
`cancel` and `reschedule`, from `@nxgt/mail-resend` — refuses with: defined
here, not in the transport, for the same reason `MailWebhookRefused` is.
