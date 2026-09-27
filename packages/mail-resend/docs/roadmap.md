# Roadmap

Where `@nxgt/mail-resend` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

Nothing yet.

## Next

Nothing yet.

## Later

- **Tags** — Resend's `tags`, to group sends in its dashboard.

## Not planned

- **The Resend SDK** — one request does not need it, and without it the
  transport has no dependency.
- **Silent retries**, including on a `429` — the transport tries once. A
  retry is the caller's decision, made where it can be seen; a hidden one can
  send the same e-mail twice.
- **A transport's own error class** — it throws `@nxgt/mail`'s `MailFailure`
  and `MailRefused`, so `instanceof` holds whichever transport you wire.
- **Scheduling and batch sending** — a message is sent now, one per request;
  the port has no room for more.

## Shipped

The last ten, newest first, each with the version it came in. Everything
before is in the [CHANGELOG](../CHANGELOG.md).

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
- **Proven against Resend's API shape, v0.1.0** — the `@nxgt/mail/conformance` suite
  passes against a local server answering as Resend does.
