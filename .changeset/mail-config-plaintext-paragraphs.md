---
"@nxgt/mail-config": minor
---

The plain-text part reads as one. `baseConfig` now hands Maizzle a
`string-strip-html` callback, `breakBlocks`: a paragraph, a heading, a list or
a table ends with a blank line, and a `<br>`, a `<div>`, a row or a list item
with a line break. Its `afterBuild` tidies each `.txt` part Maizzle wrote,
with `tidyPlaintext`: the invisible characters of a `<Spacer>`, an `<Hr>` or a
preheader are dropped, blank lines never run to more than one, and a link
whose text is its own address is written once. `maizzle serve`'s plain-text
preview is unchanged: only `maizzle build` writes this. Before, the whole e-mail ran
onto one line. Both functions are exported.

A project that sets `plaintext: true` replaces the base's options, and gets
the old single line back: leave `plaintext` out, or set an object.
