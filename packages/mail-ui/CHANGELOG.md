# @nxgt/mail-ui

## 0.2.0

### Minor Changes

- [#46](https://github.com/softistx/nxgt-mail/pull/46) [`2a7b4db`](https://github.com/softistx/nxgt-mail/commit/2a7b4db2e8d26d6f6484bcef715591e1dba44fca) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Add the details components, in the style of `@nxgt/material-vue`: `NxEventChip` (an invitation's date and time, its tint mixed at build time), `NxAttributes`, `NxPostalAddress` (its country named in each locale), `NxOpeningHours`, `NxContacts` (linked with `mailto:` and `tel:`), `NxFileList` (attachments or downloads, the size written by locale) and `NxRating` (read only, or a row of review links).
  
  Their words are 21 new shared messages in `uiCatalogues`, in `en` and `fr`: `common.attributes`, `common.postalAddress`, `common.openingHours.*`, `common.contacts.*`, `common.fileList.*` and `common.rating.star`. A project with a locale other than `en` and `fr` writes them in its own catalogue, or its build fails on the first one missing, as for the other `common` keys — see [Another locale](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/docs/guide/messages.md#another-locale).

- [#45](https://github.com/softistx/nxgt-mail/pull/45) [`b150a4f`](https://github.com/softistx/nxgt-mail/commit/b150a4f58610f945d7d5a86f6ccfa438bf286d32) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Add the layout and content components, mirroring `@nxgt/material-vue` (all but `NxSpacer`, the e-mail's own): `NxSpacer` (vertical space in the theme's steps, on Maizzle's `<Spacer>`), `NxExtendedLabel`, `NxHighlightText`, `NxKbd`, `NxCountBadge`, `NxActionCard`, `NxFigure`, `NxLinkButton`, `NxIconButton` (its icon an image by absolute URL or a character) and `NxButtonGroup`, whose buttons are `rounded` and `tonal`, the one marked `data-state="active"` `filled`. `uiCatalogues` gains `common.countBadge.label` in `en` and `fr`: a project in another locale adds it. An `NxCountBadge` count, an `NxHighlightText` query or an `NxIconButton` icon given as a placeholder fails the build.

- [#47](https://github.com/softistx/nxgt-mail/pull/47) [`d1b4a69`](https://github.com/softistx/nxgt-mail/commit/d1b4a69be9c9ce6fb7ecd7d7b5cc383ddb165c49) Thanks [@SteveGT96](https://github.com/SteveGT96)! - A tag that resolves to no component fails the build, naming the tag and the file: `ui: <NxButon> in emails/welcome.vue is no component — check its name, or add the plugin or the components folder that brings it`. Before, Vue rendered a typo such as `<NxButon>` nested in a card as an unknown element, or as nothing, and the build passed. A component the app registers, and Maizzle's own, resolve and pass. Only a name a component can have is checked — PascalCase, or kebab-case with a `-` — and the literal `is` of `<component>`: an old HTML tag such as `<center>` and a namespaced one such as `<o:p>` are written as they are. `ui()` also sets Vue's `app.config.throwUnhandledErrorInProduction`, so an error while a template renders fails the build under `NODE_ENV=production` as it does in development.

### Patch Changes

- [#51](https://github.com/softistx/nxgt-mail/pull/51) [`a4c91c4`](https://github.com/softistx/nxgt-mail/commit/a4c91c4396e2721a1914057f7c9b3118fcf02cb2) Thanks [@SteveGT96](https://github.com/SteveGT96)! - A template or component installed from npm resolves its tags with Maizzle's own resolver, so they resolve as in a project's template: the project's `components/` subfolders (`components/brand/logo.vue` is `<BrandLogo>`) and every `components.source` folder, with its prefix, now count there too. Without Maizzle 6's resolver, the build fails with `ui: no component resolver of Maizzle was found — is @maizzle/framework 6 installed?`, which replaces `ui: @maizzle/framework is not installed beside @nxgt/mail-ui`.

- [#51](https://github.com/softistx/nxgt-mail/pull/51) [`8612394`](https://github.com/softistx/nxgt-mail/commit/8612394187df2a6e0e2bdafc681586ccb3c32c8d) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The README and the guides show the preview pictures of the version you install: a release pins their URLs to its own tag, where they pointed at 0.1.0 whatever the version.
- Updated dependencies [[`67c8852`](https://github.com/softistx/nxgt-mail/commit/67c8852440ffe86761c64b9307a6eeae8a31ee80), [`aa4f748`](https://github.com/softistx/nxgt-mail/commit/aa4f7480142d8cae4023048f77fdade17aa700f0)]:
  - @nxgt/mail-config@0.2.1

## 0.1.1

### Patch Changes

- [#38](https://github.com/softistx/nxgt-mail/pull/38) [`8af7126`](https://github.com/softistx/nxgt-mail/commit/8af7126087c1bd9a1f2087e065512dc85547f35a) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The `@nxgt/mail-config` peer moves to `^0.2.0`: upgrade `@nxgt/mail-config` with it.
- Updated dependencies [[`8af7126`](https://github.com/softistx/nxgt-mail/commit/8af7126087c1bd9a1f2087e065512dc85547f35a)]:
  - @nxgt/mail-config@0.2.0

## 0.1.0

### Minor Changes

- [#24](https://github.com/softistx/nxgt-mail/pull/24) [`c1cfb52`](https://github.com/softistx/nxgt-mail/commit/c1cfb5263185ac03d282c15f32e593a8afcb1d3b) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The first release: e-mail components in the style of `@nxgt/material-vue`, for a Maizzle 6 project.
  
  - `ui({ brand, theme })`, a plugin for `@nxgt/mail-config`'s `defineMailConfig`: the `Nx*` components in every template, the brand in the layout's header and footer (a relative logo or link is refused), and `brand` typed in templates. A project's `components/nx-button.vue` replaces ours by name.
  - The components: `NxLayout`, `NxTypography`, `NxButton`, `NxLink`, `NxSeparator`, `NxCard` and its parts, `NxBadge`, `NxAlert`, `NxBanner`, `NxStatusIndicator`, `NxSummaryData`, `NxCode`, `NxTable` and its parts, `NxDescription`, `NxListTile`, `NxChip`, `NxAvatar`/`NxAvatarGroup`, `NxProgress`, `NxSteps`, `NxTimeline`, `NxHero`, `NxEntityHeader`, the metric cards and `NxSeeAlso` — material-vue's names with the `Nx` prefix and its `variant`, `color` and `size` props, rendered with tables and inlined styles, and checked against the support data of Gmail, Outlook and Apple Mail.
  - `theme.css`: material-vue's light tokens, overridden by name with `ui({ theme })`; tints flattened to plain colours.
  - `uiCatalogues`: the shared `common.*` messages in `en` and `fr`, for `@nxgt/mail-i18n`, overridden key by key by your own catalogues.
  - Components and templates installed under `node_modules` — ours, and a package's such as `@nxgt/mail-presets`' — render as they do in a workspace.

### Patch Changes

- Updated dependencies [[`36ff768`](https://github.com/softistx/nxgt-mail/commit/36ff768079199c800b4491232d48e47b2936845f)]:
  - @nxgt/mail-config@0.1.0
