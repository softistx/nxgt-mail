---
"@nxgt/mail-smtp": minor
---

Sends attachments: each of a message's `attachments` is handed to nodemailer as `{ filename, content, contentType }`, the bytes copied into a `Buffer`, never a `path` or an `href` — `disableFileAccess` and `disableUrlAccess` stay on. nodemailer encodes a file name outside ASCII. A message over the server's size limit (`552`) is a `MailRefused`, as before. The `@nxgt/mail` peer moves to `^0.2.0`, the minor with attachments. Passes the thirteen cases of `@nxgt/mail/conformance`.
