---
"@nxgt/mail": minor
---

The first release: the run-time core of transactional e-mail — a port, its errors, and a renderer for what `maizzle build` wrote.

- The `Mailer` port a transport implements, the `MailMessage` and `Rendered` shapes it sends, and two errors: `MailFailure` (`MAIL_FAILED`) when the transport could not hand the message over, `MailRefused` (`MAIL_REFUSED`) when the message itself was refused. A send resolves once the transport accepted the e-mail, or throws; it never answers `false`. No dependency, no Node built-in.
- `createMemoryMailer()` for tests: an outbox to read (`mailer.sent`), and a next send you can make fail.
- `pickLocale(wanted, supported, fallback)` and `parseAcceptLanguage()`: a stored preference first, then the browser's languages, `fr-CA` matching `fr`, the fallback when nothing does.
- `createMailRenderer` from `@nxgt/mail/renderer`: `mails.render('verify-email', { name, link })` answers `Rendered` from the built files of the recipient's locale, every `{{ placeholder }}` filled and HTML-escaped. A link that is not `http:`, `https:` or `mailto:` is refused; a missing variable, an unknown e-mail or locale throws. Typed with the `MailEmails` a build writes, the same mistakes are compile errors.
- `describeMailer(harness)` from `@nxgt/mail/conformance`, for transport authors: a send answers `SentMail`, an outage throws a `MailFailure`, an e-mail arrives byte for byte, nothing is retried in secret. Runs under bun:test, Vitest or Jest.
