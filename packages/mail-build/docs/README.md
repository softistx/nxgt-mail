# @nxgt/mail-build — documentation

The [README](../README.md) shows that it works; these pages show how, one area
at a time, with an example for every case. The words they use — catalogue,
message, argument, source, generated module, build failure — are defined once,
in the
[vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md).

| Page | Read it when |
| --- | --- |
| [Catalogues](guide/catalogues.md) | You are writing `messages/<locale>.json` or compiling it: every ICU form a message takes (plural, `=0`, `offset`, ordinal, select, numbers, currencies, dates), how arguments are typed, how presets and your own catalogues merge, and every error the build throws |
| [The generated module](guide/generated-module.md) | You are calling `t` from the module the build wrote: what it exports, its arguments and time zone, choosing the locale, typing your own helpers, and composing an e-mail with it |
| [Troubleshooting](troubleshooting.md) | You have a `MailBuildError`, a `TypeError` from `compileMessages`, a compile error on a call to `t`, or an e-mail whose text came out wrong, and want its cause and its fix |
| [Roadmap](roadmap.md) | You want to know what is coming — templates, the CLI — what shipped, and what is deliberately not planned |
