---
"@nxgt/mail-config": patch
---

Fix: the text part no longer breaks a sentence mid-word where Maizzle wrapped a long source line. `breakBlocks` now marks a paragraph and a line break instead of writing `\n\n` and `\n` directly, so `tidyPlaintext` can tell a source line's wrap from one it meant: it joins the wrap back into its sentence with a single space, but still keeps a link's address on its own line, and keeps every line of a `<pre>`. A project whose own `cb` never marks anything sees no change.
