---
"@nxgt/mail": minor
---

Attachments: a `MailMessage` can carry files, as bytes.

- `attachments?: readonly MailAttachment[]` on `MailMessage`, each `{ filename, content, contentType }` with `content` a `Uint8Array` (a Node `Buffer` is one). Bytes only — no path, no URL, no stream — so a transport never reads a file or fetches a URL for you. A large or sensitive file stays a signed link in the template, a URL variable. Inline (`cid:`) images are not supported yet.
- `checkMessage` refuses, with `MailRefused` naming where and never the file's name: `attachments` that is not an array, an entry that is not an object, `content` that is not a `Uint8Array`, a `filename` that is empty or holds `/`, `\`, a line break or a control character, and a `contentType` that is not a bare `type/subtype`. An empty list is the same as none.
- `createMemoryMailer()` keeps the attachments in its outbox, with a copy of their bytes.
- `@nxgt/mail/conformance`: two new cases, thirteen in all — `send.attachment` (a file of every byte from 0 to 255, named `reçu n° 42.pdf`, arrives byte for byte with its name and its type) and `send.refusesAttachmentPath`. `DeliveredMail` gains an optional `attachments`, so an existing harness still compiles, but `send.attachment` fails on one that does not read them back, saying so: read them back, or skip the case with its reason. `sampleAttachment` is exported.
- Four new compile-time refusals, twenty-one in all: `content` as a string, a `path` instead of the bytes, no `contentType`, one attachment not in a list.

A transport that sends attachments reads `message.attachments` and needs this minor as its peer (`^0.2.0`): on `0.x`, `^0.1.0` does not allow it.
