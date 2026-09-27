---
"@nxgt/mail": minor
---

Inline images: `contentId` on a `MailAttachment` makes it an image the HTML shows as `<img src="cid:…">` (RFC 2392). `checkMessage` refuses, with `MailRefused` and never quoting the id, a `contentId` that is not 1 to 127 letters, digits and `. _ ~ + -` with at most one `@`, two attachments under one `contentId`, and a `cid:` URL the HTML uses — an attribute value, quoted or not, or a CSS `url()` — that no attachment's `contentId` names once percent-decoded, before a broken image goes out; a `cid:` in prose or in the text part is not read. A URL variable holding `cid:` stays refused by the renderer: a `cid:` is written in the template. The memory mailer keeps the id (and counts it for an idempotency key); the conformance suite gains `send.inlineImage` and exports `sampleInlineImage`, and `DeliveredMail.attachments` carries each `contentId` — a harness must read it back, bare, for the new case to pass.
