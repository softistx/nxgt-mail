---
"@nxgt/mail-ui": patch
---

Fixed two dark-mode bugs found by a downstream project measuring actual
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
