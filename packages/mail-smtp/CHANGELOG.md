# @nxgt/mail-smtp

## 0.2.0

### Minor Changes

- [#27](https://github.com/softistx/nxgt-mail/pull/27) [`69b4b35`](https://github.com/softistx/nxgt-mail/commit/69b4b351cf8fda0ae151393d1475f638cc2b474a) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Sends attachments: each of a message's `attachments` is handed to nodemailer as `{ filename, content, contentType }`, the bytes copied into a `Buffer`, never a `path` or an `href` — `disableFileAccess` and `disableUrlAccess` stay on. nodemailer encodes a file name outside ASCII. A message over the server's size limit (`552`) is a `MailRefused`, as before. The `@nxgt/mail` peer moves to `^0.2.0`, the minor with attachments. Passes the thirteen cases of `@nxgt/mail/conformance`.

### Patch Changes

- Updated dependencies [[`69b4b35`](https://github.com/softistx/nxgt-mail/commit/69b4b351cf8fda0ae151393d1475f638cc2b474a)]:
  - @nxgt/mail@0.2.0

## 0.1.0

### Minor Changes

- [#24](https://github.com/softistx/nxgt-mail/pull/24) [`6488e57`](https://github.com/softistx/nxgt-mail/commit/6488e5746e3b23ff761bea91dae290504cb11b06) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The first release: an SMTP transport for `@nxgt/mail`, on the `nodemailer` you install.
  
  - `createSmtpMailer({ transporter, from })`: every SMTP option is nodemailer's, set where you create the transporter. Each message is checked as every transport checks it, a name is quoted so it names one recipient, and nothing is read from a file or a URL.
  - A permanent `5xx` on the recipients or the content is a `MailRefused`; an unreachable server, a timeout, a `4xx`, refused credentials or a refused sender is a `MailFailure`, nodemailer's error on `cause`. Some recipients refused while others were accepted throws too. The classes are `@nxgt/mail`'s, so `instanceof` holds.
  - The transport tries once; a retry is the caller's decision. It passes the `@nxgt/mail/conformance` suite against a local SMTP server.

### Patch Changes

- Updated dependencies [[`12fd622`](https://github.com/softistx/nxgt-mail/commit/12fd6229cd15bee8b0015ea7d46e514961b9dc5e)]:
  - @nxgt/mail@0.1.0
