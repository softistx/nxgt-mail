# @nxgt/mail-i18n — documentation

The [README](../README.md) shows that it works. These pages show how, one area
at a time, with an example for every rule. The words they use (catalogue,
message, argument, placeholder, subject, manifest, wrapper) are defined once,
in the
[vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md).

| Page | Read it when |
| --- | --- |
| [Catalogues](guide/catalogues.md) | You are writing `locales/<locale>.json`: nesting and `camelCase`, the kinds of argument, what each locale is checked for against the fallback locale, the subject key of each e-mail, catalogues a package ships (the `catalogues` option), splitting catalogues into folders or reading them from a `messages` module, and every build failure a catalogue causes |
| [Templates](guide/templates.md) | You are writing `emails/*.vue`: `t`, `locale` and `placeholder`, where a placeholder can go, templates a package ships (the `templates` option), what fails the build, the files the build writes, and `maizzle serve` and its watcher |
| [The manifest](guide/manifest.md) | You are reading `dist/mail-manifest.json`, the file the sending code uses: each field, how it is computed, and the flat layout; `formatVersion` and which `@nxgt/mail` reads it; shipping a build in a package; and `generated/mail.ts`, the `MailEmails` type that types `createMailRenderer`, with the `rendererTypes` option |
| [Editor and type checking](guide/editor.md) | You want the editor to complete `t('…')` and flag an unknown key or a wrong argument, and `vue-tsc` to check your templates in CI: the tsconfig, `maizzle prepare`, the generated `.maizzle/nxgt-mail-i18n.d.ts`, what each kind of argument accepts, and `TemplateMessages`, `TemplateKey`, `TemplateArgs` |
| [Translating outside templates](guide/translator.md) | You need a message in your application's code (a notification, a text message, a test) with `createTranslator`, and want to know how it differs from `@nxgt/i18n` |
| [Troubleshooting](troubleshooting.md) | You have an error message and want its cause and its fix |
| [Roadmap](roadmap.md) | You want to know what is coming, what shipped, and what is deliberately not planned |
