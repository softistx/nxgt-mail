---
"@nxgt/mail-ui": minor
---

The first release: e-mail components in the style of `@nxgt/material-vue`, for a Maizzle 6 project.

- `ui({ brand, theme })`, a plugin for `@nxgt/mail-config`'s `defineMailConfig`: the `Nx*` components in every template, the brand in the layout's header and footer (a relative logo or link is refused), and `brand` typed in templates. A project's `components/nx-button.vue` replaces ours by name.
- The components: `NxLayout`, `NxTypography`, `NxButton`, `NxLink`, `NxSeparator`, `NxCard` and its parts, `NxBadge`, `NxAlert`, `NxBanner`, `NxStatusIndicator`, `NxSummaryData`, `NxCode`, `NxTable` and its parts, `NxDescription`, `NxListTile`, `NxChip`, `NxAvatar`/`NxAvatarGroup`, `NxProgress`, `NxSteps`, `NxTimeline`, `NxHero`, `NxEntityHeader`, the metric cards and `NxSeeAlso` — material-vue's names with the `Nx` prefix and its `variant`, `color` and `size` props, rendered with tables and inlined styles, and checked against the support data of Gmail, Outlook and Apple Mail.
- `theme.css`: material-vue's light tokens, overridden by name with `ui({ theme })`; tints flattened to plain colours.
- `uiCatalogues`: the shared `common.*` messages in `en` and `fr`, for `@nxgt/mail-i18n`, overridden key by key by your own catalogues.
- Components and templates installed under `node_modules` — ours, and a package's such as `@nxgt/mail-presets`' — render as they do in a workspace.
