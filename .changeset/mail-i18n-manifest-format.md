---
"@nxgt/mail-i18n": minor
---

`mail-manifest.json` now starts with `"formatVersion": 1`, and
`MANIFEST_FORMAT` is exported: the format this version writes. It changes
only with the manifest's shape, and `@nxgt/mail`'s renderer reads every
format up to its own within 0.x. A build tool that ships its output can
assert the format it wrote against the renderer versions it supports.
