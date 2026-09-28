# Dark mode

This page is for how `@nxgt/mail-ui` follows the mail client's dark theme:
the technique, per client, the brand's dark tokens and logo, and what
`caniemail.com` still calls partial support.

```ts
// maizzle.config.ts
ui({
	brand: {
		name: 'Acme',
		logo: {
			src: 'https://acme.example/logo-dark-on-transparent.png',
			darkSrc: 'https://acme.example/logo-light-on-transparent.png',
		},
	},
	theme: { 'color-background-dark': '#0b1220' },
});
```

## Why an e-mail cannot just ship one dark stylesheet

A browser page in dark mode re-reads its CSS live: a `prefers-color-scheme`
media query, or a class a script toggles. An e-mail's HTML is built once,
`@nxgt/mail-ui`'s light styles are **inlined** on every element as a `style`
attribute (`bun run build`'s `maizzle build` does this, with `juice`), and an
inline style always wins over an external one of the same importance. So a
second, external stylesheet with different colours changes nothing on its
own: it has to be **more specific than an inline style**, which only
`!important` gives it, and it has to be **written for a selector the built
HTML still carries** — a `class`, since juice drops the `style` it already
copied out, but keeps `class` when a rule in the kept stylesheet still needs
it.

That is the shape of every rule `@nxgt/mail-ui` ships: a class alongside the
light one (`class="bg-card nx-dark-bg-card"`), and an `!important` rule for
it in a stylesheet the build keeps.

## The technique, and who reads which part

| Piece | Read by |
| --- | --- |
| `<meta name="color-scheme" content="light dark">` and `<meta name="supported-color-schemes" content="light dark">` | Tell a client both are supported; several read only one of the two |
| `color-scheme: light dark` (inlined on `<html>`) | Chrome- and WebKit-based webmail (Outlook.com's own page chrome, Gmail's page chrome — never the message body) |
| `@media (prefers-color-scheme: dark) { .nx-dark-bg-card { … !important } }` | Apple Mail, iOS Mail, Outlook.com's web app, some Android clients |
| `[data-ogsc] .nx-dark-bg-card { … !important }` and the `[data-ogsb]` twin | Outlook.com and the Outlook desktop/mobile apps: they decide dark mode themselves and mark the document instead of exposing the media query |
| — (nothing) | **Gmail** (web, iOS, Android): reads neither the media query nor `data-ogs*`, and cannot be targeted from CSS at all. It always shows the inlined light styles — the safe, deliberate fallback |

`NxLayout` writes the meta tags and the `<style>` block; every component that
colours by a token needing a dark value carries the matching class
alongside its light one. The classes are plain (`nx-dark-bg-card`,
`nx-dark-text-foreground`, `nx-dark-text-foreground-25` (a rating's unfilled
star), `nx-dark-border-border`, `nx-dark-bg-paper`, `nx-dark-bg-background`,
`nx-dark-text-card-foreground`, `nx-light-only`/`nx-dark-only` for the
logo/image toggle below), not Tailwind
utilities: Maizzle's purge keeps a class only while a rule that needs it
survives, and `[data-ogs*` selectors are the one pattern its purge always
keeps, since no built HTML ever carries the attribute for the purge step to
match against — the same reason the classes here are hand-written rather
than generated per template.

## Which tokens have a dark value

`@nxgt/material-vue`'s `.dark` class only recolours **background,
foreground, card, card-foreground, accent, accent-foreground and border** —
**secondary, muted, success, info, warning and error keep the same value in
both modes there**. `@nxgt/mail-ui` mirrors exactly that split: that first
group has a `-dark` token (`color-background-dark`, …), the second has none.

**`primary` and `muted` keep their value too, unless you set one for dark
mode.** `color-primary-dark`/`color-primary-foreground-dark` and
`color-muted-dark`/`color-muted-foreground-dark` default to their light
value — a project that never sets them reaches dark mode with `color-primary`
and `color-muted` unchanged, for free, exactly as before these pairs of tokens
existed. Set them when the default does not work: a brand whose primary is
near-black, `#27272a`, is a crisp button on a white card, but melts into
`color-card-dark` (`oklch(0.208 0.042 265.755)`, close to it in luminance) on
a dark one — that project gives primary a lighter dark twin, and a dark
foreground to keep its text readable on it. A project that darkens its own
`color-card-dark` may similarly want `color-muted-dark` to still read as a
step above it — `color-muted-dark: '#1e293b'` against a `#0f172b` card, with
`color-muted-foreground-dark: '#e2e8f0'` at 11.87:1 over it.

Every place primary paints carries the matching `nx-dark-*` class, at
whatever strength it is used: `NxButton`, `NxLinkButton`, `NxIconButton` and
`NxChip` (`filled`, `tonal` and `outlined`, and the `link` variant),
`NxBadge`'s default variant, `NxProgress`'s track and fill, `NxTimeline`'s
`primary` marker, `NxActionCard`'s active ring, icon box and indicator,
`NxExtendedLabel`'s bar, `NxEventChip`'s bar (a `color` of `primary`) and its
`selected` border, `NxFileList`'s extension badge and download link,
`NxHighlightText`'s mark, `NxStatusIndicator`'s `primary` tone and
`NxStepsItem`'s numbered circle. Once `color-primary-dark` is set, the primary
tints (`-15`/`-20`/`-40`/`-50` — a tonal chip's ground, an outlined chip's
border, `NxProgress`'s track, `NxTimeline`'s marker, `NxFileList`'s badge,
`NxHighlightText`'s mark, `NxSummaryData`'s row divider) are mixed from it
over the dark background too, at the same percentages the light tints use
over the light one: for a near-white `color-primary-dark`, that keeps a tonal
chip's text (the dark primary itself) at 12.7–13.2:1 over its ground, and an
outlined chip's border at 3.2–4.6:1 against the dark card, in the reported
case. Left unset, the tints keep aliasing their light twin exactly as before.

**A text colour flips in dark mode only if its own ground does.** Everywhere
muted paints a ground of its own — `NxCode`, `NxAvatarFallback`, `NxKbd`, a
table's footer stripe, `NxTimeline`'s default marker and `NxAlert`'s
`foreground` variant (icon, title and description together) — its text
carries the matching `nx-dark-text-muted-foreground`, flipping to
`color-muted-foreground-dark` alongside it, rather than staying pinned to
`color-foreground`: pick a `color-muted-dark` light enough to keep it
legible, or leave both unset. `NxTypography`'s `caption` variant and every
other place muted text sits on the card or the page background instead —
`NxActionCard`'s idle icon box and indicator, `NxFileList`'s empty state,
`NxRatioCard`'s right figure, `NxStepsItem`'s body, `NxStatusIndicator`'s
`neutral` tone, `NxSummaryData`'s labels and the layout's own footer among
them — carry the same class: the card and the background are never
optional, so it always has one to follow, at a contrast at least as good as
the documented pair's (background and card are darker than a
`color-muted-dark` meant to read as "a step above" them).

