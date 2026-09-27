# @nxgt/mail

## 0.7.0

### Minor Changes

- [#60](https://github.com/softistx/nxgt-mail/pull/60) [`5f9c8b8`](https://github.com/softistx/nxgt-mail/commit/5f9c8b8cf031b7654731dabfe3c6746c274fcd23) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Scheduled send: `scheduledAt` on a `MailMessage`, a `Date` that sends the e-mail later instead of now. `checkMessage` refuses with `MailRefused` a value that is not a valid `Date`, one in the past (beyond a 60-second tolerance for clock skew), or more than 30 days ahead — Resend's own limit, held for every transport so a message built for one works on another. A transport that cannot schedule refuses the message rather than sending it now. The memory mailer records it, and includes it in the idempotency fingerprint, so the same key rescheduled to a different moment is a different message. The conformance suite gains `send.scheduled`: a scheduled send is either honoured — delivered with its `scheduledAt` — or refused with `MailRefused`, never sent as if it were absent.

## 0.6.0

### Minor Changes

- [#43](https://github.com/softistx/nxgt-mail/pull/43) [`9150a1e`](https://github.com/softistx/nxgt-mail/commit/9150a1e5e6ef7719709722e7578e1d3af5aabf13) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Inline images: `contentId` on a `MailAttachment` makes it an image the HTML shows as `<img src="cid:…">` (RFC 2392). `checkMessage` refuses, with `MailRefused` and never quoting the id, a `contentId` that is not 1 to 127 letters, digits and `. _ ~ + -` with at most one `@`, two attachments under one `contentId`, and a `cid:` URL the HTML uses — an attribute value, quoted or not, or a CSS `url()` — that no attachment's `contentId` names once percent-decoded, before a broken image goes out; a `cid:` in prose or in the text part is not read. A URL variable holding `cid:` stays refused by the renderer: a `cid:` is written in the template. The memory mailer keeps the id (and counts it for an idempotency key); the conformance suite gains `send.inlineImage` and exports `sampleInlineImage`, and `DeliveredMail.attachments` carries each `contentId` — a harness must read it back, bare, for the new case to pass.

- [#50](https://github.com/softistx/nxgt-mail/pull/50) [`b51a759`](https://github.com/softistx/nxgt-mail/commit/b51a759d067efd87ad95932b77ed2488641ec9e6) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Tags: `tags` on a `MailMessage`, a record of names to values, label a send for the provider's dashboard and webhooks, and are never part of the e-mail. `checkMessage` refuses with `MailRefused` tags that are not an object, and a name or value that is not 1 to 256 ASCII letters, digits, `_` or `-` (the rule Resend and Amazon SES share), naming the tag and never the value. The memory mailer keeps them and counts them for an idempotency key; the conformance suite gains `send.tags`: a message with tags is delivered, with no tag written into it.

## 0.5.1

### Patch Changes

- [#40](https://github.com/softistx/nxgt-mail/pull/40) [`4d6e59b`](https://github.com/softistx/nxgt-mail/commit/4d6e59bc9af0ad2aef5ea070e579c8638e0ed8ed) Thanks [@SteveGT96](https://github.com/SteveGT96)! - A compatibility promise for the build: within 0.x, `createMailRenderer` reads
  every manifest format up to its own, so a build from any earlier
  `@nxgt/mail-i18n` 0.x keeps working with a newer `@nxgt/mail` — a package
  that ships a prebuilt format-1 `mails/` folder can peer `@nxgt/mail`
  `>=0.1.0 <1`: the peer's lower bound is the first `@nxgt/mail` that reads the
  build's format.
  `@nxgt/mail/renderer` exports `MANIFEST_FORMAT` (1), the newest format it
  reads; a manifest without `formatVersion` is format 1. A newer format is
  refused at start-up: `… is manifest format 2, newer than this @nxgt/mail
  reads (1) — upgrade @nxgt/mail`. The message for a manifest changed after the
  build no longer asks to rebuild with the same version.

- [#38](https://github.com/softistx/nxgt-mail/pull/38) [`8ddecfe`](https://github.com/softistx/nxgt-mail/commit/8ddecfed229e40c993043238576f459b0326e934) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Troubleshooting: when the text part is missing, leave `plaintext` out of the config rather than writing `plaintext: true`, which drops `@nxgt/mail-config`'s paragraphs.

## 0.5.0

### Minor Changes

- [#35](https://github.com/softistx/nxgt-mail/pull/35) [`59a82e4`](https://github.com/softistx/nxgt-mail/commit/59a82e42bf5a6577cbad1653d76b0068f94f8eb7) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The conformance suite checks the idempotency key: a fourteenth case,
  `send.idempotencyKey`, sends a message with an `idempotencyKey` and expects it
  delivered, answering `SentMail`, with the key in none of its recipients,
  subject, HTML or text. The key is fresh on every run. A transport that refused
  keyed messages now fails the suite.
  
  `listUnsubscribe` writes the URL as a parser reads it — `new URL(url).href`,
  so `https://EXAMPLE.test` is written `https://example.test/` and a `'` in the
  query becomes `%27` — and checks what it writes as well as what it was given:
  a `%` that starts no escape (`%`, `%zz`), and a host escape the parser decodes
  into a refused character (`https://a%2Cb.test/`), are refused with
  `MailRefused`.

### Patch Changes

- [#33](https://github.com/softistx/nxgt-mail/pull/33) [`7cac016`](https://github.com/softistx/nxgt-mail/commit/7cac016adddc10e7c4f5ff73c304838168239149) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Docs: `generated/mail.ts`, which types `createMailRenderer<MailEmails>`, is git-ignored and written by a build run before type-checking, no longer committed.

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
