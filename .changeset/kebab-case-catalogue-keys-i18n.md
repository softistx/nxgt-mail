---
"@nxgt/mail-i18n": minor
---

Every segment of a catalogue key may now be `kebab-case` as well as
`camelCase` — `verify-email.link-expires` beside `verifyEmail.linkExpires` —
checked by `checkCatalogues` with the same rule either way (no underscore,
no capital first letter, one word per nesting level, never dotted).
`TemplateMessages` and `MailEmails` type whichever a catalogue uses, so
`t('presets.link-expires')` and `t('verifyEmail.linkExpires')` both compile
when the key exists.

**Breaking**, for a template whose file name has a `-`: `emailKey`, which
finds an e-mail's subject key from its file path, no longer turns `-` into
a capital. `emailKey('verify-email')` was `'verifyEmail'`; it is now
`'verify-email'`, the same kebab-case as the file — `emailKey('auth/reset-password-2')` was `'auth.resetPassword2'`, now `'auth.reset-password-2'`. A
catalogue that wrote the old camelCase form for such a name moves its
top-level key to match the file; a single-word template (`welcome`,
`invitation`) is unaffected, since it has no `-` to keep.
