---
"@nxgt/mail": minor
---

Tags: `tags` on a `MailMessage`, a record of names to values, label a send for the provider's dashboard and webhooks, and are never part of the e-mail. `checkMessage` refuses with `MailRefused` tags that are not an object, and a name or value that is not 1 to 256 ASCII letters, digits, `_` or `-` (the rule Resend and Amazon SES share), naming the tag and never the value. The memory mailer keeps them and counts them for an idempotency key; the conformance suite gains `send.tags`: a message with tags is delivered, with no tag written into it.
