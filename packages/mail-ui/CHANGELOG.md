# @nxgt/mail-ui

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
