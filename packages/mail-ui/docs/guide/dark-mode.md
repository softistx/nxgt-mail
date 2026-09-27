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

**`primary` keeps its value too, unless you set one for dark mode.**
`color-primary-dark` and `color-primary-foreground-dark` default to their
light value — a project that never sets them reaches dark mode with
`color-primary` unchanged, for free, exactly as before this pair of tokens
existed. Set them when the default does not work: a brand whose primary is
near-black, `#27272a`, is a crisp button on a white card, but melts into
`color-card-dark` (`oklch(0.208 0.042 265.755)`, close to it in luminance) on
a dark one — that project gives primary a lighter dark twin, and a dark
foreground to keep its text readable on it.

Every place primary paints carries the matching `nx-dark-*` class, at
whatever strength it is used: `NxButton`, `NxLinkButton`, `NxIconButton` and
`NxChip` (`filled`, `tonal` and `outlined`, and the `link` variant),
`NxBadge`'s default variant, `NxProgress`'s track and fill, and `NxTimeline`'s
`primary` marker. A tint used only as a decorative ground — `NxHero`'s,
`NxListTile`'s, `NxEventChip`'s — keeps material-vue's original behaviour, the
same value in both modes, unconditionally: it says so where it is used.

`color-paper` (the page behind the layout's card, mail-ui's own token, not
material-vue's) gets a `color-paper-dark` computed the same way: primary — its
dark value, if you set one — mixed 5% over the dark background.

## Overriding a dark token

The same `theme` option, one more entry — no different shape:

```ts
ui({
	brand: { name: 'Acme' },
	theme: {
		'color-primary': '#27272a', // both modes, unless you also set the dark twin below
		'color-primary-dark': '#a1a1aa', // dark mode only — keeps it off the dark card
		'color-primary-foreground-dark': '#18181b', // text on the button above, in dark mode
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
