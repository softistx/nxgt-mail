---
"@nxgt/mail-smtp": patch
---

Accepts `@nxgt/mail` 0.4. The docs point to its `listUnsubscribe` for one-click unsubscribe headers, sent as any other header; the relay (or nodemailer's `dkim` option) must DKIM-sign them.
