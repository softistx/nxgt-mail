---
"@nxgt/mail": minor
---

Scheduled send: `scheduledAt` on a `MailMessage`, a `Date` that sends the e-mail later instead of now. `checkMessage` refuses with `MailRefused` a value that is not a valid `Date`, one in the past (beyond a 60-second tolerance for clock skew), or more than 30 days ahead — Resend's own limit, held for every transport so a message built for one works on another. A transport that cannot schedule refuses the message rather than sending it now. The memory mailer records it, and includes it in the idempotency fingerprint, so the same key rescheduled to a different moment is a different message. The conformance suite gains `send.scheduled`: a scheduled send is either honoured — delivered with its `scheduledAt` — or refused with `MailRefused`, never sent as if it were absent.
