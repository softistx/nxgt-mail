# @nxgt/mail-ui

## 0.7.1

### Patch Changes

- [#83](https://github.com/softistx/nxgt-mail/pull/83) [`0db7590`](https://github.com/softistx/nxgt-mail/commit/0db75908ebb7063d5620a1beabbb4d9c47c79739) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Name the supported Node floor, `>=20`, next to each package's peers.
- Updated dependencies [[`0db7590`](https://github.com/softistx/nxgt-mail/commit/0db75908ebb7063d5620a1beabbb4d9c47c79739)]:
  - @nxgt/mail-config@0.2.2

## 0.7.0

### Minor Changes

- [#81](https://github.com/softistx/nxgt-mail/pull/81) [`7aadece`](https://github.com/softistx/nxgt-mail/commit/7aadecef28e3bfed0324eb9000e0f4d88c23d14b) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The optional `color-primary-dark`/`color-primary-foreground-dark` pair now
  also reaches `NxActionCard`'s active ring, icon box and indicator,
  `NxExtendedLabel`'s bar, `NxEventChip`'s bar and `selected` border,
  `NxFileList`'s extension badge and download link, `NxHighlightText`'s mark,
  `NxStatusIndicator`'s `primary` tone, `NxStepsItem`'s numbered circle and
  `NxSummaryData`'s row divider (`NxFileList`'s empty state, `NxRatioCard`'s
  right figure, `NxStatusIndicator`'s `neutral` tone and `NxStepsItem`'s body
  already carried `color-muted-dark` since 0.6.0). A project that never sets
  the tokens sees no change — the previews are pixel-identical.
  
  `NxHero`'s eyebrow and title, `NxListTile`'s idle and selected title/subtitle,
  and `NxEventChip`'s own ground stay un-wired to `color-primary-dark` on
  purpose: self-contained decorative grounds whose own text does not flip
  either.

### Patch Changes

- [#81](https://github.com/softistx/nxgt-mail/pull/81) [`7aadece`](https://github.com/softistx/nxgt-mail/commit/7aadecef28e3bfed0324eb9000e0f4d88c23d14b) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Fixed two dark-mode bugs found by a downstream project measuring actual
  contrast: `NxCode`, `NxAvatarFallback` and a table's footer flipped their
  ground with a project-set `color-muted-dark`, but pinned their own text to
  the unflipped `color-foreground` instead of following
  `color-muted-foreground-dark` alongside it — a near-black light-mode
  foreground over the new dark ground measured 1.36:1, now 11.87:1 for the
  documented pair. And `NxAlert`'s six colour variants, `NxBanner`'s four
  tones, `NxEventChip`'s compact title, `NxListTile`'s subtitle/disabled title
  and `NxHero`'s description flipped their text to `color-muted-foreground-dark`
  over a ground that has no dark twin at all and never flips (1.16:1 for a
  reported warning alert) — a text colour now flips only if its own ground
  does, so these stay un-flipped, back to their original light-mode contrast
  (4.46:1 for that alert) in both modes.
  
  Also fixed: `NxTypography`'s `caption` variant showed `color-foreground-dark`,
  not `color-muted-foreground-dark`, in dark mode (a stale class `twMerge`
  cannot drop on its own), and `NxProgress`'s track kept its default 20% dark
  tint even when a caller (`NxRatioCard`) retinted it to `-15`; both now read
  the light tint back to pick the matching dark one.
  
  A spec now builds every one of these text/ground pairs with the dark tokens
  set and checks each reaches at least 4.5:1. A project that never sets
  `color-primary-dark`/`color-muted-dark` sees no change either way.

## 0.6.0

### Minor Changes

- [#74](https://github.com/softistx/nxgt-mail/pull/74) [`025e4ea`](https://github.com/softistx/nxgt-mail/commit/025e4eabc8d4d288101882934497ee7246e970ac) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Optional dark tokens for the muted colour: `color-muted-dark` and
  `color-muted-foreground-dark`, the same pattern as `color-primary-dark` — both
  default to their light value, so a project that never sets them is unaffected
  and the previews are pixel-identical. Set them for a dark card that needs its
  own muted step (`NxCode`'s and `NxAvatarFallback`'s ground, `NxKbd`,
  `NxTimeline`'s default marker, a table's footer/`NxAlert`'s `foreground`
  variant ground, and every place muted text is used) to read against, e.g.
  `color-muted-dark: '#1e293b'` with `color-muted-foreground-dark: '#e2e8f0'`
  against a `#0f172b` card (11.9:1 for the text, a visible step above the card).
  `NxCode`, `NxAvatarFallback` and a table's footer keep their own text pinned to
  `color-foreground`, unflipped: pick a `color-muted-dark` light enough to keep
  it legible, or leave it unset.

### Patch Changes

- [#74](https://github.com/softistx/nxgt-mail/pull/74) [`025e4ea`](https://github.com/softistx/nxgt-mail/commit/025e4eabc8d4d288101882934497ee7246e970ac) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Fixed two bugs in the optional `color-primary-dark`/`color-primary-foreground-dark`
  pair (0.5.0): the primary tints (`-15`/`-20`/`-40`/`-50`, a tonal chip's ground,
  an outlined chip's border, `NxProgress`'s track, `NxTimeline`'s marker) kept
  aliasing their light twin even once `color-primary-dark` was set, instead of
  being mixed from it over the dark background — a tonal chip could end up with
  near-white text on a near-white ground (1.28:1); and `color-paper-dark` mixed
  `color-primary-dark` instead of the light `color-primary`, so a near-white
  `color-primary-dark` washed the page ground towards white too (1.02:1 against
  the dark card, down from 1.09:1).
  
  Both are fixed: the four tints are now recomputed against the dark background,
  at the same percentages the light tints use, once `color-primary-dark` is set
  (12.7–13.2:1 for the tonal text, 3.2–4.6:1 for the outlined border, in the
  reported case); `color-paper-dark` keeps mixing the light `color-primary`
  regardless. A project that never sets `color-primary-dark` sees no change —
  the previews are pixel-identical.

## 0.5.0

### Minor Changes

- [#73](https://github.com/softistx/nxgt-mail/pull/73) [`93825ae`](https://github.com/softistx/nxgt-mail/commit/93825ae8b9338d8b0d0b1749eb94275d14ff1ac2) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Optional dark tokens for the primary colour: `color-primary-dark` and
  `color-primary-foreground-dark`, both defaulting to their light value, so a
  project that never sets them is unaffected. Set them when a brand's
  near-black primary would otherwise melt into the dark card in dark mode.
  `NxButton`, `NxLinkButton`, `NxIconButton`, `NxChip` (`filled`, `tonal`,
  `outlined` and `link`), `NxBadge`'s default variant, `NxProgress` and
  `NxTimeline`'s `primary` marker all carry the dark twin, and `color-paper-dark`
  mixes it in place of the light value. See
  [Dark mode](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/docs/guide/dark-mode.md#which-tokens-have-a-dark-value).

## 0.4.0

### Minor Changes

- [#62](https://github.com/softistx/nxgt-mail/pull/62) [`05c1795`](https://github.com/softistx/nxgt-mail/commit/05c17958f5daff004cbc9c4f18b0e66e8c41e52b) Thanks [@SteveGT96](https://github.com/SteveGT96)! - `NxLayout` and the components follow the mail client's dark theme, mirroring
  `@nxgt/material-vue`'s dark tokens (background, foreground, card,
  card-foreground, accent, accent-foreground and border — primary, secondary,
  muted, success, info and warning stay the same in both modes, as
  material-vue's do). `theme.css` ships the dark values; `theme` overrides one
  the same way it overrides a light token (`'color-background-dark':
  '#0b1220'`), so a project overriding a brand colour reaches dark mode with it
  unchanged, and a project wanting a different dark value sets its `-dark`
  token directly.
  
  `<meta name="color-scheme" content="light dark">`,
  `<meta name="supported-color-schemes" content="light dark">` and
  `color-scheme: light dark` (inlined on `<html>`) tell a client dark mode is
  supported; a `@media (prefers-color-scheme: dark)` block of classes recolours
  Apple Mail, iOS Mail, Outlook.com's web app and some Android clients, and the
  same rules repeat under `[data-ogsc]`/`[data-ogsb]` for Outlook.com and the
  Outlook desktop/mobile apps, which decide dark mode themselves instead of
  reading the media query. Gmail reads neither and always shows the inlined
  light styles — it cannot be targeted from CSS at all.
  
  `Brand.logo` and `NxFigure` take a `darkSrc`, shown instead of `src` under
  dark mode: the classic dark-logo-on-a-dark-background problem, solved with
  two images and a CSS visibility toggle rather than a `<picture>` element,
  which mail clients do not reliably support.
  
  See `docs/guide/dark-mode.md` for the full technique, the brand config, and
  what each client actually does.

- [#65](https://github.com/softistx/nxgt-mail/pull/65) [`a82da58`](https://github.com/softistx/nxgt-mail/commit/a82da58284b6a525c238081b84de907d8acd849e) Thanks [@SteveGT96](https://github.com/SteveGT96)! - `NxLayout` writes `dir` on `<html>`, the body and the wrapper table — Outlook
  needs it there too, not only on the document — from `@nxgt/mail-i18n`'s `dir`
  global when it is listed, else a small built-in list of right-to-left
  scripts by locale.
  
  `NxAlert`, `NxCompareCard`, `NxStatCard`, `NxTimeline`, `NxSeeAlso`,
  `NxListTile`, `NxEntityHeader`, `NxBreakdownCard`, `NxExtendedLabel`,
  `NxRatioCard`, `NxActionCard`, `NxCardHeader`, `NxBanner`,
  `NxSteps`/`NxStepsItem`, `NxSummaryData` and `NxTableHead` mirror their
  physical CSS for the direction they build in: email clients read
  `padding-left`/`padding-right`/`border-left`/`border-right` and
  `text-align: left/right` far more reliably than the logical properties that
  would otherwise make a component direction-agnostic, and a template's
  direction is known when it is built. An alert's accent bar and icon gap, a
  compare card's delta and its two boxes, a stat card's icon and delta, a
  timeline's connecting line and its title's and time's gap, a see-also's
  external-link arrow (mirrored, `↗` becomes `↖`), and every other listed
  component's own asymmetric gap, border or alignment (a list tile's trailing
  slot, an entity header's actions, a summary row's label/value alignment, a
  table head's default alignment, and so on) all flip together with the
  table's own `dir`.
  
  `dirOf` is a new internal helper (`components/ui.ts`, shipped as source like
  the rest): read `@nxgt/mail-i18n`'s `dir` global when it is there, else
  derive one from the locale's base language subtag against the same
  fallback list `@nxgt/mail-i18n` keeps.
  
  The plain-text part is unaffected: the mirrored glyphs stay inside
  `data-maizzle-html-only` in every direction, as before.
  
  See `docs/guide/right-to-left.md` for the full technique and what stays your
  own project's job — `uiCatalogues` ships `en`/`fr` only, so a right-to-left
  locale needs its own translation of the shared `common.*` keys it uses, same
  as any other added locale.

### Patch Changes

- [#63](https://github.com/softistx/nxgt-mail/pull/63) [`a524cec`](https://github.com/softistx/nxgt-mail/commit/a524cec715d74e973c9df62cd7686c88a99e0ab7) Thanks [@SteveGT96](https://github.com/SteveGT96)! - A generic spec now checks every prop of every component against `placeholder('x')`: read from each component's own `defineProps`, so a new component or prop with no declared expectation fails it. It found three props that silently corrupted or mis-rendered a placeholder instead of failing the build: `NxAvatar`'s `size`, `NxAvatarGroup`'s `max`, and `NxLayout`'s `width` now throw the same "must be a number known when the e-mail is built" message `NxProgress`, `NxCountBadge` and `NxRating` already did.

## 0.3.0

### Minor Changes

- [#55](https://github.com/softistx/nxgt-mail/pull/55) [`56b749b`](https://github.com/softistx/nxgt-mail/commit/56b749b42b20cfdff6930ce0c6a3619d401332c9) Thanks [@SteveGT96](https://github.com/SteveGT96)! - **Breaking.** The shared `common.*` messages of `uiCatalogues` move to
  `kebab-case`, matching our convention (`@nxgt/mail-i18n` 0.4 still accepts
  the old `camelCase` form too, so nothing throws — but an override under the
  old key is now silently unread, and a template still calling the old key
  fails the build; see the troubleshooting entry for the exact error). The
  renamed keys, old → new:
  
  - `common.avatarGroup.more` → `common.avatar-group.more`
  - `common.metrics.ofTarget` → `common.metrics.of-target`
  - `common.metrics.thisPeriod` → `common.metrics.this-period`
  - `common.metrics.lastPeriod` → `common.metrics.last-period`
  - `common.seeAlso` → `common.see-also`
  - `common.countBadge.label` → `common.count-badge.label`
  - `common.fileList.empty` → `common.file-list.empty`
  - `common.fileList.download` → `common.file-list.download`
  - `common.fileList.size` → `common.file-list.size`
  - `common.postalAddress` → `common.postal-address`
  - `common.openingHours.label` → `common.opening-hours.label`
  - `common.openingHours.closed` → `common.opening-hours.closed`
  - `common.openingHours.days.*` → `common.opening-hours.days.*`
  
  Every other `common.*` key is one word and unchanged (`common.greeting`,
  `common.attributes`, `common.rating.star`, `common.footer.*`, `common.timeline.empty`, `common.contacts.*`). Rename the keys in any
  `locales/<locale>.json` override that touches them; the components
  themselves need no change.

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
