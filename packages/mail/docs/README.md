# @nxgt/mail — documentation

The [README](../README.md) shows that it works; these pages show how, one area
at a time, with an example for every option. The words they use — e-mail,
mailer, transport, hand-over, refusal, failure — are defined once, in the
[vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md).

| Page | Read it when |
| --- | --- |
| [Sending](guide/sending.md) | You are calling `mailer.send`: the `MailMessage` shape, addresses, headers, what `send` answers, and turning `MailFailure` and `MailRefused` into a response |
| [Testing](guide/testing.md) | You are testing code that sends e-mail with `createMemoryMailer`: reading the outbox, making a send fail, counting attempts |
| [Locales](guide/locales.md) | You are choosing the locale an e-mail is rendered in, with `pickLocale` and `parseAcceptLanguage` |
| [Writing a transport](guide/transports.md) | You are implementing the `Mailer` port for a provider, and running `@nxgt/mail/conformance` against it |
| [Troubleshooting](troubleshooting.md) | You have an error message and want its cause and its fix |
| [Roadmap](roadmap.md) | You want to know what is coming, what shipped, and what is deliberately not planned |