Everywhere muted (or a variant's own colour) tints a ground that has **no**
dark twin, the text on it stays un-flipped too, since there is nothing for it
to follow: `NxAlert`'s six other variants (each a light tint with no dark
value at all), `NxBanner`'s four tones (the same), `NxEventChip`'s own ground
(`bg-${color}-20`, including for `primary`, left un-wired on purpose even
where the percentage would otherwise follow `color-primary-dark`),
`NxHero`'s eyebrow, title and description over its fixed `bg-primary-5`, and
`NxListTile`'s idle and selected title and subtitle over its fixed
`bg-primary-5/10/15`. Flipping one side without the other is exactly the bug
this rule prevents: a light `color-muted-foreground-dark` over one of these
never-flipping light grounds reads at little better than 1:1.

A component that lets a caller override its own colour classes through
`class` (`NxProgress`'s track, which `NxRatioCard` retints to `bg-primary-15`)
reads the tint back off the override to pick the matching `nx-dark-*` twin,
rather than keeping a fixed one: `twMerge` drops a conflicting light utility
class for you, but does not know a `nx-dark-*` class conflicts with another
one the same way, so a fixed dark twin would go on mismatching an overridden
light one silently.

`color-paper` (the page behind the layout's card, mail-ui's own token, not
material-vue's) gets a `color-paper-dark` computed the same way: the **light**
`color-primary` — never `color-primary-dark` — mixed 5% over the dark
background, so setting a dark primary never moves the page ground. Mixing the
dark one instead let a near-white `color-primary-dark` wash `paper-dark`
towards white too (down to 1.02:1 against the dark card, from the usual
~1.09:1) — unrelated to the brand, and worse to read.

## Overriding a dark token

The same `theme` option, one more entry — no different shape:

```ts
ui({
	brand: { name: 'Acme' },
	theme: {
		'color-primary': '#27272a', // both modes, unless you also set the dark twin below
		'color-primary-dark': '#a1a1aa', // dark mode only — keeps it off the dark card, and its tints follow it
		'color-primary-foreground-dark': '#18181b', // text on the button above, in dark mode
		'color-muted-dark': '#1e293b', // dark mode only — a step above the dark card
		'color-muted-foreground-dark': '#e2e8f0', // text on the ground above, in dark mode
		'color-background-dark': '#0b1220', // dark mode only
	},
});
```

Every rule in [The theme](theme.md#overriding-a-token) applies: the value is
a CSS colour, trimmed, and refused if it is not one of `theme.css`'s
declared tokens.

## The logo, and a figure's image

A dark logo on a dark background is the classic problem: it disappears.
`brand.logo` and `NxFigure` take a `darkSrc`, an absolute URL of a
light-background version, shown instead under dark mode with a two-image,
CSS-visibility toggle — a `<picture>` element with a `media` source is not
reliably read by mail clients, so both images are always in the HTML and one
is hidden by the same rules as everywhere else on this page:

```ts
ui({
	brand: {
		name: 'Acme',
		logo: {
			src: 'https://acme.example/logo-dark-on-transparent.png', // shown by default, and to Gmail always
			darkSrc: 'https://acme.example/logo-light-on-transparent.png',
		},
	},
});
```

```vue
<template>
  <NxFigure src="https://acme.example/chart-light-bg.png" dark-src="https://acme.example/chart-dark-bg.png" alt="Messages per day" />
</template>
```

Without `darkSrc`, `src` shows in both modes — nothing changes from before
this feature.

## caniemail

`caniemail.com`'s `css-color-scheme` finding (`mitigated`, `Gmail` and
`Outlook`) matches the table above: exactly the two limits already
documented here. `bun run` under `maizzle serve`'s compatibility check
(`test/maizzle-serve.ts`'s pattern, in `packages/mail-ui/src/build.spec.ts`)
does not report it, because it reads the `.vue` template source rather than
the theme's built CSS — the finding is accurate, but the automated check
does not see this specific path; this note is the record of it. Any other
new partial-support finding this feature introduces is listed in the
`known` array next to the template it is on.

## See also

- [The theme](theme.md) — the tokens, and overriding one.
- [The plugin](plugin.md) — `brand.logo.darkSrc` and `theme` among the other
  options.
- [Components](components.md) — `NxFigure`'s `darkSrc`.
