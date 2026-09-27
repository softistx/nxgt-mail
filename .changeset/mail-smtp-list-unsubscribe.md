---
"@nxgt/mail-smtp": patch
---

The `@nxgt/mail` peer moves to `^0.4.0`: upgrade `@nxgt/mail` with it. The docs point to its `listUnsubscribe` for one-click unsubscribe headers, sent as any other header; the relay (or nodemailer's `dkim` option) must DKIM-sign them.
