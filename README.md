# nxgt-mail

Less boilerplate, and i18n, for a [Maizzle](https://maizzle.com) 6 project of
transactional e-mails.

Keep a normal Maizzle project — `emails/`, `public/`, `maizzle serve`,
`maizzle build` — and add:

- a base config that plugins extend without dropping each other's hooks;
- shared components and a theme (`<NxLayout>`, `<NxButton>`, `<NxCode>`…),
  any of which your own `components/` replaces by name;
- i18n: one template per e-mail, its text as keys into
  [ICU](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
  catalogues, built once per locale — shaped like `@nxgt/i18n`, but a missing
  key fails the build.

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui } from '@nxgt/mail-ui';

export default defineMailConfig({
  plugins: [ui(), i18n({ locales: ['en', 'fr'], fallbackLocale: 'en' })],
});
```

At send time, fill the values only known then, escaped, and hand the e-mail to
a transport:

```ts
import { createMailRenderer } from '@nxgt/mail';

const mails = createMailRenderer({ dir: 'dist', getLanguage: () => user.locale });
await mailer.send({ to, ...mails.render('verify-email', { name, link }) });
```

## Status

**Not released yet.** The plan was rewritten on 2026-09-26; work follows
[docs/plan.md](./docs/plan.md).

| Package | Role |
| --- | --- |
| [`@nxgt/mail`](./packages/mail) | The `Mailer` port, errors, locale selection, a memory mailer, the transport conformance suite, and the renderer |
| [`@nxgt/mail-config`](./packages/mail-config) | `defineMailConfig`: the base config, plugins with their build hooks chained, and the production config |
| [`@nxgt/mail-i18n`](./packages/mail-i18n) | The i18n plugin: ICU catalogues checked at build time, `t()` in templates, one output per locale, the manifest; and `createTranslator` |
| `@nxgt/mail-ui` | Components, theme and shared messages |
| `@nxgt/mail-smtp`, `@nxgt/mail-resend` | Transports |

## Contributing

Read [AGENTS.md](./AGENTS.md) — it applies to people as much as to agents.

## License

MIT
