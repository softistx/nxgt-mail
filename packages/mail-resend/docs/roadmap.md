# Roadmap

Where `@nxgt/mail-resend` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

Nothing between releases.

## Next

Nothing yet.

## Later

- **Cancelling a scheduled send** — Resend's own
  `POST /emails/{id}/cancel`; see
  [`@nxgt/mail`'s roadmap](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/roadmap.md).

## Not planned

- **The Resend SDK** — one request does not need it, and without it the
  transport has no dependency.
- **Silent retries**, including on a `429` — the transport tries once. A
  retry is the caller's decision, made where it can be seen; a hidden one can
  send the same e-mail twice.
- **A transport's own error class** — it throws `@nxgt/mail`'s `MailFailure`
  and `MailRefused`, so `instanceof` holds whichever transport you wire.
- **Batch sending** — one message per request; the port has no room for more.

## Shipped

The last ten, newest first, each with the version it came in. Everything
before is in the [CHANGELOG](../CHANGELOG.md).

- **Webhooks — delivery events, v0.6.0** — `createResendWebhook({ secret })`
  from the new `@nxgt/mail-resend/webhooks` subpath verifies Resend's Svix
  signature (`svix-id`, `svix-timestamp`, `svix-signature`, several during
  secret rotation, a 5-minute timestamp tolerance) with Web Crypto only, and
  maps `email.delivered`, `email.bounced`, `email.complained`,
  `email.delivery_delayed`, `email.opened` and `email.clicked` to
  `@nxgt/mail`'s neutral `MailEvent`. An event type it does not map is
  `null`; a bad or old signature throws `MailWebhookRefused`. The
  `@nxgt/mail` peer moves to `^0.8.0`, also the version with
  `@nxgt/mail/telemetry` — no change here for that part.
- **Scheduled send, v0.5.0** — a message's `scheduledAt` is sent as Resend's
  `scheduled_at`, ISO 8601: Resend answers an id right away, and sends the
  e-mail itself later. The `@nxgt/mail` peer moves to `^0.7.0`.
- **Inline images (`cid:`), v0.4.0** — an attachment's `contentId` is sent as
  Resend's `content_id`, so the HTML shows it as `<img src="cid:…">`. The
  `@nxgt/mail` peer moves to `^0.6.0`.
- **Tags, v0.4.0** — a message's `tags` are sent as Resend's `tags`, to group
  sends in its dashboard and webhooks; more than 75 is a `MailRefused` before
  sending.
- **`@nxgt/mail` 0.5, v0.3.2** — the peer moves to `^0.5.0`, whose conformance
  suite also checks that a message with an idempotency key is delivered. This
  transport passes it unchanged.
- **`@nxgt/mail` 0.4, v0.3.1** — the peer moves to `^0.4.0`, the version with
  `listUnsubscribe`: its headers travel as any other. No change here.
- **An idempotency key per send, v0.3.0** — a message's `idempotencyKey` is sent as
  Resend's `Idempotency-Key` header, so a retry the caller decides, within
  Resend's 24 hours, answers the first send's id and cannot send the same
  e-mail twice. A `409 invalid_idempotent_request` (the key already used for
  another message) is a `MailRefused`; a `409 concurrent_idempotent_requests`
  (the same key still in progress) stays a `MailFailure`. Needs `@nxgt/mail`
  0.3.
- **Attachments, v0.2.0** — the `attachments` of a message are sent in Resend's
  `attachments`, each as `{ filename, content, content_type }` with the bytes
  in base64, encoded with no Node built-in so the transport still runs on an
  edge runtime. Resend's `path` (a URL it would fetch) is never used. A
  request too large (`413`) is a `MailRefused`, as a `400` or `422` is. Needs
  `@nxgt/mail` 0.2.
- **A Resend transport over `fetch`, v0.1.0** — `createResendMailer({ apiKey, from })`:
  one `POST /emails` per message, no SDK, no dependency, no Node built-in, so
  it runs on an edge runtime too. Each message is checked as every transport
  checks it, and a name is sent quoted so it names one recipient.
- **Errors you can act on, v0.1.0** — a `400` or `422` is a `MailRefused`; a bad key,
  a rate limit, an outage, a network error or a timeout is a `MailFailure`,
  what Resend answered on `cause`. The classes are `@nxgt/mail`'s, so
  `instanceof` holds.
