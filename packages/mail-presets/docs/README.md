# @nxgt/mail-presets — documentation

The [README](../README.md) shows that it works. These pages show how, one area
at a time, with an example for every rule. A *preset* is one of the package's
fourteen e-mails: its template and its messages. The other words they use
(project, template, catalogue, message, placeholder, variable, subject) are
defined once, in the
[vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md).

| Page | Read it when |
| --- | --- |
| [Wiring the presets](guide/presets.md) | You are adding `presets()` to `maizzle.config.ts`: its `only` option, what it answers and how `i18n()` builds it, replacing a template, overriding a message, a locale other than `en` and `fr`, and every `TypeError` it throws |
| [The e-mails](guide/emails.md) | You are sending one of the fourteen: what it is for, what it shows, its placeholders and which of them is a URL, its subject, and each of its messages in `en` and `fr` |
| [Troubleshooting](troubleshooting.md) | You have an error message and want its cause and its fix |
| [Roadmap](roadmap.md) | You want to know what is coming, what shipped, and what is deliberately not planned |

The built HTML of every preset, in both locales, is in
[`samples/`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/README.md),
on GitHub. The package's specs check it against a build made the way a
project makes it: `@nxgt/mail-ui` and `@nxgt/mail-presets` installed in a
`node_modules`, with the configuration of [The e-mails](guide/emails.md).
