# Roadmap

Where `@nxgt/mail-resend` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

Nothing between releases.

## Next

Nothing yet.

## Later

Nothing yet.

## Not planned

- **The Resend SDK** — one request does not need it, and without it the
  transport has no dependency.
- **Silent retries**, including on a `429` — the transport tries once. A
  retry is the caller's decision, made where it can be seen; a hidden one can
  send the same e-mail twice.
- **A transport's own error class** — it throws `@nxgt/mail`'s `MailFailure`
  and `MailRefused`, so `instanceof` holds whichever transport you wire.

## Shipped

The last ten, newest first, each with the version it came in. Everything
before is in the [CHANGELOG](../CHANGELOG.md).

- **A stable surface, v1.0.0** — semantic versioning from here: a breaking
  change waits for the next major. The `@nxgt/mail` peer moves to `^1.0.0`,
  so upgrade the two together. No API change here, `./webhooks` included.
- **Batch sending, cancelling and rescheduling, v0.6.0** — `sendBatch(messages)`
  calls Resend's `POST /emails/batch`, up to 100 messages per request, split
  into as many requests as it takes above that; every message is checked
  with `checkMessage` first, and an attachment or a message's own
  `idempotencyKey` is refused on its own, the rest of the batch unaffected —
  Resend's batch takes neither. A request Resend refuses, or cannot be
  reached for, reports every message in it the same way, since Resend
  answers the whole request as one. `cancel(messageId)` calls Resend's
  `POST /emails/{id}/cancel`, and `reschedule(messageId, scheduledAt)` its
  `PATCH /emails/{id}`, to stop or move a message `send` scheduled ahead;
  both refuse with `@nxgt/mail`'s `MailScheduleRefused` — `UNKNOWN_ID` or
  `ALREADY_SENT` — for an id Resend does not hold pending. The `@nxgt/mail`
  peer moves to `^0.8.0`.
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
