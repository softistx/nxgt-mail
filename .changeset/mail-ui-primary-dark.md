---
"@nxgt/mail-ui": minor
---

Optional dark tokens for the primary colour: `color-primary-dark` and
`color-primary-foreground-dark`, both defaulting to their light value, so a
project that never sets them is unaffected. Set them when a brand's
near-black primary would otherwise melt into the dark card in dark mode.
`NxButton`, `NxLinkButton`, `NxIconButton`, `NxChip` (`filled`, `tonal`,
`outlined` and `link`), `NxBadge`'s default variant, `NxProgress` and
`NxTimeline`'s `primary` marker all carry the dark twin, and `color-paper-dark`
mixes it in place of the light value. See
[Dark mode](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/docs/guide/dark-mode.md#which-tokens-have-a-dark-value).
