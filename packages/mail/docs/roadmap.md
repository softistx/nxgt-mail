# Roadmap

Where `@nxgt/mail` and the packages around it are heading. A direction, not a
commitment: there are no dates here, and the version something shipped in is
the only number.

## Now

- **The run-time core** — `@nxgt/mail`, with no dependency: the `Mailer` port
  a transport implements, the `Rendered` and `MailMessage` shapes it sends, and
  its two errors — `MailFailure` (`MAIL_FAILED`) when the transport could not
  hand the message over, `MailRefused` (`MAIL_REFUSED`) when the message itself
  was refused. A send resolves only once the transport has accepted the
  e-mail; it never answers `false`. Built, not yet published.
- **A memory transport for tests** — `createMemoryMailer()`: an outbox you can
  read (`mailer.sent`), and a next send you can make fail, to test the path
  where an e-mail does not go. Built, not yet published.
- **Choosing the recipient's locale** — `pickLocale(wanted, supported,
  fallback)` and `parseAcceptLanguage()`: a stored preference first, then the
  browser's languages, `fr-CA` matching `fr`, the fallback when nothing does.
  Built, not yet published.
- **A conformance suite for transport authors** — `@nxgt/mail/conformance`:
  `describeMailer(harness)` checks that a send answers `SentMail`, that an
  outage throws a `MailFailure` which `instanceof` recognises, that an e-mail
  arrives byte for byte, and that nothing is retried in secret. Runs under
  bun:test, Vitest or Jest. Built, not yet published.

## Next

- **Typed render functions from your templates** — `@nxgt/mail-build`, a
  build-time dependency only: one Maizzle 6 template per e-mail, styled with
  Tailwind CSS 4 and its CSS inlined for e-mail clients, and one ICU message
  catalogue per locale, compiled into a TypeScript module where
  `mails.verifyEmail({ locale: 'fr', name, link })` answers
  `{ subject, html, text }`. A missing, misspelled or mistyped argument, an
  unknown locale or an unknown e-mail is a compile error; a catalogue that
  does not parse, or a key missing in one locale, fails the build. Every value
  is escaped, and a link that is not `http:`, `https:` or `mailto:` is refused.
  The generated module needs nothing but `Intl` at run time.
- **Presets** — `@nxgt/mail-preset`: a neutral default theme, a transactional
  layout, the components an e-mail needs (a button, a heading, a one-time code
  easy to copy…) and shared messages in English and French. Change one token,
  add one language or replace one e-mail, and keep the rest.
- **An SMTP transport** — `@nxgt/mail-smtp`, on the `nodemailer` you install,
  passing the conformance suite.
- **A Resend transport** — `@nxgt/mail-resend`, over `fetch` with no SDK,
  passing the conformance suite.
- **The first release, 0.1.0** — every package above on npm, installable into
  an empty project that builds and sends an e-mail with the README's own
  snippet.

## Later

- **More transports** — Amazon SES, Postmark and Mailgun, one package each,
  each passing the conformance suite and throwing `@nxgt/mail`'s errors.
- **A preview server** — every e-mail in every locale, rendered live while you
  edit a template or a catalogue.

## Not planned

- **A template engine at run time** — no Handlebars, no MJML, no Maizzle in
  your server. An engine is untyped and a run-time dependency for work the
  build can finish; the render functions only substitute strings and call
  `Intl`.
- **One HTML file per language** — a layout fix would be made once per
  language, or made once and forgotten. One template per e-mail holds keys
  into catalogues; a new language is one catalogue.
- **Raw (unescaped) interpolation in v1** — every value is HTML-escaped in
  `html`. An escape hatch is where an injection gets in; if you need markup,
  put it in the template or write that e-mail's render function yourself —
  any function answering `Rendered` is accepted.
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
- **`snake_case` keys** — options, render arguments, catalogue keys and preset
  tokens are `camelCase`, held by a lint rule. Error codes are
  `SCREAMING_SNAKE` because they are values, not keys.
- **`moduleResolution: "nodenext"`** — sources and emitted declarations import
  without extensions, and resolve as Bun and every bundler do. Use
  `"moduleResolution": "bundler"`.

## Shipped

Nothing yet: the run-time core under **Now** is the first thing to ship, with
the first release, 0.1.0. From then on, the last ten items are listed here,
newest first, and `CHANGELOG.md` holds the rest.
