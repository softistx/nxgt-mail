---
"@nxgt/mail": minor
---

An idempotency key per send: `idempotencyKey?: string` on `MailMessage` names the send, so sending it again — a retry after a timeout, a job run twice — delivers it once where the transport can deduplicate. A transport that can uses it; one that cannot ignores it. `checkMessage` refuses a key that is not 1 to 256 visible ASCII characters (`send: idempotencyKey must be 1 to 256 visible ASCII characters, as order-42/receipt`), never quoting it. `createMemoryMailer()` honours it as Resend does: the same message under a key it already delivered answers that delivery's `messageId` and delivers nothing more; a different message under that key is a `MailRefused` (`send: idempotencyKey was already used for a different message — a key names one e-mail`); a failed send leaves its key free; `clear()` forgets the keys.
