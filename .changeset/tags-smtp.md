---
"@nxgt/mail-smtp": patch
---

A message's `tags` are ignored, as `idempotencyKey` is: SMTP has no tags, and nothing names them in the e-mail. The docs say so.
