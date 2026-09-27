# Roadmap

Where `@nxgt/mail` and the packages around it are heading. A direction, not a
commitment: there are no dates here, and the version something shipped in is
the only number.

## Now

- **An idempotency key per send** — `idempotencyKey` on a `MailMessage`
  names the send, so sending it again — a retry after a timeout, a job run
  twice — delivers it once where the transport can deduplicate; a transport
  that cannot ignores it. `checkMessage` refuses a key that is not 1 to 256
  visible ASCII characters, never quoting it. The memory mailer honours it as
  Resend does: a key it already delivered answers that delivery's `messageId`
  and delivers nothing more, a failed send leaves its key free, and `clear()`
  forgets the keys. Built, not yet published.

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
- **A renderer typed by the build, v0.1.0** — `createMailRenderer<MailEmails>(…)`,
  with the `MailEmails` that `@nxgt/mail-i18n` writes in `generated/mail.ts`:
  an unknown e-mail, a variable missing or unknown, the variables left out, or
  a number for a URL is a compile error rather than a throw at the send, in a
  call written out. The
  type parameter is optional; untyped, the renderer is unchanged, and the
  run-time checks hold either way.
- **Two transports, `@nxgt/mail-smtp` and `@nxgt/mail-resend` v0.1.0** —
  SMTP on the `nodemailer` you install, and Resend over `fetch` with no SDK,
  each passing the conformance suite — against a local SMTP server, and a
  local server answering as Resend does — and throwing `@nxgt/mail`'s errors.
  See [the SMTP roadmap](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-smtp/docs/roadmap.md)
  and [the Resend roadmap](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-resend/docs/roadmap.md).
- **The Maizzle side, `@nxgt/mail-config`, `@nxgt/mail-i18n`, `@nxgt/mail-ui`
  and `@nxgt/mail-presets` v0.1.0** — packages for a normal Maizzle 6 project:
  `defineMailConfig({ plugins })` with every plugin's build hooks chained;
  one template per e-mail, its text keys into ICU catalogues checked at build
  time, one output per locale and the manifest this renderer reads; e-mail
  components in the style of `@nxgt/material-vue`, with shared messages in
  `en` and `fr`; and nine ready e-mails built with your own brand.
- **A starter that sends, with v0.1.0** — `examples/starter`'s `send.ts` renders its
  e-mails in `en` and `fr` through `createMailRenderer<MailEmails>` and
  hands them to `createMemoryMailer()`, run in CI:
  [`examples/starter`](https://github.com/softistx/nxgt-mail/tree/develop/examples/starter).
  In the repository; its README says how to start your own from npm.
