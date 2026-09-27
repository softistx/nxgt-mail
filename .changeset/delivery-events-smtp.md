---
"@nxgt/mail-smtp": patch
---

The `@nxgt/mail` peer moves to `^0.8.0`: upgrade `@nxgt/mail` with it. No change here: SMTP has no webhook of its own, so it maps no delivery events — what happened after the hand-over is in the receiving MTA's own logs, or comes back as a DSN (delivery status notification) e-mail to the envelope sender, out of scope. The docs say so.
