# Roadmap

Where `@nxgt/mail-ui` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

Nothing between releases.

## Next

Nothing yet.

## Later

Nothing yet. A request is welcome as an
[issue](https://github.com/softistx/nxgt-mail/issues).

## Not planned

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
- **`NxActivity`** — material-vue's `Activity` is not a feed: it keeps a part
  of a page mounted while hidden, to show it again without losing its state.
  An e-mail has no state to keep, and what is hidden is left out of it with
  `v-if`. An activity feed is `NxTimeline`.
- **A rating a reader sets in the e-mail** — `NxRating` is read only, or a row
  of links: a form field runs script, which an e-mail does not.
- **A relative logo or brand link** — refused by `ui()`: a mail client loads
  nothing relative, so `brand.logo.src` and `brand.url` are absolute
  `http(s)` URLs.

## Shipped

The last ten, newest first, each with the version it came in. Everything
before is in the [CHANGELOG](../CHANGELOG.md).

- **Optional dark muted, and two dark-primary fixes, v0.6.0** —
  `color-muted-dark` and `color-muted-foreground-dark`, the same pattern as
  `color-primary-dark`: defaulting to their light value, so a project that
  never sets them is unaffected. `NxCode`'s and `NxAvatarFallback`'s ground,
  `NxKbd`, `NxTimeline`'s default marker, a table's footer stripe,
  `NxAlert`'s `foreground` variant ground and every place muted text is used
  all carry it. Also fixed: the primary tints (`-15`/`-20`/`-40`/`-50`) now
  follow a project-set `color-primary-dark` instead of aliasing the light
  tint unconditionally, and `color-paper-dark` keeps mixing the light
  `color-primary`, never the dark one. See
  [Dark mode](guide/dark-mode.md#which-tokens-have-a-dark-value).
- **Optional dark primary, v0.5.0** — `color-primary-dark` and
  `color-primary-foreground-dark`, defaulting to their light value, so a
  project that never sets them is unaffected. Set them when a brand's
  near-black primary would otherwise melt into the dark card: `NxButton`,
  `NxLinkButton`, `NxIconButton`, `NxChip`, `NxBadge`'s default variant,
  `NxProgress` and `NxTimeline`'s `primary` marker all carry it, and
  `color-paper-dark` mixes it in place of the light value.
- **A placeholder where a number is computed fails the build, v0.4.0** —
  `NxAvatar`'s `size`, `NxLayout`'s `width` and `NxAvatarGroup`'s `max`
  given a placeholder failed silently (a truncated style, every avatar
  hidden); they now fail with the message the other computed props give. A
  spec checks every prop of every component against a placeholder.
- **Right-to-left languages, v0.4.0** — `NxLayout` writes `dir` on `<html>`,
  the body and the wrapper table, from `@nxgt/mail-i18n`'s `dir` (or a small
  built-in fallback list of right-to-left scripts). `NxAlert`, `NxCompareCard`,
  `NxStatCard`, `NxTimeline` and `NxSeeAlso` mirror their physical CSS — a
  border side, a padding, an alignment, the see-also arrow — for the
  direction they build in. See
  [Right-to-left languages](guide/right-to-left.md).
- **Dark mode, v0.4.0** — `NxLayout` and the components follow the mail
  client's dark theme, mirroring `@nxgt/material-vue`'s dark tokens
  (background, foreground, card, card-foreground, accent, accent-foreground
  and border); `theme` overrides a dark token the same way it overrides a
  light one. `brand.logo` and `NxFigure` take a `darkSrc`, shown instead of
  `src` under dark mode. Gmail cannot be targeted from CSS and always shows
  the light styles.
- **Shared messages under `kebab-case` keys, v0.3.0** — `common.avatarGroup.more`
  is `common.avatar-group.more`, and so on for every multi-word key; an
  override under the old key is no longer read. The full list is in the
  [CHANGELOG](../CHANGELOG.md).
- **Layout and content components, v0.2.0** — `NxSpacer` (vertical space in
  the theme's steps, on Maizzle's `<Spacer>`), `NxExtendedLabel`,
  `NxHighlightText`, `NxKbd`, `NxCountBadge`, `NxActionCard`, `NxFigure`,
  `NxLinkButton`, `NxIconButton` (its icon an image by URL or a character)
  and `NxButtonGroup`, with material-vue's names and props, and the shared
  message `common.countBadge.label` in `en` and `fr`. A count, a query or
  an icon given as a placeholder fails the build.
- **A tag that resolves to no component fails the build, v0.2.0** —
  `<NxButon>` for `<NxButton>`, nested anywhere in a template, a component or
  an installed template, fails `maizzle build`, naming the tag and the file,
  where Vue rendered it as an unknown element or as nothing and the build
  passed. An error while rendering fails the build under
  `NODE_ENV=production` too.
- **Details components, v0.2.0** — `NxEventChip` for an invitation's date and
  time, `NxAttributes`, `NxPostalAddress` (its country named in each
  locale), `NxOpeningHours`, `NxContacts` (linked with `mailto:` and
  `tel:`), `NxFileList` for attachments or downloads, with the size written
  by locale, and `NxRating`, read only or as a row of review links:
  material-vue's names and props, with their words in the shared messages
  in `en` and `fr`.
- **Installed files resolve as the project's do, v0.2.0** — a template or
  component installed from npm resolves its tags with Maizzle's own
  resolver, so the project's `components/` subfolders (`<BrandLogo>`) and
  every `components.source` folder count there too.
- **`@nxgt/mail-config` 0.2, v0.1.1** — the peer moves to `^0.2.0`, whose text
  part is laid out in paragraphs. The components do not change.
