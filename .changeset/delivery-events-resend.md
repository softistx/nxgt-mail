---
"@nxgt/mail-resend": minor
---

Webhooks: a new `@nxgt/mail-resend/webhooks` subpath. `createResendWebhook({ secret })` verifies Resend's Svix signature — the headers `svix-id`, `svix-timestamp` and `svix-signature`, HMAC-SHA256 over `${svix-id}.${svix-timestamp}.${body}` against the `whsec_…` secret, several space-separated signatures accepted during secret rotation, a 5-minute timestamp tolerance — with Web Crypto only, so it runs on Node, Bun, Deno and an edge or workers runtime alike. `verify(request)` maps `email.delivered`, `email.bounced`, `email.complained`, `email.delivery_delayed`, `email.opened` and `email.clicked` to `@nxgt/mail`'s neutral `MailEvent`; any other Resend event type answers `null`. A bad or old signature throws `MailWebhookRefused` from the `@nxgt/mail` peer, so a handler answers `401`. The `@nxgt/mail` peer moves to `^0.8.0`: upgrade `@nxgt/mail` with it.
