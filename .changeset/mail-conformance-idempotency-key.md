---
"@nxgt/mail": minor
---

The conformance suite checks the idempotency key: a fourteenth case,
`send.idempotencyKey`, sends a message with an `idempotencyKey` and expects it
delivered, answering `SentMail`, with the key in none of its recipients,
subject, HTML or text. The key is fresh on every run. A transport that refused
keyed messages now fails the suite.

`listUnsubscribe` writes the URL as a parser reads it — `new URL(url).href`,
so `https://EXAMPLE.test` is written `https://example.test/` and a `'` in the
query becomes `%27` — and checks what it writes as well as what it was given:
a `%` that starts no escape (`%`, `%zz`), and a host escape the parser decodes
into a refused character (`https://a%2Cb.test/`), are refused with
`MailRefused`.
