---
"@nxgt/mail-smtp": minor
---

Scheduled send: SMTP has no way to schedule a send, so a message with `scheduledAt` is refused with `MailRefused` — `send: scheduledAt is not supported — SMTP has no way to schedule a send, and sending it now would be wrong` — rather than sent at once. The `@nxgt/mail` peer moves to `^0.7.0`: upgrade `@nxgt/mail` with it.
