---
"@nxgt/mail": minor
---

`@nxgt/mail/telemetry` — its own entry, so the root stays dependency-free:
`withTelemetry(mailer, { transport })` wraps a `Mailer` with a span
`mail.send` per send (kind `CLIENT`), and `withRendererTelemetry(renderer)`
wraps a `MailRenderer` with a span `mail.render` per render, the e-mail's
name always known there. Both record a duration histogram and a counter by
outcome (`ok`, `refused`, `failure`), `error.type` on the codes `@nxgt/mail`
throws, and never an address, a subject, a body, an attachment or a
placeholder's value — only a shape: a transport's name, a recipient count, a
tag's name, whether an idempotency key or a schedule was set.

`@opentelemetry/api` is an optional peer: with none installed, every call
still runs and produces nothing. See `docs/guide/observability.md` for the
attributes, the outcome rule (a refusal is an answer, a failure is not), and
the recommended order with a retry decorator.
