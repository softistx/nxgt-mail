---
"@nxgt/mail-smtp": minor
---

Inline images: an attachment's `contentId` is handed to nodemailer as its `cid` — a `Content-ID` header, `Content-Disposition: inline`, in a `multipart/related` beside the HTML — so `<img src="cid:…">` shows it. The `@nxgt/mail` peer moves to `^0.6.0`: upgrade `@nxgt/mail` with it.
