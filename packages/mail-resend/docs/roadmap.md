# Roadmap

Where `@nxgt/mail-resend` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

Nothing between releases.

## Next

Nothing yet.

## Later

- **An idempotency key per send** — Resend's `Idempotency-Key` header, so a
  retry the caller decides cannot send the same e-mail twice.
- **Tags** — Resend's `tags`, to group sends in its dashboard.

## Not planned

- **The Resend SDK** — one request does not need it, and without it the
  transport has no dependency.
- **Silent retries**, including on a `429` — the transport tries once. A
  retry is the caller's decision, made where it can be seen; a hidden one can
  send the same e-mail twice.
- **A transport's own error class** — it throws `@nxgt/mail`'s `MailFailure`
  and `MailRefused`, so `instanceof` holds whichever transport you wire.
- **Scheduling, batch sending and attachments** — a message is three strings
  sent now; the port has no room for more.

## Shipped

The last ten, newest first, each with the version it came in. Everything
before is in the [CHANGELOG](../CHANGELOG.md).

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
