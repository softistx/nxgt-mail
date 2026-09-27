---
"@nxgt/mail-i18n": patch
---

`generated/mail.ts` is output of the build, as `dist/` is: git-ignore it and build before type-checking (`"typecheck": "maizzle build && tsc --noEmit"`), rather than commit it. Its header now says so (`// Never edited, never committed: git-ignore it, and build before type-checking.`), and the troubleshooting page covers `Cannot find module './generated/mail'` in a fresh clone.
