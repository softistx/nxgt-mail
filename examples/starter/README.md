# Starter

The official [Maizzle](https://maizzle.com) 6 starter with the `@nxgt/mail-*`
packages wired in, as their READMEs say: one template per e-mail, its text as
keys into `en` and `fr` catalogues, built once per locale by one
`maizzle build`, then rendered and sent from TypeScript with the types the
build wrote. CI builds it, renders it, and serves it in both locales on every change, so what
this page shows is known to work.

```text
emails/verify-email.vue    the project's own e-mail: Nx components, t() and placeholder()
locales/en.json, fr.json   its messages; the shared ones come from @nxgt/mail-ui
maizzle.config.ts          ui(), i18n(), and one preset of @nxgt/mail-presets: sign-in-code
send.ts                    renders every e-mail in both locales, sends them to a memory mailer
generated/mail.ts          written by the build, committed: the e-mails and their variables
```

## Start your own

Create the official starter, then add the packages:

```sh
bunx maizzle new
bun add @nxgt/mail @nxgt/mail-config @nxgt/mail-i18n @nxgt/mail-ui @nxgt/mail-presets @maizzle/framework @maizzle/tailwindcss vue
bun add -d vue-tsc typescript
```

`@maizzle/tailwindcss` must be in your own `package.json`, even though
Maizzle brings it: under an isolated install (Bun workspaces, pnpm), the
layout's `@import "@maizzle/tailwindcss"` otherwise resolves to nothing, and
the build succeeds with no style at all. `@nxgt/mail-presets` is only needed
for its ready e-mails.

Then:

1. **Replace** the starter's `emails/` with this folder's — delete
   Maizzle's example templates: the i18n plugin builds every template, and
   one without its subject message (`verifyEmail.subject` for
   `verify-email`) fails the build.
2. Copy `maizzle.config.ts`, `locales/` and `send.ts`, and delete
   `tailwind.css` and `public/`, which nothing reads any more.
3. Add `"send.ts"` (or your sending code) to `tsconfig.json`'s `include`,
   so it is type-checked against `generated/mail.ts`.
4. Add the `send` and `typecheck` scripts of this folder's `package.json`,
   and keep the starter's `"postinstall": "maizzle prepare"` — see
   [Differences](#differences-from-the-official-starter).

## Run it

In this repository, install and build from the root first — the starter
reaches the packages through their `dist/`:

```sh
bun install && bun run build      # at the root
cd examples/starter
```

| Command | What it does |
| --- | --- |
| `bun run dev` | `maizzle serve`: every e-mail listed once per locale, `en/verify-email`, `fr/verify-email`…, reloaded when a template or a catalogue changes |
| `bun run build` | `maizzle build`: the files below, and `generated/mail.ts` when the e-mails or their variables changed |
| `bun run send` | `send.ts`, after a build: renders each e-mail in each locale and prints its subject |
| `bun run typecheck` | `maizzle prepare`, then `vue-tsc`: the templates against the catalogues' keys, and `send.ts` against `generated/mail.ts` |

`maizzle build` writes:

```text
dist/
  en/verify-email.html      Hello {{ name }}, … href="{{ link }}"
  en/verify-email.txt
  en/sign-in-code.html
  en/sign-in-code.txt
  fr/verify-email.html      Bonjour {{ name }}, … Le lien expire dans 15 minutes.
  fr/…
  mail-manifest.json        each e-mail's placeholders, and its subject per locale
```

`bun run send` then prints:

```text
Confirm your e-mail address, Ada <3
Your sign-in code: 621739
Confirmez votre adresse e-mail, Ada <3
Votre code de connexion : 621739
```

The name is written as is in the subject and the text part, and HTML-escaped
in the HTML: `Ada &lt;3`. The script throws if an e-mail is missing in a
locale, a placeholder is left unfilled, or the name is not escaped.

## Sending from your application

`send.ts` is the code that sends, with a memory mailer instead of a transport:

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';
import type { MailEmails } from './generated/mail';

const mails = createMailRenderer<MailEmails>({ dir: 'dist', getLanguage: () => user.locale });
await mailer.send({ to, from, ...mails.render('verify-email', { name, link }) });
```

In production, `mailer` comes from
[`@nxgt/mail-smtp`](../../packages/mail-smtp) or
[`@nxgt/mail-resend`](../../packages/mail-resend), and `dist/` is deployed
with the server. `generated/mail.ts` is committed: with it,
`mails.render('verify-emial', …)`, a missing `link` or a number for it do
not compile, without running a build first.

## Differences from the official starter

- **`emails/`** holds one template of this project's, `verify-email.vue`,
  instead of Maizzle's four examples; `sign-in-code` comes from
  `@nxgt/mail-presets`. The e-mails' text is in `locales/`.
- **No `tailwind.css`**: `<NxLayout>` imports Tailwind and the theme of
  `@nxgt/mail-ui` itself. No `public/` either: a mail client loads no relative
  image, so the brand's logo is an absolute URL (`ui({ brand: { logo } })`).
- **`.gitignore`** also ignores `dist/`, which the build rewrites.
  `.maizzle/`, where the i18n plugin writes its files and the editor's
  types, is ignored too.
- **`tsconfig.json`** also includes `send.ts`. `.maizzle/*.d.ts` stays in it:
  that is where `t`, `placeholder` and `brand` are typed for the templates.
- **No `postinstall`** in this copy's `package.json`, only here: in this
  repository, `bun install` runs before the packages are built, and
  `maizzle prepare` would fail to load their `dist/`. The root's own
  `postinstall` prepares it once they are built. **Keep
  `"postinstall": "maizzle prepare"` in your project**, where the packages
  come from npm already built.
- The `@nxgt/*` dependencies are `workspace:*`, so CI builds the starter
  against the packages of the same commit; `bun add` writes versions instead.
