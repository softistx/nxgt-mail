---
"@nxgt/mail": minor
---

`withRetry(mailer, options)` wraps a `Mailer` so a `MailFailure` (a transient
outage) is retried — exponential backoff with full jitter, `attempts`,
`baseDelayMs` and `maxDelayMs` configurable, an optional `AbortSignal` — while
a `MailRefused` never is: sending it again fails again. A message with no
`idempotencyKey` gets one, generated once for the logical send and reused on
every retry, so a transport that dedupes (Resend) delivers it once; a caller's
own key is kept as is. Once every attempt has failed, the error thrown is the
last `MailFailure`, with `attempts` added. A future transport can set
`retryAfterMs` on the `MailFailure` it throws, honoured instead of the
computed delay — no transport does yet.
