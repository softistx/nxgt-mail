---
"@nxgt/mail-resend": minor
---

Sends attachments: each of a message's `attachments` goes in Resend's `attachments` as `{ filename, content, content_type }`, the bytes in base64 — encoded with no Node built-in, so the transport still runs on an edge runtime. Resend's `path` (a URL it would fetch) is never used. A `413` — a request too large, attachments over Resend's 40 MB after base64 — is now a `MailRefused`, as a `400` or `422` is; it was a `MailFailure`. The `@nxgt/mail` peer moves to `^0.2.0`, the minor with attachments. Passes the thirteen cases of `@nxgt/mail/conformance`.
