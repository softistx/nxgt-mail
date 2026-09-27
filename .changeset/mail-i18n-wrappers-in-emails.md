---
"@nxgt/mail-i18n": minor
---

The wrappers move from `.maizzle/i18n/` to `.maizzle/emails/`, and
`WRAPPERS_DIR` is now `'.maizzle/emails'`: `maizzle serve` lists the e-mails
under `.maizzle/emails/en` and `.maizzle/emails/fr`, which says what they are.
The build output is unchanged — `dist/en/verify-email.html` and the manifest
stay where they were. After upgrading, delete the old `.maizzle/i18n/` folder:
nothing reads it any more.
