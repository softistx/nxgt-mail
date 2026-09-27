---
"@nxgt/mail-config": minor
---

The first release: the `maizzle.config.ts` of a normal Maizzle 6 project, with plugins that do not drop each other.

- `defineMailConfig({ plugins, ...project })` layers a base (`baseConfig`, plain text on), then each plugin in order, then your project, whose keys win. `maizzle serve` and `maizzle build` are unchanged.
- Every build event (`beforeCreate` to `afterBuild`) runs each layer's handler in order, and `components.source`, `vite.plugins` and `vue.plugins` are joined, so two plugins that each bring components keep both.
- `defineMailPlugin(plugin)` reports a missing name or a handler that is not a function in the package that writes the plugin; a plugin that brings other plugins is refused.
- `productionConfig(config, overrides)` for `maizzle.config.production.ts`: your config, the HTML minified, then your overrides.
