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
- **The run-time renderer** — `createMailRenderer`, from `@nxgt/mail/renderer`:
  `mails.render('verify-email', { name, link })` answers `Rendered` from the
  built files of the recipient's locale, every `{{ placeholder }}` filled.
  Values are HTML-escaped in `html`; a link that is not `http:`, `https:` or
  `mailto:` is refused with `MailRefused`; a missing variable, an unknown
  e-mail or locale throws. Its own entry because it reads files with
  `node:fs`: `@nxgt/mail` itself runs anywhere. Built, not yet published.

## Next

- **A base Maizzle config** — `@nxgt/mail-config`: `defineMailConfig({ plugins,
  ...project })` for the `maizzle.config.ts` of a normal Maizzle 6 project
  (`maizzle serve`, `maizzle build`, unchanged): output to `dist`, CSS inlined
  and purged, plain text on. Plugins merge in order and every build hook they
  set is chained, so two plugins never drop each other's. Your own config keys
  win.
- **i18n with one build per locale** — `@nxgt/mail-i18n`: one template per
  e-mail, its text as keys into ICU catalogues (`locales/en.json`,
  `locales/fr.json`), `t()` in templates, and one output per locale from a
  single `maizzle build` (`dist/en/verify-email.html`,
  `dist/fr/verify-email.html`). A catalogue that does not parse, a key missing
  in one locale or an argument declared differently fails the build.
  `placeholder('name')` leaves a value only known at send time as
  `{{ name }}`, and the build writes a manifest of each e-mail's variables and
  its subject per locale. `maizzle serve` shows every e-mail in every locale
  and reloads when a catalogue changes.
- **UI components** — `@nxgt/mail-ui`: a neutral theme, a layout and the
  components an e-mail needs (`<NxButton>`, `<NxHeading>`, `<NxText>`…), and
  shared messages in English and French. Replace one component or one message
  by name in your project, and keep the rest.
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

Nothing yet: the run-time core under **Now** is the first thing to ship, with
the first release, 0.1.0. From then on, the last ten items are listed here,
newest first, and `CHANGELOG.md` holds the rest.
