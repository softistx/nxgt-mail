---
"@nxgt/mail": minor
---

The conformance suite checks the idempotency key: a fourteenth case,
`send.idempotencyKey`, sends a message with an `idempotencyKey` and expects it
delivered, answering `SentMail`, with the key written nowhere in the e-mail. A
transport that refused keyed messages, or wrote the key into a header its
harness reads back, now fails the suite.

`listUnsubscribe` writes the URL as a parser reads it — `new URL(url).href`,
so `https://EXAMPLE.test` is written `https://example.test/` and a `'` becomes
`%27` — and refuses a `%` that starts no escape (`%`, `%zz`) with
`MailRefused`.
