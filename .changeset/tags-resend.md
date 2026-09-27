---
"@nxgt/mail-resend": minor
---

Tags: a message's `tags` are sent as Resend's `tags`, a list of `{ name, value }`, to group sends in its dashboard and webhooks. More than 75, Resend's limit, is refused with `MailRefused` — `send: Resend takes at most 75 tags on one e-mail` — before anything is sent.
