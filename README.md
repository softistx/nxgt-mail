# nxgt-mail

Less boilerplate, and i18n, for a [Maizzle](https://maizzle.com) 6 project of
transactional e-mails.

Keep a normal Maizzle project — `emails/`, `public/`, `maizzle serve`,
`maizzle build` — and add:

- a base config that plugins extend without dropping each other's hooks;
- e-mail components in the style of `@nxgt/material-vue` (`<NxLayout>`,
  `<NxButton>`, `<NxCard>`…) and its theme, any of which your own
  `components/` replaces by name;
- i18n: one template per e-mail, its text as keys into
  [ICU](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
  catalogues, built once per locale — shaped like `@nxgt/i18n`, but a missing
  key fails the build.

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui, uiCatalogues } from '@nxgt/mail-ui';

export default defineMailConfig({
  plugins: [
    ui({ brand: { name: 'Acme', url: 'https://acme.example' } }),
    i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] }),
  ],
});
```

At send time, fill the values only known then, escaped, and hand the e-mail to
a transport:

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';
import type { MailEmails } from './generated/mail'; // written by the build

const mails = createMailRenderer<MailEmails>({ dir: 'dist', getLanguage: () => user.locale });
await mailer.send({ to, ...mails.render('verify-email', { name, link }) });
```

**See it working in [`examples/starter`](./examples/starter)**: the official
Maizzle starter with these snippets wired in — an e-mail of its own and a
preset, in `en` and `fr`, and a script that renders and sends them to a memory
mailer. CI builds, renders and serves it on every change.

## Status

**Released, 0.1.0** — every package below is on npm, each still `0.x`: a
minor version may change its surface, and its changelog says how. Work
follows [docs/plan.md](./docs/plan.md). What a `1.0` freezes is proposed in
[docs/plan-1.0.md](./docs/plan-1.0.md).

```sh
bun add @nxgt/mail @nxgt/mail-config @nxgt/mail-i18n @nxgt/mail-ui @nxgt/mail-presets @maizzle/framework @maizzle/tailwindcss vue
```

Then a transport, `@nxgt/mail-smtp` or `@nxgt/mail-resend`; each package's
README lists its peers.

| Package | Role |
| --- | --- |
| [`@nxgt/mail`](./packages/mail) | The `Mailer` port, errors, locale selection, a memory mailer, the transport conformance suite, and the renderer |
| [`@nxgt/mail-config`](./packages/mail-config) | `defineMailConfig`: the base config, plugins with their build hooks chained, and the production config |
| [`@nxgt/mail-i18n`](./packages/mail-i18n) | The i18n plugin: ICU catalogues checked at build time, `t()` in templates, one output per locale, the manifest; and `createTranslator` |
| [`@nxgt/mail-presets`](./packages/mail-presets) | Nine ready e-mails — verify-email, reset-password, sign-in-code, magic-link, welcome, invitation… — in `en` and `fr`, built by your project with your brand; [built samples](./packages/mail-presets/samples) |
| [`@nxgt/mail-ui`](./packages/mail-ui) | E-mail components in the style of `@nxgt/material-vue`, its theme, and the shared messages |
| [`@nxgt/mail-resend`](./packages/mail-resend) | A Resend transport over `fetch`, with no SDK and no dependency |
| [`@nxgt/mail-smtp`](./packages/mail-smtp) | An SMTP transport on the `nodemailer` you install |

## Contributing

Read [AGENTS.md](./AGENTS.md) — it applies to people as much as to agents.

### Checking the real rendering

`bun run send-samples --to you@example.com --transport smtp` sends every
`@nxgt/mail-presets` e-mail and the `@nxgt/mail-ui` showcase fixtures, in a
fresh build, to one address, so a real Gmail, Outlook or Apple Mail can be
checked — nothing an automated test can do. It is a private script: no
package here is published by it. `--only` and `--locale` narrow which
e-mails and locales are sent; `--dry-run` writes each `.html`/`.eml` to a
temp dir instead of sending. See `scripts/send-samples.ts`'s own header for
the full usage. Transports come from the environment only (`SMTP_URL`, or
`RESEND_API_KEY` + `MAIL_FROM`); a secret is never read back or printed.

## License

MIT
