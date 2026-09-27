---
"@nxgt/mail": patch
---

A compatibility promise for the build: within 0.x, `createMailRenderer` reads
every manifest format up to its own, so a build from any earlier
`@nxgt/mail-i18n` 0.x keeps working with a newer `@nxgt/mail` — a package
that ships a prebuilt `mails/` folder can peer `@nxgt/mail` `>=0.1.0 <1`.
`@nxgt/mail/renderer` exports `MANIFEST_FORMAT` (1), the newest format it
reads; a manifest without `formatVersion` is format 1. A newer format is
refused at start-up: `… is manifest format 2, newer than this @nxgt/mail
reads (1) — upgrade @nxgt/mail`. The message for a manifest changed after the
build no longer asks to rebuild with the same version.
