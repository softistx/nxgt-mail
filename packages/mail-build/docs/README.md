# @nxgt/mail-build — documentation

The [README](../README.md) shows that it works; these pages show how, one area
at a time, with an example for every case. The words they use — template,
prop, catalogue, message, argument, source, render function, generated module,
build failure — are defined once, in the
[vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md).

| Page | Read it when |
| --- | --- |
| [Templates](guide/templates.md) | You are writing `emails/<name>.vue`: what a template may hold (props, `t()`, `lang`), which components exist, its subject, how each prop is typed, how every value is escaped and every URL checked, and every construct the build refuses |
| [Catalogues](guide/catalogues.md) | You are writing `messages/<locale>.json` or compiling it alone: every ICU form a message takes (plural, `=0`, `offset`, ordinal, select, numbers, currencies, dates), how arguments are typed, how presets and your own catalogues merge, and every error the catalogues raise |
| [Building](guide/building.md) | You are running the build: `mail.config.ts` and its options, the `nxgt-mail build` and `nxgt-mail dev` commands, and `build`, `compileProject`, `compileMail` and `dev` for a script, a test or a CI check |
| [The generated module](guide/generated-module.md) | You are calling `mails.<email>(…)` or `t` from the module the build wrote: what it exports, arguments, time zone and what it throws, choosing the locale, typing your own helpers, and sending and testing an e-mail |
| [Troubleshooting](troubleshooting.md) | You have a `MailBuildError`, a `TypeError` from the build or from a render function, a compile error on a call to `mails` or `t`, or an e-mail that came out wrong, and want its cause and its fix |
| [Roadmap](roadmap.md) | You want to know what is coming — presets, the first release — what shipped, and what is deliberately not planned |
