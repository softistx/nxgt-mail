---
"@nxgt/mail-resend": minor
---

Sends attachments: each of a message's `attachments` goes in Resend's `attachments` as `{ filename, content, content_type }`, the bytes in base64 — encoded with no Node built-in, so the transport still runs on an edge runtime. Resend's `path` (a URL it would fetch) is never used. Resend answers an attachment over its 40 MB (after base64) with a `422` `invalid_attachment`, already a `MailRefused`; a `413` — a request too large for what sits in front of the API — is now a `MailRefused` too, as a `400` or `422` is; it was a `MailFailure`. The `@nxgt/mail` peer moves to `^0.2.0`, the minor with attachments. Passes the thirteen cases of `@nxgt/mail/conformance`.
