---
'@nxgt/mail': minor
---

`createMailRenderer` accepts `{ files }`, the build's files in memory (relative path to content, `mail-manifest.json` included), as an alternative to `{ dir }`; give exactly one of the two. For templates inlined in a bundle, with no folder to read.
