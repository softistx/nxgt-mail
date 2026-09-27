# @nxgt/mail-config — documentation

The [README](../README.md) shows that it works; these pages show how, one area
at a time, with an example for every rule. The words they use — project,
template, plugin, component — are defined once, in the
[vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md).

| Page | Read it when |
| --- | --- |
| [The project config](guide/config.md) | You are writing `maizzle.config.ts` with `defineMailConfig`: the layers, how objects, arrays and the three joined lists merge, how each build event is chained, what the plain-text part looks like and how to keep its layout, and every `TypeError` it throws |
| [Writing a plugin](guide/plugins.md) | You are shipping a partial Maizzle config in a package with `defineMailPlugin`: components under a prefix, hooks, global properties, options checked at wiring time, and why the order of `plugins` matters |
| [Production](guide/production.md) | You are adding `maizzle.config.production.ts` with `productionConfig`: minified HTML, its own output folder, a hook that only runs there |
| [Troubleshooting](troubleshooting.md) | You have an error message and want its cause and its fix |
| [Roadmap](roadmap.md) | You want to know what is coming, what shipped, and what is deliberately not planned |
