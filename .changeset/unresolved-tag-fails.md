---
'@nxgt/mail-ui': minor
---

A tag that resolves to no component fails the build, naming the tag and the file: `ui: <NxButon> in emails/welcome.vue is no component — check its name, or add the plugin or the components folder that brings it`. Before, Vue rendered a typo such as `<NxButon>` nested in a card as an unknown element, or as nothing, and the build passed. A component the app registers, and Maizzle's own, resolve and pass. `ui()` also sets Vue's `app.config.throwUnhandledErrorInProduction`, so an error while a template renders fails the build under `NODE_ENV=production` as it does in development.
