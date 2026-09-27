---
"@nxgt/mail": minor
---

Delivery events: `MailEvent`, the neutral shape a provider's webhook is mapped to — `delivered`, `bounced` (`bounceType`, `'hard'` or `'soft'`), `complained`, `delayed`, and, optional and marked `tracking: true`, `opened` and `clicked`. Every event carries `messageId` (the id `send` answered), `recipient`, `timestamp`, `tags` and `raw`, the provider's own payload untouched — no PII beyond what the provider already sends. `MailWebhookRefused` (codes `INVALID_SIGNATURE`, `EXPIRED_TIMESTAMP`) is what a provider's webhook subpath throws when the request itself cannot be trusted; an event type it does not map is `null`, never a throw. `@nxgt/mail/conformance` gains `sampleMailEvent` and `checkMailEvent`, for a second provider's mapping to check the same invariants `@nxgt/mail-resend/webhooks` does.
