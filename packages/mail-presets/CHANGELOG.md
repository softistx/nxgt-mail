# @nxgt/mail-presets

## 1.1.0

### Minor Changes

- [#92](https://github.com/softistx/nxgt-mail/pull/92) [`9e65306`](https://github.com/softistx/nxgt-mail/commit/9e65306a95d66da3e757976f77563d25e57428d2) Thanks [@SteveGT96](https://github.com/SteveGT96)! - A fifteenth preset, `confirm-action`: a one-time code e-mailed to confirm a sensitive action (step-up re-authentication: changing the e-mail address, turning off two-factor, deleting the account), written with `@nxgt/mail-ui` components in `en` and `fr`. It takes `name`, `code`, `expiresIn` (text, as `sign-in-code`) and `link` (a URL, to secure the account). It does not name the action: the renderer refuses a missing variable, so there is no optional placeholder to carry it. `PRESETS` now lists fifteen names; `only` accepts any of them.

## 1.0.1

### Patch Changes

- [#90](https://github.com/softistx/nxgt-mail/pull/90) [`f608216`](https://github.com/softistx/nxgt-mail/commit/f6082163f39e385149b013b69a3283cc1688bd37) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The Node floor is now checked in CI, and corrected where it was wrong. `@nxgt/mail`, `-smtp` and `-resend` run on Node `>=20`: CI imports every JavaScript subpath of the packed package under Node 20. `@nxgt/mail-config`, `-i18n`, `-ui` and `-presets` run inside `maizzle build`, which needs Node `^22.22.3`, `^24.15.0` or `>=26` (Maizzle 6's own dependencies require it), not `>=20` as 1.0.0's READMEs said; CI builds the starter at Node 22.22.3.
- Updated dependencies [[`f608216`](https://github.com/softistx/nxgt-mail/commit/f6082163f39e385149b013b69a3283cc1688bd37)]:
  - @nxgt/mail-i18n@1.0.1
  - @nxgt/mail-ui@1.0.1

## 1.0.0

### Major Changes

- [#88](https://github.com/softistx/nxgt-mail/pull/88) [`cdf3e69`](https://github.com/softistx/nxgt-mail/commit/cdf3e6966a51a1154a35034c6db488ec6a3b97cc) Thanks [@SteveGT96](https://github.com/SteveGT96)! - 1.0.0: the surface is stable. From here, a breaking change waits for the next major; the policies are in `docs/plan-1.0.md`.
  
  Every internal peer moves to `^1.0.0` in this release, so upgrade the `@nxgt/mail*` packages together.
  
  The one breaking change: `@nxgt/mail` drops the three aliases deprecated in 0.9, as their doc comments announced. Rename them when you upgrade:
  
  - `withTelemetry` → `withMailTelemetry`
  - `withRendererTelemetry` → `withMailRendererTelemetry`
  - `RetryOptions` → `MailRetryOptions`
  
  The other six packages change no API. A prebuilt format-1 build still reads with any `@nxgt/mail` (`MANIFEST_FORMAT` stays 1), so a package that ships one can peer `@nxgt/mail` `>=0.1.0 <2`.

### Minor Changes

- [#86](https://github.com/softistx/nxgt-mail/pull/86) [`662cf54`](https://github.com/softistx/nxgt-mail/commit/662cf54a47aaf6498e4aa4fd85ddf672979ce654) Thanks [@SteveGT96](https://github.com/SteveGT96)! - A fourteenth preset, `recovery-code-used`: a security notice for a spent second-factor recovery code, written with `@nxgt/mail-ui` components in `en` and `fr`. It takes `name`, `when` (the time the code was used, text the sender writes, as `new-sign-in.time`), `recoveryCodesLeft` (also text the sender writes — the build cannot pick an ICU plural branch for a count it only learns at send time, so `recovery-code-used.codes-left` carries the plural for your code to format with `createTranslator` and the real count) and `link` (a URL, to regenerate codes or secure the account). `PRESETS` now lists fourteen names; `only` accepts any of them.

### Patch Changes

- Updated dependencies [[`d7b1ea6`](https://github.com/softistx/nxgt-mail/commit/d7b1ea689609960a61c46c16560f94a303ac5c1e), [`cdf3e69`](https://github.com/softistx/nxgt-mail/commit/cdf3e6966a51a1154a35034c6db488ec6a3b97cc)]:
  - @nxgt/mail-ui@1.0.0
  - @nxgt/mail-i18n@1.0.0

## 0.4.4

### Patch Changes

- [#83](https://github.com/softistx/nxgt-mail/pull/83) [`0db7590`](https://github.com/softistx/nxgt-mail/commit/0db75908ebb7063d5620a1beabbb4d9c47c79739) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Name the supported Node floor, `>=20`, next to each package's peers.
- Updated dependencies [[`0db7590`](https://github.com/softistx/nxgt-mail/commit/0db75908ebb7063d5620a1beabbb4d9c47c79739)]:
  - @nxgt/mail-i18n@0.6.1
  - @nxgt/mail-ui@0.7.1

## 0.4.3

### Patch Changes

- [#81](https://github.com/softistx/nxgt-mail/pull/81) [`7aadece`](https://github.com/softistx/nxgt-mail/commit/7aadecef28e3bfed0324eb9000e0f4d88c23d14b) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail-ui` peer moves to `^0.7.0`: upgrade `@nxgt/mail-ui` with it.
- Updated dependencies [[`7aadece`](https://github.com/softistx/nxgt-mail/commit/7aadecef28e3bfed0324eb9000e0f4d88c23d14b), [`7aadece`](https://github.com/softistx/nxgt-mail/commit/7aadecef28e3bfed0324eb9000e0f4d88c23d14b)]:
  - @nxgt/mail-ui@0.7.0

## 0.4.2

### Patch Changes

- [#74](https://github.com/softistx/nxgt-mail/pull/74) [`025e4ea`](https://github.com/softistx/nxgt-mail/commit/025e4eabc8d4d288101882934497ee7246e970ac) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail-ui` peer moves to `^0.6.0`: upgrade `@nxgt/mail-ui` with it.
- Updated dependencies [[`025e4ea`](https://github.com/softistx/nxgt-mail/commit/025e4eabc8d4d288101882934497ee7246e970ac), [`025e4ea`](https://github.com/softistx/nxgt-mail/commit/025e4eabc8d4d288101882934497ee7246e970ac)]:
  - @nxgt/mail-ui@0.6.0

## 0.4.1

### Patch Changes

- [#72](https://github.com/softistx/nxgt-mail/pull/72) [`18cc72e`](https://github.com/softistx/nxgt-mail/commit/18cc72e0a398ae57afaa71531d37077fc5a1e7a6) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail-i18n` peer moves to `^0.6.0`: upgrade `@nxgt/mail-i18n` with it. No change here: `i18n({ catalogues, templates })` is unaffected by folder catalogues or `messages`, which are options this package does not set.

- [#73](https://github.com/softistx/nxgt-mail/pull/73) [`93825ae`](https://github.com/softistx/nxgt-mail/commit/93825ae8b9338d8b0d0b1749eb94275d14ff1ac2) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail-ui` peer moves to `^0.5.0`: upgrade `@nxgt/mail-ui` with it.
- Updated dependencies [[`18cc72e`](https://github.com/softistx/nxgt-mail/commit/18cc72e0a398ae57afaa71531d37077fc5a1e7a6), [`93825ae`](https://github.com/softistx/nxgt-mail/commit/93825ae8b9338d8b0d0b1749eb94275d14ff1ac2)]:
  - @nxgt/mail-i18n@0.6.0
  - @nxgt/mail-ui@0.5.0

## 0.4.0

### Minor Changes

- [#64](https://github.com/softistx/nxgt-mail/pull/64) [`50d84ca`](https://github.com/softistx/nxgt-mail/commit/50d84ca65aa63be3a3d47b26e28f1136ac48f2f6) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Four more presets, written with `@nxgt/mail-ui` components in `en` and `fr`, beside the existing nine: `two-factor-enabled` and `two-factor-disabled` (security, `name` and `link`), `account-deleted` (accounts, `name`, `link` and a required `expiresIn` for the restoration link — required for the same reason as `invitation.expires`: the server that grants the grace period knows its length, the build does not), and `invitation-accepted` (lifecycle, tells the inviter with `invitee`, `organization` and `link`). `PRESETS` now lists thirteen names; `only` accepts any of them.

### Patch Changes

- [#65](https://github.com/softistx/nxgt-mail/pull/65) [`a82da58`](https://github.com/softistx/nxgt-mail/commit/a82da58284b6a525c238081b84de907d8acd849e) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail-i18n` peer moves to `^0.5.0`: upgrade `@nxgt/mail-i18n` with it.

- [#62](https://github.com/softistx/nxgt-mail/pull/62) [`05c1795`](https://github.com/softistx/nxgt-mail/commit/05c17958f5daff004cbc9c4f18b0e66e8c41e52b) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail-ui` peer moves to `^0.4.0`: upgrade `@nxgt/mail-ui` with it.
- Updated dependencies [[`469d92f`](https://github.com/softistx/nxgt-mail/commit/469d92f0bafbac3a042dd6c28ea5c310e0df62e4), [`05c1795`](https://github.com/softistx/nxgt-mail/commit/05c17958f5daff004cbc9c4f18b0e66e8c41e52b), [`a82da58`](https://github.com/softistx/nxgt-mail/commit/a82da58284b6a525c238081b84de907d8acd849e), [`a524cec`](https://github.com/softistx/nxgt-mail/commit/a524cec715d74e973c9df62cd7686c88a99e0ab7), [`a82da58`](https://github.com/softistx/nxgt-mail/commit/a82da58284b6a525c238081b84de907d8acd849e)]:
  - @nxgt/mail-i18n@0.5.0
  - @nxgt/mail-ui@0.4.0

## 0.3.0

### Minor Changes

- [#55](https://github.com/softistx/nxgt-mail/pull/55) [`56b749b`](https://github.com/softistx/nxgt-mail/commit/56b749b42b20cfdff6930ce0c6a3619d401332c9) Thanks [@SteveGT96](https://github.com/SteveGT96)! - **Breaking.** Every preset's message key moves from `camelCase` to
  `kebab-case`, matching our convention and the templates' own file names
  (`@nxgt/mail-i18n` 0.4 still accepts the old `camelCase` form too, so
  nothing throws — but an override under the old key is now silently unread,
  and a template still calling the old key fails the build; see the
  troubleshooting entry for the exact error). The renamed keys, old → new:
  
  - `verifyEmail.*` → `verify-email.*`
  - `resetPassword.*` → `reset-password.*`
  - `passwordChanged.*` → `password-changed.*`
  - `emailChanged.*` → `email-changed.*`
  - `signInCode.*` → `sign-in-code.*`
  - `magicLink.*` → `magic-link.*`
  - `newSignIn.*` → `new-sign-in.*`
  - `presets.codeExpires` → `presets.code-expires`
  - `presets.linkExpires` → `presets.link-expires`
  - `presets.linkFallback` → `presets.link-fallback`
  - `presets.notYou` → `presets.not-you`
  
  `welcome.*` and `invitation.*` are one word and unchanged. Rename the keys
  in any `locales/<locale>.json` override, and in any template you replaced a
  preset with that still calls one by its old name.
  
  The `@nxgt/mail-i18n` peer moves to `^0.4.0` and the `@nxgt/mail-ui` peer to
  `^0.3.0`: upgrade both with it.

### Patch Changes

- Updated dependencies [[`56b749b`](https://github.com/softistx/nxgt-mail/commit/56b749b42b20cfdff6930ce0c6a3619d401332c9), [`56b749b`](https://github.com/softistx/nxgt-mail/commit/56b749b42b20cfdff6930ce0c6a3619d401332c9)]:
  - @nxgt/mail-i18n@0.4.0
  - @nxgt/mail-ui@0.3.0

## 0.2.0

### Minor Changes

- [#44](https://github.com/softistx/nxgt-mail/pull/44) [`948a85f`](https://github.com/softistx/nxgt-mail/commit/948a85fe3ddfc59d8825e539447c5add31da4571) Thanks [@SteveGT96](https://github.com/SteveGT96)! - **Breaking.** `verify-email`, `reset-password`, `magic-link`, `sign-in-code` and `invitation` take a new required variable, `expiresIn`: how long the link or the code stays valid, a duration your code writes already translated (`'1 hour'`, `'1 heure'`). It is shown under the button as `This link expires in {{ expiresIn }}.` / `Ce lien expire dans {{ expiresIn }}.`, under the code as `This code expires in {{ expiresIn }}.` / `Ce code expire dans {{ expiresIn }}.`, and in `invitation` as `This invitation expires in {{ expiresIn }}.` / `Cette invitation expire dans {{ expiresIn }}.`, in the HTML and the text part. The manifest lists it in those e-mails' `variables`, so the generated `MailEmails` requires it: add `expiresIn` to every `render` of these five e-mails, or the call no longer compiles, and throws `render: <email> needs the variable expiresIn` untyped. Two keys join the `presets` group, `presets.linkExpires` and `presets.codeExpires`, and one the `invitation` group, `invitation.expires`: a project that builds a locale other than `en` and `fr` translates them, with the `{expiresIn}` argument.

### Patch Changes

- [#45](https://github.com/softistx/nxgt-mail/pull/45) [`b150a4f`](https://github.com/softistx/nxgt-mail/commit/b150a4f58610f945d7d5a86f6ccfa438bf286d32) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail-ui` peer moves to `^0.2.0`: upgrade `@nxgt/mail-ui` with it.

- [#51](https://github.com/softistx/nxgt-mail/pull/51) [`8612394`](https://github.com/softistx/nxgt-mail/commit/8612394187df2a6e0e2bdafc681586ccb3c32c8d) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The README and the guides show the preview pictures of the version you install: a release pins their URLs to its own tag, where they pointed at 0.1.0 whatever the version.
- Updated dependencies [[`67c8852`](https://github.com/softistx/nxgt-mail/commit/67c8852440ffe86761c64b9307a6eeae8a31ee80), [`a4c91c4`](https://github.com/softistx/nxgt-mail/commit/a4c91c4396e2721a1914057f7c9b3118fcf02cb2), [`2a7b4db`](https://github.com/softistx/nxgt-mail/commit/2a7b4db2e8d26d6f6484bcef715591e1dba44fca), [`b150a4f`](https://github.com/softistx/nxgt-mail/commit/b150a4f58610f945d7d5a86f6ccfa438bf286d32), [`8612394`](https://github.com/softistx/nxgt-mail/commit/8612394187df2a6e0e2bdafc681586ccb3c32c8d), [`d1b4a69`](https://github.com/softistx/nxgt-mail/commit/d1b4a69be9c9ce6fb7ecd7d7b5cc383ddb165c49)]:
  - @nxgt/mail-i18n@0.3.1
  - @nxgt/mail-ui@0.2.0

## 0.1.2

### Patch Changes

- [#40](https://github.com/softistx/nxgt-mail/pull/40) [`4d6e59b`](https://github.com/softistx/nxgt-mail/commit/4d6e59bc9af0ad2aef5ea070e579c8638e0ed8ed) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail-i18n` peer moves to `^0.3.0`: upgrade `@nxgt/mail-i18n` with it.
- Updated dependencies [[`8af7126`](https://github.com/softistx/nxgt-mail/commit/8af7126087c1bd9a1f2087e065512dc85547f35a), [`4d6e59b`](https://github.com/softistx/nxgt-mail/commit/4d6e59bc9af0ad2aef5ea070e579c8638e0ed8ed), [`8af7126`](https://github.com/softistx/nxgt-mail/commit/8af7126087c1bd9a1f2087e065512dc85547f35a)]:
  - @nxgt/mail-i18n@0.3.0
  - @nxgt/mail-ui@0.1.1

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
