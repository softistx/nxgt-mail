---
"@nxgt/mail-resend": minor
---

Scheduled send: a message's `scheduledAt` is sent as Resend's `scheduled_at`, ISO 8601. Resend still answers an id right away; the e-mail itself goes out later. The `@nxgt/mail` peer moves to `^0.7.0`: upgrade `@nxgt/mail` with it.
