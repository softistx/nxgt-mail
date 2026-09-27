# @nxgt/mail-smtp — documentation

The [README](../README.md) shows that it works; these pages show how, one area
at a time, with an example for every option. The words they use — e-mail,
mailer, transport, hand-over, refusal, failure — are defined once, in the
[vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md).

| Page | Read it when |
| --- | --- |
| [Setting up](guide/setup.md) | You are wiring `createSmtpMailer` to a nodemailer transporter: host, port and TLS, credentials, a pool, timeouts, the default sender, what a message becomes on the wire, and why `idempotencyKey` is ignored (with Resend's SMTP relay header) |
| [Errors](guide/errors.md) | You are handling what `send` throws: which SMTP answers are a `MailRefused`, which a `MailFailure`, what is on `cause`, and every `TypeError` at wiring |
| [Testing](guide/testing.md) | You are testing the transport against a real SMTP server — `smtp-server`, `mailparser`, `describeMailer` — or an application that uses it |
| [Troubleshooting](troubleshooting.md) | You have an error message and want its cause and its fix |
| [Roadmap](roadmap.md) | You want to know what is coming, what shipped, and what is deliberately not planned |
