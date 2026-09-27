---
'@nxgt/mail-ui': patch
---

A template or component installed from npm resolves its tags with Maizzle's own resolver, so they resolve as in a project's template: the project's `components/` subfolders (`components/brand/logo.vue` is `<BrandLogo>`) and every `components.source` folder, with its prefix, now count there too. Without Maizzle 6's resolver, the build fails with `ui: no component resolver of Maizzle was found — is @maizzle/framework 6 installed?`, which replaces `ui: @maizzle/framework is not installed beside @nxgt/mail-ui`.
