# @nxgt/mail-resend

## 0.1.0

### Minor Changes

- [#24](https://github.com/softistx/nxgt-mail/pull/24) [`a5cd029`](https://github.com/softistx/nxgt-mail/commit/a5cd0290fc441edd19fc7cf971a04353f6db64c0) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The first release: a Resend transport for `@nxgt/mail`, over `fetch`, with no SDK and no dependency.
  
  - `createResendMailer({ apiKey, from })`: one `POST /emails` per message, no Node built-in, so it runs on an edge runtime too. Each message is checked as every transport checks it, and a name is sent quoted so it names one recipient.
  - A `400` or `422` is a `MailRefused`; a bad key, a rate limit, an outage, a network error or a timeout is a `MailFailure`, what Resend answered on `cause`. The classes are `@nxgt/mail`'s, so `instanceof` holds.
  - The transport tries once, a `429` included; a retry is the caller's decision. It passes the `@nxgt/mail/conformance` suite against a local server answering as Resend does.

### Patch Changes

- Updated dependencies [[`12fd622`](https://github.com/softistx/nxgt-mail/commit/12fd6229cd15bee8b0015ea7d46e514961b9dc5e)]:
  - @nxgt/mail@0.1.0
