# @nxgt/mail-i18n

## 0.6.0

### Minor Changes

- [#72](https://github.com/softistx/nxgt-mail/pull/72) [`18cc72e`](https://github.com/softistx/nxgt-mail/commit/18cc72e0a398ae57afaa71531d37077fc5a1e7a6) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Catalogues can now be split into folders: under `dir` (default `locales`), a file at `<dir>/<locale>/**/*.json` is read beside `<dir>/<locale>.json`, and its path is a key prefix — `locales/en/mails.json` is `mails.*`, `locales/en/auth/sign-in.json` is `auth.sign-in.*`. A folder name or a file's basename must be `camelCase` or `kebab-case`, like any key segment; every locale needs the same files at the same paths as the fallback locale; and a key two files both claim — flat and folder, or two folder files — fails the build, naming both.
  
  `messages` is a new option, instead of `dir`: a module path whose default export is the resources object (`{ en: {...}, fr: {...} }`), or a function that answers one. Reading it is asynchronous, so `i18n({ messages })` answers a `Promise<MailPlugin>` — `await` it with a plain top-level `await` in `maizzle.config.ts`. Without `messages`, `i18n()` still answers the plugin directly.
  
  Both are read with `@nxgt/i18n-vue`'s own shared loader (`@nxgt/i18n-vue/node`), now a `^0.2.0` dependency; this package's own `checkCatalogues` — deliberately more lenient than `@nxgt/i18n-vue`'s (it does not refuse two conventions of the same key colliding) — still runs on the merged result, unchanged.

## 0.5.0

### Minor Changes

- [#65](https://github.com/softistx/nxgt-mail/pull/65) [`a82da58`](https://github.com/softistx/nxgt-mail/commit/a82da58284b6a525c238081b84de907d8acd849e) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Every template gets `dir`, beside `locale`: `'ltr'` or `'rtl'`, derived from
  the locale being built. `localeDirection(locale)` asks the runtime's own
  `Intl.Locale` first — Bun's `getTextInfo()`, Node 22's `textInfo` — and only
  falls back to a small built-in list of right-to-left scripts (Arabic,
  Hebrew, Persian, Urdu, Pashto, Sindhi, Uyghur, Yiddish, Divehi, Sorani
  Kurdish, Syriac, Aramaic, Khowar, Kashmiri, Ajami Hausa) when the runtime
  cannot answer, so a runtime with accurate data always wins. `localeDirection`
  is exported for use outside a template.
  
  `@nxgt/mail-ui`'s `NxLayout` writes it on `<html>`, the body and the wrapper
  table, and its components mirror their physical CSS for it — an alert's
  accent bar, a delta's and a see-also's arrow, a timeline's side. See
  `@nxgt/mail-ui`'s `docs/guide/right-to-left.md`.

### Patch Changes

- [#59](https://github.com/softistx/nxgt-mail/pull/59) [`469d92f`](https://github.com/softistx/nxgt-mail/commit/469d92f0bafbac3a042dd6c28ea5c310e0df62e4) Thanks [@SteveGT96](https://github.com/SteveGT96)! - `@nxgt/mail-i18n` now uses `@nxgt/i18n-vue/core` (a new, regular dependency —
  its functions hold no module-level state, so nothing calls for a peer)
  instead of its own copies of the catalogue and message types,
  `layerCatalogues` and `createFormatter`. Public behaviour is unchanged: every
  existing test, `@ts-expect-error` refusal and `@vue-expect-error` template
  refusal passes without editing.
  
  `TemplateKey` and `TemplateArgs` are now `@nxgt/i18n-vue/core`'s generic
  `KeyOf`/`ArgsOf`, parametrised over this package's own `TemplateMessages`
  instead of `@nxgt/i18n-vue`'s `I18nMessages` — the same generic logic this
  package had copied and specialised by hand.
  
  **`checkCatalogues` stays this package's own copy, deliberately.**
  `@nxgt/i18n-vue`'s version has grown a check this package does not want yet:
  it now refuses two conventions of the same key in one catalogue
  (`sign-in` and `signIn` both present), which would turn the fallback
  locale's silent acceptance of an old-camelCase override — see
  `docs/troubleshooting.md` — into an immediate build failure, in the very
  release that documents the silent case. Its message for a key that is
  neither camelCase nor kebab-case also gained a second example
  (`verifyEmail.title or verify-email.title`). Revisit once `@nxgt/mail-i18n`'s
  catalogues no longer need to carry both conventions.
  
  **`createTranslator` and its `Translate` type stay this package's own too**,
  for two more reasons `@nxgt/i18n-vue/core`'s versions do not hold:
  `Translate<K = MessageKey>` defaults its key type from `@nxgt/i18n-vue`'s own
  augmentable `I18nMessages` — re-exporting it unparametrised would have this
  package's `t()` pick up whatever keys an unrelated app registered with
  `@nxgt/i18n-vue` in the same TypeScript program, since declaration merging is
  global to the program, not to a file. Its `lookup` also matches a key across
  both conventions at the call site (`t('linkExpires')` now finds a catalogue's
  `link-expires`), the same leniency just rejected for `checkCatalogues`, and
  for the same reason: it would revive an old-key override at send time,
  outside the template build's own exact-match check. `createFormatter` has
  neither problem — no generic key type, no lookup — so it is the one function
  this package now takes from `@nxgt/i18n-vue/core` as is. (Found in review;
  fixed before merge.)
  
  **`readCatalogues` and `templateTypes`/`typesSource` stay too**, for a
  different reason: `@nxgt/i18n-vue`'s equivalents (`readCatalogues`,
  `typesSource`) live under `./node`, which is not in its `package.json`
  `exports` — not public API, so not importable here. `@nxgt/mail`'s
  `pickLocale`/`parseAcceptLanguage` were never imported by this package (only
  named in a docstring), so there was nothing to move for them.
  
  Also corrects `docs/troubleshooting.md`: an override under an old
  `camelCase` key is silently accepted only in the fallback locale's own file.
  The same override in another locale's file fails the build immediately,
  naming the locale and the key:
  
  ```
  i18n: fr: presets.linkExpires is not a key of en, the fallback locale
  ```
  
  The same correction lands in `@nxgt/mail-ui`'s and `@nxgt/mail-presets`'
  `docs/troubleshooting.md`, in a changeset of its own.

## 0.4.0

### Minor Changes

- [#55](https://github.com/softistx/nxgt-mail/pull/55) [`56b749b`](https://github.com/softistx/nxgt-mail/commit/56b749b42b20cfdff6930ce0c6a3619d401332c9) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Every segment of a catalogue key may now be `kebab-case` as well as
  `camelCase` — `verify-email.link-expires` beside `verifyEmail.linkExpires` —
  checked by `checkCatalogues` with the same rule either way (no underscore,
  no capital first letter, one word per nesting level, never dotted).
  `TemplateMessages` and `MailEmails` type whichever a catalogue uses, so
  `t('presets.link-expires')` and `t('verifyEmail.linkExpires')` both compile
  when the key exists.
  
  **Breaking**, for a template whose file name has a `-`: `emailKey`, which
  finds an e-mail's subject key from its file path, no longer turns `-` into
  a capital. `emailKey('verify-email')` was `'verifyEmail'`; it is now
  `'verify-email'`, the same kebab-case as the file — `emailKey('auth/reset-password-2')` was `'auth.resetPassword2'`, now `'auth.reset-password-2'`. A
  catalogue that wrote the old camelCase form for such a name moves its
  top-level key to match the file; a single-word template (`welcome`,
  `invitation`) is unaffected, since it has no `-` to keep.
  
  **The manifest is not affected.** `emailKey` only finds a message to
  translate at build time; the manifest's `emails` keys stay the template's
  own path (`verify-email`, `auth/reset-password`), its `variables` stay
  placeholder names, and its `subject` values are the translated text — none
  of which is a catalogue key. `formatVersion`/`MANIFEST_FORMAT` stays 1, and
  the fixture manifest this package's build is checked against
  (`test/fixture/mail-manifest.golden.json`) is unchanged, byte for byte, by
  this release: a manifest built after upgrading still reads with `@nxgt/mail`
  0.1.0's renderer.

## 0.3.1

### Patch Changes

- [#47](https://github.com/softistx/nxgt-mail/pull/47) [`67c8852`](https://github.com/softistx/nxgt-mail/commit/67c8852440ffe86761c64b9307a6eeae8a31ee80) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The docs say that, with `@nxgt/mail-ui`'s `ui()` in the plugins, a tag that resolves to no component fails the build, naming the tag and the file.
- Updated dependencies [[`67c8852`](https://github.com/softistx/nxgt-mail/commit/67c8852440ffe86761c64b9307a6eeae8a31ee80), [`aa4f748`](https://github.com/softistx/nxgt-mail/commit/aa4f7480142d8cae4023048f77fdade17aa700f0)]:
  - @nxgt/mail-config@0.2.1

## 0.3.0

### Minor Changes

- [#40](https://github.com/softistx/nxgt-mail/pull/40) [`4d6e59b`](https://github.com/softistx/nxgt-mail/commit/4d6e59bc9af0ad2aef5ea070e579c8638e0ed8ed) Thanks [@SteveGT96](https://github.com/SteveGT96)! - `mail-manifest.json` now starts with `"formatVersion": 1`, and
  `MANIFEST_FORMAT` is exported: the format this version writes. It changes
  only with the manifest's shape, and `@nxgt/mail`'s renderer reads every
  format up to its own within 0.x. A build tool that ships its output can
  assert the format it wrote against the renderer versions it supports.

### Patch Changes

- [#38](https://github.com/softistx/nxgt-mail/pull/38) [`8af7126`](https://github.com/softistx/nxgt-mail/commit/8af7126087c1bd9a1f2087e065512dc85547f35a) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail-config` peer moves to `^0.2.0`: upgrade `@nxgt/mail-config` with it.
- Updated dependencies [[`8af7126`](https://github.com/softistx/nxgt-mail/commit/8af7126087c1bd9a1f2087e065512dc85547f35a)]:
  - @nxgt/mail-config@0.2.0

## 0.2.0

### Minor Changes

- [#36](https://github.com/softistx/nxgt-mail/pull/36) [`e9ed33d`](https://github.com/softistx/nxgt-mail/commit/e9ed33d3d813a6bcafb7c7e166839efc7113866b) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The wrappers move from `.maizzle/i18n/` to `.maizzle/emails/`, and
  `WRAPPERS_DIR` is now `'.maizzle/emails'`: `maizzle serve` lists the e-mails
  under `.maizzle/emails/en` and `.maizzle/emails/fr`, which says what they are.
  The build output is unchanged — `dist/en/verify-email.html` and the manifest
  stay where they were. After upgrading, delete the old `.maizzle/i18n/` folder:
  nothing reads it any more.

### Patch Changes

- [#33](https://github.com/softistx/nxgt-mail/pull/33) [`7cac016`](https://github.com/softistx/nxgt-mail/commit/7cac016adddc10e7c4f5ff73c304838168239149) Thanks [@SteveGT96](https://github.com/SteveGT96)! - `generated/mail.ts` is output of the build, as `dist/` is: git-ignore it and build before type-checking (`"typecheck": "maizzle build && tsc --noEmit"`), rather than commit it. Its header now says so (`// Never edited, never committed: git-ignore it, and build before type-checking.`), and the troubleshooting page covers `Cannot find module './generated/mail'` in a fresh clone.

## 0.1.0

### Minor Changes

- [#24](https://github.com/softistx/nxgt-mail/pull/24) [`f4602d0`](https://github.com/softistx/nxgt-mail/commit/f4602d021a521fffe8ee779ba1eea4bcc750c1af) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The first release: i18n for a Maizzle 6 project — one template per e-mail, ICU catalogues, one output per locale from a single `maizzle build`.
  
  - `i18n({ locales, fallbackLocale })`, a plugin for `@nxgt/mail-config`'s `defineMailConfig`: `locales/<locale>.json` catalogues, and `dist/<locale>/<template>.html` (or `dist/<template>.<locale>.html` with `layout: 'flat'`). `maizzle serve` lists every locale.
  - `t`, `locale` and `placeholder` in templates: `t('verifyEmail.title')` translates in the template's locale; `placeholder('name')` writes `{{ name }}` for a value only known at send time.
  - The build fails, naming the locale and the key, on a catalogue that is missing or does not parse, a key that is not camelCase or missing in one locale, an argument invented, typed differently, missing or unused.
  - `dist/mail-manifest.json`: per e-mail, its variables, the ones that start a URL, its subject per locale and its files — what `@nxgt/mail/renderer` reads at send time. After each build, `generated/mail.ts` types that renderer (`MailEmails`).
  - Catalogues and templates from a package — `i18n({ catalogues, templates })` — merged under your project's, which override them by key and by name.
  - `.maizzle/nxgt-mail-i18n.d.ts`, written from the catalogues, types `t` in the editor and under `vue-tsc`. `createTranslator(catalogues, getLanguage)` formats a message outside templates.

### Patch Changes

- Updated dependencies [[`36ff768`](https://github.com/softistx/nxgt-mail/commit/36ff768079199c800b4491232d48e47b2936845f)]:
  - @nxgt/mail-config@0.1.0
