---
"@nxgt/mail": patch
---

Troubleshooting: when the text part is missing, leave `plaintext` out of the config rather than writing `plaintext: true`, which drops `@nxgt/mail-config`'s paragraphs.
