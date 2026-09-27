---
"@nxgt/mail-resend": minor
---

The first release: a Resend transport for `@nxgt/mail`, over `fetch`, with no SDK and no dependency.

- `createResendMailer({ apiKey, from })`: one `POST /emails` per message, no Node built-in, so it runs on an edge runtime too. Each message is checked as every transport checks it, and a name is sent quoted so it names one recipient.
- A `400` or `422` is a `MailRefused`; a bad key, a rate limit, an outage, a network error or a timeout is a `MailFailure`, what Resend answered on `cause`. The classes are `@nxgt/mail`'s, so `instanceof` holds.
- The transport tries once, a `429` included; a retry is the caller's decision. It passes the `@nxgt/mail/conformance` suite against a local server answering as Resend does.
