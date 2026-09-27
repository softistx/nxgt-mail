# @nxgt/mail

## 0.4.0

### Minor Changes

- [#31](https://github.com/softistx/nxgt-mail/pull/31) [`aa057e3`](https://github.com/softistx/nxgt-mail/commit/aa057e3850c72e1e8d25fb001aae6cb1c460a873) Thanks [@SteveGT96](https://github.com/SteveGT96)! - One-click unsubscribe: `listUnsubscribe({ url, mailto? })` answers the two headers of RFC 8058 — `List-Unsubscribe: <https://…>` (with `<mailto:…>` after it when given) and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` — to spread into a message's `headers`, as Gmail and Yahoo require of bulk senders. It refuses, with `MailRefused` and never quoting the value, a `url` that does not start with `https://`, is not printable ASCII, carries a user or a password, or holds `<`, `>`, a double quote, a backtick, a backslash, a brace, `|`, `^` or a raw comma (`listUnsubscribe: url must be an https:// URL in printable ASCII, without credentials, <, >, quotes or a raw comma`), and a `mailto` that is not a bare ASCII address without `?`, `&`, `=`, `#` or `%` (`listUnsubscribe: mailto must be a bare e-mail address, as unsubscribe@example.com`); options, a `url` or a `mailto` that are not text are a `TypeError`. A `URL` object as `url` is a compile error, twenty-three refusals in all. No transport changes: the headers travel as any other.

## 0.3.0

### Minor Changes

- [#29](https://github.com/softistx/nxgt-mail/pull/29) [`1294823`](https://github.com/softistx/nxgt-mail/commit/1294823764f19a3eb9107a6aac2dda8a00ea8bfe) Thanks [@SteveGT96](https://github.com/SteveGT96)! - An idempotency key per send: `idempotencyKey?: string` on `MailMessage` names the send, so sending it again — a retry after a timeout, a job run twice — delivers it once where the transport can deduplicate. A transport that can uses it; one that cannot ignores it. `checkMessage` refuses a key that is not 1 to 256 visible ASCII characters (`send: idempotencyKey must be 1 to 256 visible ASCII characters, as order-42/receipt`), never quoting it. `createMemoryMailer()` honours it as Resend does: the same message under a key it already delivered answers that delivery's `messageId` and delivers nothing more; a different message under that key is a `MailRefused` (`send: idempotencyKey was already used for a different message — a key names one e-mail`); a failed send leaves its key free; `clear()` forgets the keys. A number as the key is a compile error, twenty-two refusals in all.

## 0.2.0

### Minor Changes

- [#27](https://github.com/softistx/nxgt-mail/pull/27) [`69b4b35`](https://github.com/softistx/nxgt-mail/commit/69b4b351cf8fda0ae151393d1475f638cc2b474a) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Attachments: a `MailMessage` can carry files, as bytes.
  
  - `attachments?: readonly MailAttachment[]` on `MailMessage`, each `{ filename, content, contentType }` with `content` a `Uint8Array` (a Node `Buffer` is one). Bytes only — no path, no URL, no stream — so a transport never reads a file or fetches a URL for you. A large or sensitive file stays a signed link in the template, a URL variable. Inline (`cid:`) images are not supported yet.
  - `checkMessage` refuses, with `MailRefused` naming where and never the file's name: `attachments` that is not an array, an entry that is not an object, `content` that is not a `Uint8Array`, a hole in the list, a `filename` that is empty, `.` or `..`, or holds `/`, `\`, a line break, a control character or a format character (a right-to-left override), and a `contentType` that is not a bare `type/subtype` or is a MIME container (`multipart/*`, `message/*`). An empty list is the same as none.
  - `createMemoryMailer()` keeps the attachments in its outbox, with a copy of their bytes.
  - `@nxgt/mail/conformance`: two new cases, thirteen in all — `send.attachment` (a file of every byte from 0 to 255, named `reçu n° 42.pdf`, arrives byte for byte with its name and its type) and `send.refusesAttachmentPath`. `DeliveredMail` gains an optional `attachments`, so an existing harness still compiles, but `send.attachment` fails on one that does not read them back, saying so: read them back, or skip the case with its reason. `sampleAttachment` is exported.
  - Four new compile-time refusals, twenty-one in all: `content` as a string, a `path` instead of the bytes, no `contentType`, one attachment not in a list.
  
  A transport that sends attachments reads `message.attachments` and needs this minor as its peer (`^0.2.0`): on `0.x`, `^0.1.0` does not allow it.

## 0.1.0

### Minor Changes

- [#24](https://github.com/softistx/nxgt-mail/pull/24) [`12fd622`](https://github.com/softistx/nxgt-mail/commit/12fd6229cd15bee8b0015ea7d46e514961b9dc5e) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The first release: the run-time core of transactional e-mail — a port, its errors, and a renderer for what `maizzle build` wrote.
  
  - The `Mailer` port a transport implements, the `MailMessage` and `Rendered` shapes it sends, and two errors: `MailFailure` (`MAIL_FAILED`) when the transport could not hand the message over, `MailRefused` (`MAIL_REFUSED`) when the message itself was refused. A send resolves once the transport accepted the e-mail, or throws; it never answers `false`. No dependency; the root entry imports no Node built-in (`@nxgt/mail/renderer` reads files with `node:fs`).
  - `createMemoryMailer()` for tests: an outbox to read (`mailer.sent`), and a next send you can make fail.
  - `pickLocale(wanted, supported, fallback)` and `parseAcceptLanguage()`: a stored preference first, then the browser's languages, `fr-CA` matching `fr`, the fallback when nothing does.
  - `createMailRenderer` from `@nxgt/mail/renderer`: `mails.render('verify-email', { name, link })` answers `Rendered` from the built files of the recipient's locale, every `{{ placeholder }}` filled and HTML-escaped. A link that is not `http:`, `https:` or `mailto:` is refused; a missing variable, an unknown e-mail or locale throws. Typed with the `MailEmails` a build writes, the same mistakes are compile errors.
  - `describeMailer(harness)` from `@nxgt/mail/conformance`, for transport authors: a send answers `SentMail`, an outage throws a `MailFailure`, an e-mail arrives byte for byte, nothing is retried in secret. Runs under bun:test, Vitest or Jest.
