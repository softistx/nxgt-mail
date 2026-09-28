---
"@nxgt/mail": minor
---

`withRetry`'s options type, `RetryOptions`, is renamed to `MailRetryOptions` — `@nxgt/httpyz` exports its own `RetryOptions`, colliding for a project importing both. The old name is kept as a `@deprecated` type alias of the same shape (no behaviour change), removed in 1.0.
