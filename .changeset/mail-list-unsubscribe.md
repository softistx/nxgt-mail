---
"@nxgt/mail": minor
---

One-click unsubscribe: `listUnsubscribe({ url, mailto? })` answers the two headers of RFC 8058 — `List-Unsubscribe: <https://…>` (with `<mailto:…>` after it when given) and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` — to spread into a message's `headers`, as Gmail and Yahoo require of bulk senders. It refuses, with `MailRefused` and never quoting the value, a `url` that is not `https:` or holds whitespace, `<`, `>` or a raw comma (`listUnsubscribe: url must be an https: URL without whitespace, <, > or a raw comma`), and a `mailto` that is not a bare address (`listUnsubscribe: mailto must be a bare e-mail address, as unsubscribe@example.com`); options, a `url` or a `mailto` that are not text are a `TypeError`. A `URL` object as `url` is a compile error, twenty-three refusals in all. No transport changes: the headers travel as any other.
