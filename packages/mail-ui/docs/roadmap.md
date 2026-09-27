# Roadmap

Where `@nxgt/mail-ui` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

Built, not yet published:

- **Layout and content components** — `NxSpacer` (vertical space in the
  theme's steps, on Maizzle's `<Spacer>`), `NxExtendedLabel`,
  `NxHighlightText`, `NxKbd`, `NxCountBadge`, `NxActionCard`, `NxFigure`,
  `NxLinkButton`, `NxIconButton` (its icon an image by URL or a character)
  and `NxButtonGroup`, with material-vue's names and props, and the shared
  message `common.countBadge.label` in `en` and `fr`. A count, a query or
  an icon given as a placeholder fails the build.
- **A tag that resolves to no component fails the build** — `<NxButon>` for
  `<NxButton>`, nested anywhere in a template, a component or an installed
  template, fails `maizzle build`, naming the tag and the file, where Vue
  rendered it as an unknown element or as nothing and the build passed. An
  error while rendering fails the build under `NODE_ENV=production` too.

## Next

Nothing yet.

## Later

Nothing yet. A request is welcome as an
[issue](https://github.com/softistx/nxgt-mail/issues).

## Not planned

- **Dark mode** — an e-mail is light only: `theme.css` holds material-vue's
  light tokens and no dark ones, so every client starts from the same
  colours.
- **Icon fonts** — a mail client loads no icon font. An icon is an image by
  absolute URL or a character, passed through the `icon` slot of the
  components that have one.
- **Transparent colours, blurs and gradients** — a mail client drops an
  alpha, so a tint is flattened to a plain colour; `NxHero` comes without
  its blur or gradient for the same reason.
- **A dependency on `@nxgt/material-vue`** — the components follow its names,
  props and tokens, but are written for e-mail, with tables and inlined
  styles; nothing of material-vue is installed or imported.
- **Interactive components** — menus, dialogs, tabs, form fields: an e-mail
  runs no script, so only the components that make sense on a page that is
  read, not used, are mirrored.
- **`NxKbdShortcut`** — material-vue writes `⌘` or `Ctrl` by the reader's
  platform, which an e-mail cannot know when it is built: write each key with
  `NxKbd`.
- **A selectable `NxActionCard`, and hover or focus rings** — an e-mail runs
  no script and has no focus: an action card shows a choice already made
  (`active`), or links its title with `href`.
- **A router's `to`, `replace` and `target`** — an e-mail has no router:
  `NxLinkButton`'s `to` is a URL, and `NxIconButton`, which takes an `href`,
  stands for material-vue's `IconLinkButton`. `ResponsiveLinkButton`, which
  hides its text on a narrow screen, is not mirrored: a mail client's support
  of the media query it needs is too uneven to hide a button's words on.
- **A badge over a corner** — a mail client positions nothing: `NxCountBadge`
  sets its badge after its content, on the same line.
- **A relative logo or brand link** — refused by `ui()`: a mail client loads
  nothing relative, so `brand.logo.src` and `brand.url` are absolute
  `http(s)` URLs.

## Shipped

The last ten, newest first, each with the version it came in. Everything
before is in the [CHANGELOG](../CHANGELOG.md).

- **`@nxgt/mail-config` 0.2, v0.1.1** — the peer moves to `^0.2.0`, whose text
  part is laid out in paragraphs. The components do not change.
- **UI components as a plugin, v0.1.0** — `ui({ brand, theme })`, listed in
  `defineMailConfig`'s `plugins`: the `Nx*` components available in every
  template, the brand (name, link, logo by absolute URL) in the layout's
  header and footer, and a wrong option refused where the config is written.
  A project's `components/nx-button.vue` replaces ours by name.
- **The first set of components, in the style of `@nxgt/material-vue`, v0.1.0** —
  `NxLayout`, `NxTypography`, `NxButton`, `NxLink`, `NxSeparator`, `NxCard`
  and its parts, `NxBadge`, `NxAlert`, `NxBanner`, `NxStatusIndicator`,
  `NxSummaryData`, and `NxCode` for a one-time code: material-vue's names with
  the `Nx` prefix and its `variant`, `color` and `size` props, rendered with
  tables and inlined styles, and checked in the package's tests against the
  support data of Gmail, Outlook and Apple Mail.
- **The theme, `theme.css`, v0.1.0** — material-vue's light tokens, overridden by name
  with `ui({ theme: { 'color-primary': '#0f766e' } })`; its tints
  (`bg-primary-15`) are flattened to plain colours, and follow a colour you
  override.
- **Shared messages, v0.1.0** — `uiCatalogues`: `common.greeting`,
  `common.footer.why`, `common.footer.ignore`, `common.avatarGroup.more`,
  `common.timeline.empty`, `common.metrics.ofTarget`,
  `common.metrics.thisPeriod`, `common.metrics.lastPeriod` and
  `common.seeAlso` in `en` and `fr`, given to
  `@nxgt/mail-i18n` as `i18n({ catalogues: [uiCatalogues] })`, and overridden
  key by key by your own `locales/<locale>.json`.
- **Components and templates installed from npm, v0.1.0** — `ui()` resolves the
  tags of a `.vue` file under `node_modules` itself, since Maizzle does not:
  ours, and a package's templates such as `@nxgt/mail-presets`', render the
  same installed as in the workspace, with your `components/` still replacing
  ours by name.
- **`brand` typed in the editor, v0.1.0** — `ui()` writes
  `.maizzle/nxgt-mail-ui.d.ts`, which a Maizzle project's `tsconfig.json`
  includes, so templates see `brand` without importing anything.
- **The second set, first part, v0.1.0** — `NxTable` and its parts (a footer on the
  muted background, a caption, an empty row), `NxDescription`, `NxListTile`,
  `NxChip` (static) and `NxAvatar`/`NxAvatarGroup`, with material-vue's props,
  checked against the same support data.
- **The second set, second part, v0.1.0** — `NxProgress`, `NxSteps`/`NxStepsItem`
  and `NxTimeline`: a bar, numbered steps and toned events joined by a line
  that runs as far as their text in every client, the time of an event
  written as you give it.
- **The second set, third part, v0.1.0** — `NxHero`, `NxEntityHeader`, the metric
  cards `NxStatCard`, `NxGoalCard`, `NxRatioCard`, `NxCompareCard` and
  `NxBreakdownCard`, and `NxSeeAlso`: a summary e-mail's header, figures with
  a toned delta and its arrow, bars and links, checked against the same
  support data. With it, every material-vue component that fits an e-mail —
  one that is read, not used — has its `Nx` counterpart.
