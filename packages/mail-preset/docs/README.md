# @nxgt/mail-preset — documentation

The [README](../README.md) shows that it works; these pages show how, one area
at a time, with an example for every case. The words they use — preset,
template, component, layout, theme token, catalogue, message — are defined
once, in the
[vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md).

| Page | Read it when |
| --- | --- |
| [Components](guide/components.md) | You are writing a template with the preset: `TransactionalLayout` with its `preheader` and `#footer`, and `MailHeading`, `MailText`, `MailButton`, `MailLink`, `MailDivider`, `MailSpacer`, `MailCode` — their props and what each renders |
| [Theme](guide/theme.md) | You are changing how the e-mails look: the `brand` and `theme` options of `nxgtPreset`, every token with its default and its Tailwind class, and what the options refuse |
| [Messages](guide/messages.md) | You are using or overriding `common.greeting`, `common.footer.why` or `common.footer.ignore`, or adding a locale the preset does not translate |
| [Extending](guide/extending.md) | You want more than the options: a second preset with `definePreset`, the order presets and your files apply in, a component or a layout of your own |
| [Troubleshooting](troubleshooting.md) | You have an error from `nxgtPreset` or from the build about a preset, a component or a `common.*` key, and want its cause and its fix |
| [Roadmap](roadmap.md) | You want to know what is coming — the check in real e-mail clients, a dark scheme, more locales — and what is deliberately not planned |
