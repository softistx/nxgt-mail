# @nxgt/mail-resend

## 0.6.1

### Patch Changes

- [#80](https://github.com/softistx/nxgt-mail/pull/80) [`83ea390`](https://github.com/softistx/nxgt-mail/commit/83ea390aa2ff0aa92cc8bac0779295704c25988c) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail` peer moves to `^0.9.0`: upgrade `@nxgt/mail` with it. No behaviour change here — `@nxgt/mail`'s `RetryOptions` rename to `MailRetryOptions` (the old name kept as a `@deprecated` alias) does not touch a transport.

- [#77](https://github.com/softistx/nxgt-mail/pull/77) [`699bd48`](https://github.com/softistx/nxgt-mail/commit/699bd48c32fd3721eb065a48164fcac73f93e613) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail` peer moves to `^0.9.0`: upgrade `@nxgt/mail` with it. No behaviour change here — `@nxgt/mail`'s `withTelemetry`/`withRendererTelemetry` rename to `withMailTelemetry`/`withMailRendererTelemetry` does not touch a transport.
- Updated dependencies [[`83ea390`](https://github.com/softistx/nxgt-mail/commit/83ea390aa2ff0aa92cc8bac0779295704c25988c), [`699bd48`](https://github.com/softistx/nxgt-mail/commit/699bd48c32fd3721eb065a48164fcac73f93e613)]:
  - @nxgt/mail@0.9.0

## 0.6.0

### Minor Changes

- [#69](https://github.com/softistx/nxgt-mail/pull/69) [`7e15c67`](https://github.com/softistx/nxgt-mail/commit/7e15c67cef150e86129b9d5be08d0e72d5f49140) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Webhooks: a new `@nxgt/mail-resend/webhooks` subpath. `createResendWebhook({ secret })` verifies Resend's Svix signature — the headers `svix-id`, `svix-timestamp` and `svix-signature`, HMAC-SHA256 over `${svix-id}.${svix-timestamp}.${body}` against the `whsec_…` secret, several space-separated signatures accepted during secret rotation, a 5-minute timestamp tolerance — with Web Crypto only, so it runs on Node, Bun, Deno and an edge or workers runtime alike. `verify(request)` maps `email.delivered`, `email.bounced`, `email.complained`, `email.delivery_delayed`, `email.opened` and `email.clicked` to `@nxgt/mail`'s neutral `MailEvent`; any other Resend event type answers `null`. A bad or old signature throws `MailWebhookRefused` from the `@nxgt/mail` peer, so a handler answers `401`. The `@nxgt/mail` peer moves to `^0.8.0`: upgrade `@nxgt/mail` with it.

- [#71](https://github.com/softistx/nxgt-mail/pull/71) [`ce0ddf7`](https://github.com/softistx/nxgt-mail/commit/ce0ddf71b05c14a8ea7ede7e1a37c4039cbbcd1e) Thanks [@SteveGT96](https://github.com/SteveGT96)! - `createResendMailer(...)` now answers a `sendBatch`, a `cancel` and a
  `reschedule`, beside `send`.
  
  `sendBatch(messages)` calls Resend's `POST /emails/batch` — up to 100
  messages per request (Resend's own limit); above it, split into as many
  requests as it takes. Every message is checked with `checkMessage` first, and
  two things `send` takes are refused in a batch instead, each on its own
  message, the rest unaffected: an attachment (Resend's batch does not support
  them yet) and a message's own `idempotencyKey` (Resend takes one
  `Idempotency-Key` per batch request, in the header, never one per message —
  none is sent for a batch request at all). A request of up to 100 that Resend
  refuses, or cannot be reached for, reports every message in it the same way —
  `refused` or `failed` — since Resend answers the whole request as one; a
  later request still runs, and is reported on its own.
  
  `cancel(messageId)` calls Resend's `POST /emails/{id}/cancel`, to stop a
  message `send` scheduled ahead before it goes out. `reschedule(messageId,
  scheduledAt)` calls its `PATCH /emails/{id}`, to move a scheduled message to a
  new time, held to the same 30-day and clock-skew rule as `send`. Both refuse
  with `@nxgt/mail`'s `MailScheduleRefused` — code `UNKNOWN_ID` for an id
  Resend does not hold pending, `ALREADY_SENT` for one it already sent — and
  throw `MailFailure` for anything else, Resend's answer as the `cause`.

### Patch Changes

- [#68](https://github.com/softistx/nxgt-mail/pull/68) [`d6d47f2`](https://github.com/softistx/nxgt-mail/commit/d6d47f2839f800ea48761d49809ad7db50395401) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail` peer moves to `^0.8.0`: upgrade `@nxgt/mail` with it.
- Updated dependencies [[`7e15c67`](https://github.com/softistx/nxgt-mail/commit/7e15c67cef150e86129b9d5be08d0e72d5f49140), [`ce0ddf7`](https://github.com/softistx/nxgt-mail/commit/ce0ddf71b05c14a8ea7ede7e1a37c4039cbbcd1e), [`d6d47f2`](https://github.com/softistx/nxgt-mail/commit/d6d47f2839f800ea48761d49809ad7db50395401), [`8bac69f`](https://github.com/softistx/nxgt-mail/commit/8bac69f02b5223fbf4e55c1799e93d3cee74bec0)]:
  - @nxgt/mail@0.8.0

## 0.5.0

### Minor Changes

- [#60](https://github.com/softistx/nxgt-mail/pull/60) [`5f9c8b8`](https://github.com/softistx/nxgt-mail/commit/5f9c8b8cf031b7654731dabfe3c6746c274fcd23) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Scheduled send: a message's `scheduledAt` is sent as Resend's `scheduled_at`, ISO 8601. Resend still answers an id right away; the e-mail itself goes out later. The `@nxgt/mail` peer moves to `^0.7.0`: upgrade `@nxgt/mail` with it.

### Patch Changes

- Updated dependencies [[`5f9c8b8`](https://github.com/softistx/nxgt-mail/commit/5f9c8b8cf031b7654731dabfe3c6746c274fcd23)]:
  - @nxgt/mail@0.7.0

## 0.4.0

### Minor Changes

- [#43](https://github.com/softistx/nxgt-mail/pull/43) [`9150a1e`](https://github.com/softistx/nxgt-mail/commit/9150a1e5e6ef7719709722e7578e1d3af5aabf13) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Inline images: an attachment's `contentId` is sent as Resend's `content_id`, so `<img src="cid:…">` shows it. The `@nxgt/mail` peer moves to `^0.6.0`: upgrade `@nxgt/mail` with it.

- [#50](https://github.com/softistx/nxgt-mail/pull/50) [`b51a759`](https://github.com/softistx/nxgt-mail/commit/b51a759d067efd87ad95932b77ed2488641ec9e6) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Tags: a message's `tags` are sent as Resend's `tags`, a list of `{ name, value }`, to group sends in its dashboard and webhooks. More than 75, Resend's limit, is refused with `MailRefused` — `send: Resend takes at most 75 tags on one e-mail` — before anything is sent.

### Patch Changes

- Updated dependencies [[`9150a1e`](https://github.com/softistx/nxgt-mail/commit/9150a1e5e6ef7719709722e7578e1d3af5aabf13), [`b51a759`](https://github.com/softistx/nxgt-mail/commit/b51a759d067efd87ad95932b77ed2488641ec9e6)]:
  - @nxgt/mail@0.6.0

## 0.3.2

### Patch Changes

- [#35](https://github.com/softistx/nxgt-mail/pull/35) [`59a82e4`](https://github.com/softistx/nxgt-mail/commit/59a82e42bf5a6577cbad1653d76b0068f94f8eb7) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail` peer moves to `^0.5.0`: upgrade `@nxgt/mail` with it.
- Updated dependencies [[`59a82e4`](https://github.com/softistx/nxgt-mail/commit/59a82e42bf5a6577cbad1653d76b0068f94f8eb7), [`7cac016`](https://github.com/softistx/nxgt-mail/commit/7cac016adddc10e7c4f5ff73c304838168239149)]:
  - @nxgt/mail@0.5.0

## 0.3.1

### Patch Changes

- [#31](https://github.com/softistx/nxgt-mail/pull/31) [`aa057e3`](https://github.com/softistx/nxgt-mail/commit/aa057e3850c72e1e8d25fb001aae6cb1c460a873) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail` peer moves to `^0.4.0`: upgrade `@nxgt/mail` with it. The docs point to its `listUnsubscribe` for one-click unsubscribe headers, sent as any other header; check that Resend's DKIM signature names them in `h=`.
- Updated dependencies [[`aa057e3`](https://github.com/softistx/nxgt-mail/commit/aa057e3850c72e1e8d25fb001aae6cb1c460a873)]:
  - @nxgt/mail@0.4.0

## 0.3.0

### Minor Changes

- [#29](https://github.com/softistx/nxgt-mail/pull/29) [`1294823`](https://github.com/softistx/nxgt-mail/commit/1294823764f19a3eb9107a6aac2dda8a00ea8bfe) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Sends a message's `idempotencyKey` as Resend's `Idempotency-Key` header, so a retry the caller makes within Resend's 24 hours answers the first send's id and delivers once. A `409 invalid_idempotent_request` — the key already used for another message — is a `MailRefused`; a `409 concurrent_idempotent_requests` — the same key still in progress — stays a `MailFailure`. An empty `headers` is no longer sent, as an empty `attachments` is not. The `@nxgt/mail` peer moves to `^0.3.0`.

### Patch Changes

- Updated dependencies [[`1294823`](https://github.com/softistx/nxgt-mail/commit/1294823764f19a3eb9107a6aac2dda8a00ea8bfe)]:
  - @nxgt/mail@0.3.0

## 0.2.0

### Minor Changes

- [#27](https://github.com/softistx/nxgt-mail/pull/27) [`69b4b35`](https://github.com/softistx/nxgt-mail/commit/69b4b351cf8fda0ae151393d1475f638cc2b474a) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Sends attachments: each of a message's `attachments` goes in Resend's `attachments` as `{ filename, content, content_type }`, the bytes in base64 — encoded with no Node built-in, so the transport still runs on an edge runtime. Resend's `path` (a URL it would fetch) is never used. Resend answers an attachment over its 40 MB (after base64) with a `422` `invalid_attachment`, already a `MailRefused`; a `413` — a request too large for what sits in front of the API — is now a `MailRefused` too, as a `400` or `422` is; it was a `MailFailure`. The `@nxgt/mail` peer moves to `^0.2.0`, the minor with attachments. Passes the thirteen cases of `@nxgt/mail/conformance`.

### Patch Changes

- Updated dependencies [[`69b4b35`](https://github.com/softistx/nxgt-mail/commit/69b4b351cf8fda0ae151393d1475f638cc2b474a)]:
  - @nxgt/mail@0.2.0

## 0.1.0

### Minor Changes

- [#24](https://github.com/softistx/nxgt-mail/pull/24) [`a5cd029`](https://github.com/softistx/nxgt-mail/commit/a5cd0290fc441edd19fc7cf971a04353f6db64c0) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The first release: a Resend transport for `@nxgt/mail`, over `fetch`, with no SDK and no dependency.
  
  - `createResendMailer({ apiKey, from })`: one `POST /emails` per message, no Node built-in, so it runs on an edge runtime too. Each message is checked as every transport checks it, and a name is sent quoted so it names one recipient.
  - A `400` or `422` is a `MailRefused`; a bad key, a rate limit, an outage, a network error or a timeout is a `MailFailure`, what Resend answered on `cause`. The classes are `@nxgt/mail`'s, so `instanceof` holds.
  - The transport tries once, a `429` included; a retry is the caller's decision. It passes the `@nxgt/mail/conformance` suite against a local server answering as Resend does.

### Patch Changes

- Updated dependencies [[`12fd622`](https://github.com/softistx/nxgt-mail/commit/12fd6229cd15bee8b0015ea7d46e514961b9dc5e)]:
  - @nxgt/mail@0.1.0
