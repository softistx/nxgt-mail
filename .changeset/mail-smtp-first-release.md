---
"@nxgt/mail-smtp": minor
---

The first release: an SMTP transport for `@nxgt/mail`, on the `nodemailer` you install.

- `createSmtpMailer({ transporter, from })`: every SMTP option is nodemailer's, set where you create the transporter. Each message is checked as every transport checks it, a name is quoted so it names one recipient, and nothing is read from a file or a URL.
- A permanent `5xx` on the recipients or the content is a `MailRefused`; an unreachable server, a timeout, a `4xx`, refused credentials or a refused sender is a `MailFailure`, nodemailer's error on `cause`. Some recipients refused while others were accepted throws too. The classes are `@nxgt/mail`'s, so `instanceof` holds.
- The transport tries once; a retry is the caller's decision. It passes the `@nxgt/mail/conformance` suite against a local SMTP server.
