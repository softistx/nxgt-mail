# Roadmap

Where `@nxgt/mail-smtp` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

Nothing between releases.

## Next

Nothing yet.

## Later

Nothing planned yet. Say what you need in an issue.

## Not planned

- **SMTP options of our own** — host, port, TLS, pooling, DKIM and timeouts
  are nodemailer's; wrapping them would lag behind it. You create the
  transporter.
- **Silent retries** — the transport tries once. A retry is the caller's
  decision, made where it can be seen; a hidden one can send the same e-mail
  twice.
- **A transport's own error class** — it throws `@nxgt/mail`'s `MailFailure`
  and `MailRefused`, so `instanceof` holds whichever transport you wire.
- **Files and URLs read by nodemailer** — an attachment is bytes your code
  already holds; `disableFileAccess` and `disableUrlAccess` stay on, so no
  value from outside can make nodemailer read a file or fetch a URL.
- **Bundling nodemailer** — it is a peer: one copy, the version you choose.
- **Webhooks / delivery events of our own** — SMTP has none: what happened
  after the hand-over is in the receiving MTA's own logs, or comes back as a
  DSN (delivery status notification) e-mail to the envelope sender, out of
  scope here. See `@nxgt/mail`'s neutral `MailEvent` and
  `@nxgt/mail-resend/webhooks`, the provider transport that has a webhook.

## Shipped

The last ten, newest first, each with the version it came in. Everything
before is in the [CHANGELOG](../CHANGELOG.md).

- **`@nxgt/mail` 0.8, v0.5.1** — the peer moves to `^0.8.0`, the version with
  `@nxgt/mail/telemetry` and with delivery events. No change here: SMTP has
  no webhook of its own, so it maps no delivery events — see
  [Delivery events — out of scope](../README.md#delivery-events--out-of-scope).
- **Scheduled send refused, v0.5.0** — a message's `scheduledAt` is refused
  with `MailRefused` — `send: scheduledAt is not supported — SMTP has no way
  to schedule a send, and sending it now would be wrong` — rather than sent
  at once. The `@nxgt/mail` peer moves to `^0.7.0`.
- **Inline images (`cid:`), v0.4.0** — an attachment's `contentId` is sent as
  nodemailer's `cid`: a `Content-ID` header, `inline`, in a
  `multipart/related` beside the HTML, so the HTML shows it as `<img
  src="cid:…">`. The `@nxgt/mail` peer moves to `^0.6.0`.
- **Tags ignored, v0.4.0** — a message's `tags` are checked and never sent:
  SMTP has none.
- **`@nxgt/mail` 0.5, v0.3.2** — the peer moves to `^0.5.0`, whose conformance
  suite also checks that a message with an idempotency key is delivered. This
  transport passes it unchanged.
- **`@nxgt/mail` 0.4, v0.3.1** — the peer moves to `^0.4.0`, the version with
  `listUnsubscribe`: its headers travel as any other. No change here.
- **Messages with an idempotency key, v0.3.0** — a message that carries an
  `idempotencyKey` is accepted, and the key is ignored: SMTP has no
  idempotency, so a message sent twice is delivered twice. Needs `@nxgt/mail`
  0.3.
- **Attachments, v0.2.0** — the `attachments` of a message are handed to nodemailer
  as bytes, a `Buffer` copied from each `Uint8Array`, with their file name
  (encoded by nodemailer when it is not ASCII) and their type. Never a `path`
  or an `href`: `disableFileAccess` and `disableUrlAccess` stay on. A message
  over the server's size limit (`552`) is a `MailRefused`. Needs
  `@nxgt/mail` 0.2.
- **An SMTP transport on your nodemailer, v0.1.0** — `createSmtpMailer({ transporter,
  from })`: every SMTP option is nodemailer's, set where you create the
  transporter. Each message is checked as every transport checks it, a name is
  quoted by nodemailer so it names one recipient, and nothing is read from a
  file or a URL.
- **Errors you can act on, v0.1.0** — a permanent `5xx` on the recipients or the
  content (`552` for a message too large) is a `MailRefused`; an
  unreachable server, a timeout, a `4xx`, refused credentials or a refused
  sender is a `MailFailure`, nodemailer's error on `cause`. Some recipients
  refused while others were accepted throws too, and says the others may
  have the message. The classes are `@nxgt/mail`'s, so `instanceof` holds.
