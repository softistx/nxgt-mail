---
"@nxgt/mail": patch
"@nxgt/mail-smtp": patch
"@nxgt/mail-resend": patch
"@nxgt/mail-config": patch
"@nxgt/mail-i18n": patch
"@nxgt/mail-ui": patch
"@nxgt/mail-presets": patch
---

The Node floor is now checked in CI, and corrected where it was wrong. `@nxgt/mail`, `-smtp` and `-resend` run on Node `>=20`: CI imports every JavaScript subpath of the packed package under Node 20. `@nxgt/mail-config`, `-i18n`, `-ui` and `-presets` run inside `maizzle build`, which needs Node `^22.22.3`, `^24.15.0` or `>=26` (Maizzle 6's own dependencies require it), not `>=20` as 1.0.0's READMEs said; CI builds the starter at Node 22.22.3.
