---
"@nxgt/mail-resend": patch
"@nxgt/mail-smtp": patch
---

The `@nxgt/mail` peer moves to `^0.9.0`: upgrade `@nxgt/mail` with it. No behaviour change here — `@nxgt/mail`'s `RetryOptions` rename to `MailRetryOptions` (the old name kept as a `@deprecated` alias) does not touch a transport.
