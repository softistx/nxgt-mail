# @nxgt/mail-i18n

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
