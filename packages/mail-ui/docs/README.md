# @nxgt/mail-ui — documentation

The [README](../README.md) shows that it works. These pages show how, one area
at a time, with an example for every rule. The words they use (project,
template, component, plugin, placeholder, catalogue) are defined once, in the
[vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md).

| Page | Read it when |
| --- | --- |
| [The plugin](guide/plugin.md) | You are adding `ui({ brand, theme })` to `maizzle.config.ts`: the brand, `brand` in templates and how the editor and `vue-tsc` learn its type, replacing one of the components with your own, how the tags of installed components and a package's templates are resolved, writing your own layout on `UI_CONTEXT`, and every `TypeError` it throws |
| [Components](guide/components.md) | You are writing `emails/*.vue` with the `Nx*` components: each one's props, defaults and slots, the material-vue component it mirrors, icons, spacing, and a complete template |
| [The theme](guide/theme.md) | You want your colours or radii: every token of `theme.css`, the tints that stand for material-vue's translucent colours, what an override changes, and why there is no dark mode |
| [Shared messages](guide/messages.md) | You translate with `@nxgt/mail-i18n`: the `common` messages `uiCatalogues` brings, overriding one, and a locale other than `en` and `fr` |
| [Troubleshooting](troubleshooting.md) | You have an error message and want its cause and its fix |
| [Roadmap](roadmap.md) | You want to know what is coming, what shipped, and what is deliberately not planned |
