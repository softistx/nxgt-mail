---
"@nxgt/mail-smtp": minor
---

Accepts `@nxgt/mail` 0.3, whose messages can carry an `idempotencyKey`. SMTP has no idempotency, so the transport ignores the key: a message sent twice is delivered twice. The `@nxgt/mail` peer moves to `^0.3.0`.
