---
'@nxgt/mail-presets': minor
---

**Breaking.** `verify-email`, `reset-password`, `magic-link` and `sign-in-code` take a new required variable, `expiresIn`: how long the link or the code stays valid, a duration your code writes already translated (`'1 hour'`, `'1 heure'`). It is shown under the button as `This link expires in {{ expiresIn }}.` / `Ce lien expire dans {{ expiresIn }}.`, and under the code as `This code expires in {{ expiresIn }}.` / `Ce code expire dans {{ expiresIn }}.`, in the HTML and the text part. The manifest lists it in those e-mails' `variables`, so the generated `MailEmails` requires it: add `expiresIn` to every `render` of these four e-mails, or the call no longer compiles, and throws `render: <email> needs the variable expiresIn` untyped. Two keys join the `presets` group, `presets.linkExpires` and `presets.codeExpires`: a project that builds a locale other than `en` and `fr` translates them, with the `{expiresIn}` argument.
