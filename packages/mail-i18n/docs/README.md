# @nxgt/mail-i18n — documentation

The [README](../README.md) shows that it works. These pages show how, one area
at a time, with an example for every rule. The words they use (catalogue,
message, argument, placeholder, subject, manifest, wrapper) are defined once,
in the
[vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md).

| Page | Read it when |
| --- | --- |
| [Catalogues](guide/catalogues.md) | You are writing `locales/<locale>.json`: nesting and `camelCase`, the kinds of argument, what each locale is checked for against the fallback locale, the subject key of each e-mail, catalogues a package ships (the `catalogues` option), and every build failure a catalogue causes |
| [Templates](guide/templates.md) | You are writing `emails/*.vue`: `t`, `locale` and `placeholder`, where a placeholder can go, what fails the build, the files the build writes, `maizzle serve` and its watcher, and typing templates |
| [The manifest](guide/manifest.md) | You are reading `dist/mail-manifest.json`, the file the sending code uses: each field, how it is computed, and the flat layout |
| [Translating outside templates](guide/translator.md) | You need a message in your application's code (a notification, a text message, a test) with `createTranslator`, and want to know how it differs from `@nxgt/i18n` |
| [Troubleshooting](troubleshooting.md) | You have an error message and want its cause and its fix |
| [Roadmap](roadmap.md) | You want to know what is coming, what shipped, and what is deliberately not planned |
