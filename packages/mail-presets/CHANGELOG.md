# @nxgt/mail-presets

## 0.1.1

### Patch Changes

- [#36](https://github.com/softistx/nxgt-mail/pull/36) [`e9ed33d`](https://github.com/softistx/nxgt-mail/commit/e9ed33d3d813a6bcafb7c7e166839efc7113866b) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail-i18n` peer moves to `^0.2.0`: upgrade `@nxgt/mail-i18n` with it.
- Updated dependencies [[`7cac016`](https://github.com/softistx/nxgt-mail/commit/7cac016adddc10e7c4f5ff73c304838168239149), [`e9ed33d`](https://github.com/softistx/nxgt-mail/commit/e9ed33d3d813a6bcafb7c7e166839efc7113866b)]:
  - @nxgt/mail-i18n@0.2.0
  - @nxgt/mail-ui@0.1.0

## 0.1.0

### Minor Changes

- [#24](https://github.com/softistx/nxgt-mail/pull/24) [`50b521d`](https://github.com/softistx/nxgt-mail/commit/50b521ddafdb451049589d8f56fc08eece644124) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The first release: nine ready transactional e-mails, built by your own Maizzle project with your brand.
  
  - `verify-email`, `reset-password`, `password-changed`, `email-changed`, `sign-in-code`, `magic-link`, `new-sign-in`, `welcome` and `invitation`: templates of `@nxgt/mail-ui` components, their messages in `en` and `fr`, the values known only at send time left as placeholders.
  - `presets({ only })` answers `{ templates, catalogues }` for `@nxgt/mail-i18n`'s `i18n({ templates, catalogues })`; a preset that does not exist, or one named twice, is refused. `PRESETS`, `PresetName` and `presetCatalogues` name them.
  - A template of the same name in your `emails/` replaces a preset, and your `locales/<locale>.json` overrides any of its messages key by key.
  - `@nxgt/mail/renderer` sends the presets' build, each value filled and escaped.

### Patch Changes

- Updated dependencies [[`f4602d0`](https://github.com/softistx/nxgt-mail/commit/f4602d021a521fffe8ee779ba1eea4bcc750c1af), [`c1cfb52`](https://github.com/softistx/nxgt-mail/commit/c1cfb5263185ac03d282c15f32e593a8afcb1d3b)]:
  - @nxgt/mail-i18n@0.1.0
  - @nxgt/mail-ui@0.1.0
