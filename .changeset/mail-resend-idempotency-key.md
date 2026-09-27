---
"@nxgt/mail-resend": minor
---

Sends a message's `idempotencyKey` as Resend's `Idempotency-Key` header, so a retry the caller makes within Resend's 24 hours answers the first send's id and delivers once. A `409 invalid_idempotent_request` — the key already used for another message — is a `MailRefused`; a `409 concurrent_idempotent_requests` — the same key still in progress — stays a `MailFailure`. An empty `headers` is no longer sent, as an empty `attachments` is not. The `@nxgt/mail` peer moves to `^0.3.0`.
