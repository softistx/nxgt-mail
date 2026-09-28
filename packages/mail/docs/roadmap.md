# Roadmap

Where `@nxgt/mail` and the packages around it are heading. A direction, not a
commitment: there are no dates here, and the version something shipped in is
the only number.

## Now

Nothing between releases.

## Next

Nothing yet.

## Later

- **More transports** — Amazon SES, Postmark and Mailgun, one package each,
  each passing the conformance suite and throwing `@nxgt/mail`'s errors.
- **A `describeMailEvent` conformance suite** — `checkMailEvent` grows into a
  full suite, the way `describeMailer` runs the whole `Mailer` port, the day
  a second provider maps its webhook to `MailEvent`.

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
  retry is the caller's decision, explicit — `withRetry` wraps a `Mailer`,
  never hides inside one — and a hidden retry can send the same e-mail twice.
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

- **`RetryOptions` renamed, v0.9.0** — `withRetry`'s options type is renamed
  `MailRetryOptions`: `@nxgt/httpyz` exports its own `RetryOptions`,
  colliding for a project importing both. The old name is kept as a
  `@deprecated` type alias of the same shape — no behaviour change — removed
  in 1.0.
- **Telemetry names collision-proofed, v0.9.0** — `withTelemetry` and
  `withRendererTelemetry` are renamed to `withMailTelemetry` and
  `withMailRendererTelemetry`: `@nxgt/telemetry` exports its own
  `withTelemetry`, colliding for a project importing both. The old names are
  kept as `@deprecated` aliases of the same functions — no behaviour change —
  removed in 1.0.
- **Sending many at once, `sendBatch`, v0.8.0** — sends every message and
  answers one `MailBatchResult` per message, `sent`, `refused` or `failed`,
  never a throw for one message's own outcome. Every message is checked with
  `checkMessage` before any of them is sent. Optional on `Mailer`: a
  transport implements it to use its provider's own batching
  (`@nxgt/mail-resend`'s `POST /emails/batch`); `sendBatch(mailer, messages)`
  falls back to one `send` per message otherwise, so every `Mailer` works
  with it. `withRetry` passes it through untouched; `withMailTelemetry` gives it
  its own span, `mail.sendBatch`. `checkScheduledAt` is now exported, and
  `MailScheduleRefused` (`ALREADY_SENT`, `UNKNOWN_ID`) is what a
  provider-specific action against a scheduled send — `@nxgt/mail-resend`'s
  `cancel` and `reschedule` — refuses with.
- **Delivery events, v0.8.0** — `MailEvent`, the neutral shape a provider's
  webhook is mapped to: `delivered`, `bounced` (`bounceType`, `hard` or
  `soft`), `complained`, `delayed`, and, optional and marked `tracking: true`,
  `opened` and `clicked`. Every event carries `messageId` (the id `send`
  answered), `recipient`, `timestamp`, `tags` and `raw`, the provider's own
  payload untouched. `MailWebhookRefused` (`INVALID_SIGNATURE`,
  `EXPIRED_TIMESTAMP`) is what a webhook subpath throws when the *request*
  cannot be trusted; an event type it does not map is `null`, never a throw.
  `@nxgt/mail-resend/webhooks` is the first mapping; `@nxgt/mail/conformance`
  gains `sampleMailEvent` and `checkMailEvent` for a second provider's.
- **Observability, v0.8.0** — `@nxgt/mail/telemetry`: `withMailTelemetry(mailer,
  { transport })` wraps a `Mailer` with a span `mail.send` per send, kind
  `CLIENT`; `withMailRendererTelemetry(renderer)` wraps a `MailRenderer` with a
  span `mail.render` per render, staying synchronous. Both record a
  duration histogram and a counter by outcome (`ok`, `refused`, `failure`),
  `error.type` on the codes this package throws, and never an address, a
  subject, a body or a placeholder's value — only a shape: a transport's
  name, a recipient count, a tag's name. `@opentelemetry/api` is an optional
  peer, imported only from this subpath.
- **Retrying a failed send, `withRetry`, v0.8.0** — wraps a `Mailer` so a
  `MailFailure` is retried with exponential backoff and full jitter (`attempts`,
  `baseDelayMs`, `maxDelayMs`, an `AbortSignal`), while a `MailRefused` never
  is. A message with no `idempotencyKey` gets one, generated once per logical
  send and reused on every retry; the exhausted error is the last
  `MailFailure`, with `attempts` on it. A future transport's `retryAfterMs`
  is honoured in place of the computed delay — none sets it yet.
- **Scheduled send, v0.7.0** — `scheduledAt` on a `MailMessage`, a `Date` that
  sends the e-mail later instead of now. `checkMessage` refuses a value that
  is not a valid `Date`, one in the past (a small tolerance for clock skew),
  or more than 30 days ahead — Resend's own limit, held for every transport.
  `@nxgt/mail-resend` sends it as Resend's `scheduled_at`, ISO 8601;
  `@nxgt/mail-smtp` refuses it — SMTP cannot schedule, and sending it now
  would be wrong. The memory mailer records it, and includes it in the
  idempotency fingerprint; the conformance suite gains `send.scheduled`,
  seventeen cases in all.
- **Inline images (`cid:`), v0.6.0** — `contentId` on a `MailAttachment` makes
  it an image the HTML shows as `<img src="cid:…">`. `checkMessage` refuses an
  id that is not 1 to 127 letters, digits and `.` `_` `~` `+` `-` with at most
  one `@`, two attachments under one id, and a `cid:` the HTML uses — an
  attribute value or a CSS `url()` — that no attachment names, before a
  broken image goes out. A `cid:` is written in the template: a URL variable
  holding one is refused. The memory mailer keeps the id; the conformance
  suite gains `send.inlineImage`, fifteen cases in all. The SMTP transport
  sends it as nodemailer's `cid`, Resend's as `content_id`.
- **Tags, v0.6.0** — `tags` on a `MailMessage`, a record of names to values,
  label a send for the provider's dashboard and webhooks, never part of the
  e-mail. `checkMessage` holds each name and value to 1 to 256 ASCII letters,
  digits, `_` or `-`, the rule Resend and Amazon SES share. Resend sends them
  as its `tags`; SMTP ignores them. The memory mailer keeps them, and the
  conformance suite gains `send.tags`, sixteen cases in all.
- **A build read by any later renderer, v0.5.1** — within 0.x,
  `createMailRenderer` reads every manifest format up to its own
  (`MANIFEST_FORMAT`, exported from `@nxgt/mail/renderer`), checked before any
  other field: a newer format is refused at start-up, naming both numbers. A
  manifest without `formatVersion` is format 1, so a package that ships a
  prebuilt format-1 build can peer `@nxgt/mail` `>=0.1.0 <1`.
