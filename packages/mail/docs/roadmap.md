# Roadmap

Where `@nxgt/mail` and the packages around it are heading. A direction, not a
commitment: there are no dates here, and the version something shipped in is
the only number.

## Now

Nothing between releases.

## Next

Nothing yet.

## Later

- **Inline images (`cid:`)** — an attachment the HTML shows by its content
  id. Until then, an image is an `https:` URL, as `@nxgt/mail-ui`'s logo is.
- **More transports** — Amazon SES, Postmark and Mailgun, one package each,
  each passing the conformance suite and throwing `@nxgt/mail`'s errors.

## Not planned

- **A preview server of our own** — `maizzle serve` is the preview: with the
  i18n plugin it shows every e-mail in every locale, live. The packages add to
  a Maizzle project; they never replace its commands.
- **A template engine at run time** — no Handlebars, no MJML, no Maizzle in
  your server. An engine is a run-time dependency for work `maizzle build`
  already finishes; the renderer only fills `{{ placeholder }}` values into
  the built files.
- **One HTML file per language** — a layout fix would be made once per
  language, or made once and forgotten. One template per e-mail holds keys
  into catalogues; a new language is one catalogue.
- **Raw (unescaped) interpolation in v1** — every value is HTML-escaped in
  `html`. An escape hatch is where an injection gets in; if you need markup,
  put it in the template, or write that e-mail by hand — any function
  answering `Rendered` is accepted.
- **Silent retries inside a transport** — a transport tries once and throws;
  the conformance suite fails one that retries in secret. Whether and when to
  retry is the caller's decision (a queue, a job runner), and a hidden retry
  can send the same e-mail twice.
- **Answering `false`, or logging and resolving, on a failed send** — a
  caller that reads a failed send as "sent" tells a user to check an inbox
  that will stay empty. A failure throws `MailFailure`.
- **Falling back to the raw message when one fails to format** — that sends an
  e-mail with `{link}` in it. A catalogue problem fails the build instead.
- **A transport's own error class** — a transport throws `@nxgt/mail`'s
  `MailFailure` and `MailRefused`, so `instanceof` holds whichever transport
  you wire.
- **A display name inside an address string** — `"Ada <ada@example.com>"` is
  refused; write `{ name: 'Ada', address: 'ada@example.com' }`. A transport
  never parses an address, and a name cannot smuggle a second one into a
  header.
- **`snake_case` keys** — options, variables, catalogue keys and theme tokens
  are `camelCase`, held by a lint rule. Error codes are `SCREAMING_SNAKE`
  because they are values, not keys.
- **`moduleResolution: "nodenext"`** — sources and emitted declarations import
  without extensions, and resolve as Bun and every bundler do. Use
  `"moduleResolution": "bundler"`.

## Shipped

The last ten, newest first, each with the version it came in. Everything
before is in the [CHANGELOG](../CHANGELOG.md).

- **A build read by any later renderer, v0.5.1** — within 0.x,
  `createMailRenderer` reads every manifest format up to its own
  (`MANIFEST_FORMAT`, exported from `@nxgt/mail/renderer`), checked before any
  other field: a newer format is refused at start-up, naming both numbers. A
  manifest without `formatVersion` is format 1, so a package that ships a
  prebuilt format-1 build can peer `@nxgt/mail` `>=0.1.0 <1`.
- **The idempotency key in the conformance suite, and the unsubscribe URL as
  written, v0.5.0** — a fourteenth case, `send.idempotencyKey`, delivers a
  message with a fresh key and expects it never refused for it, the key in
  none of its recipients, subject, HTML or text. `listUnsubscribe` writes
  `new URL(url).href` and checks it as well as what it was given: a `%` that
  starts no escape, or a host escape decoded into a refused character, is a
  `MailRefused`. SMTP and Resend move their peer to `^0.5.0`.
- **One-click unsubscribe, v0.4.0** — `listUnsubscribe({ url, mailto? })`
  answers RFC 8058's `List-Unsubscribe` and `List-Unsubscribe-Post` headers,
  to spread into a message's `headers`, so Gmail and Yahoo offer their
  one-click unsubscribe. A `url` that is not an ASCII `https://` URL, or that
  would break the header, and a `mailto` that is not a bare address are
  refused with `MailRefused`, never quoting the value. No transport changes.
- **An idempotency key per send, v0.3.0** — `idempotencyKey` on a `MailMessage`
  names the send, so sending it again — a retry after a timeout, a job run
  twice — delivers it once where the transport can deduplicate; a transport
  that cannot ignores it. `checkMessage` refuses a key that is not 1 to 256
  visible ASCII characters, never quoting it. The memory mailer honours it as
  Resend does: the same message under a key it already delivered answers
  that delivery's `messageId` and delivers nothing more, a different message
  under it is a `MailRefused`, a failed send leaves its key free, and
  `clear()` forgets the keys.
- **Attachments, v0.2.0** — `attachments` on a `MailMessage`: each file's bytes as a
  `Uint8Array`, its name and its type. Bytes only — no path, no URL, no
  stream, so a transport never reads a file or fetches a URL for you; a large
  or sensitive file stays a signed link in the template. `checkMessage`
  refuses a name holding a path, a line break, a control or a format
  character, `.` or `..`, and a type that is not `type/subtype` or is a MIME
  container; the memory mailer keeps a copy of the
  bytes; the conformance suite gains `send.attachment` and
  `send.refusesAttachmentPath`, thirteen cases in all. The SMTP and Resend
  transports send them.
- **The run-time core, v0.1.0** — `@nxgt/mail`, with no dependency: the `Mailer` port
  a transport implements, the `Rendered` and `MailMessage` shapes it sends, and
  its two errors — `MailFailure` (`MAIL_FAILED`) when the transport could not
  hand the message over, `MailRefused` (`MAIL_REFUSED`) when the message itself
  was refused. A send resolves only once the transport has accepted the
  e-mail; it never answers `false`.
- **A memory transport for tests, v0.1.0** — `createMemoryMailer()`: an outbox you can
  read (`mailer.sent`), and a next send you can make fail, to test the path
  where an e-mail does not go.
- **Choosing the recipient's locale, v0.1.0** — `pickLocale(wanted, supported,
  fallback)` and `parseAcceptLanguage()`: a stored preference first, then the
  browser's languages, `fr-CA` matching `fr`, the fallback when nothing does.
- **A conformance suite for transport authors, v0.1.0** — `@nxgt/mail/conformance`:
  `describeMailer(harness)` checks that a send answers `SentMail`, that an
  outage throws a `MailFailure` which `instanceof` recognises, that an e-mail
  arrives byte for byte, and that nothing is retried in secret. Runs under
  bun:test, Vitest or Jest.
- **The run-time renderer, v0.1.0** — `createMailRenderer`, from `@nxgt/mail/renderer`:
  `mails.render('verify-email', { name, link })` answers `Rendered` from the
  built files of the recipient's locale, every `{{ placeholder }}` filled.
  Values are HTML-escaped in `html`; a link that is not `http:`, `https:` or
  `mailto:` is refused with `MailRefused`; a missing variable, an unknown
  e-mail or locale throws. Its own entry because it reads files with
  `node:fs`: `@nxgt/mail` itself runs anywhere.
