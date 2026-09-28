# @nxgt/mail-presets

Thirteen ready transactional e-mails for a [Maizzle](https://maizzle.com) 6
project: `verify-email`, `reset-password`, `password-changed`,
`email-changed`, `account-deleted`, `sign-in-code`, `magic-link`,
`new-sign-in`, `two-factor-enabled`, `two-factor-disabled`, `welcome`,
`invitation` and `invitation-accepted`, written with `@nxgt/mail-ui`'s
components and translated in `en` and `fr`. Your project builds them with its
own brand and theme, next to its own templates, and replaces any of them — a
whole template, or one message.

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { presets } from '@nxgt/mail-presets';
import { ui, uiCatalogues } from '@nxgt/mail-ui';

const mails = presets();

export default defineMailConfig({
	plugins: [
		ui({ brand: { name: 'Acme', url: 'https://acme.example' } }),
		i18n({
			locales: ['en', 'fr'],
			catalogues: [uiCatalogues, mails.catalogues],
			templates: [mails.templates],
		}),
	],
});
```

`maizzle build` then writes `dist/en/verify-email.html`,
`dist/fr/verify-email.html`… each with its `.txt`, and every e-mail's
placeholders and subjects in `dist/mail-manifest.json`. See what they look
like in the [built samples](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/README.md).

Each preset as it arrives, with the brand `Acme`, the default theme and example
values in its placeholders. Click one for full size; `fr` is the French build.

<table>
<tr><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/verify-email.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/verify-email.png" width="260" alt="The verify-email e-mail, in English"></a><br><code>verify-email</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/verify-email.png">fr</a></td><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/reset-password.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/reset-password.png" width="260" alt="The reset-password e-mail, in English"></a><br><code>reset-password</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/reset-password.png">fr</a></td><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/password-changed.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/password-changed.png" width="260" alt="The password-changed e-mail, in English"></a><br><code>password-changed</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/password-changed.png">fr</a></td></tr>
<tr><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/email-changed.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/email-changed.png" width="260" alt="The email-changed e-mail, in English"></a><br><code>email-changed</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/email-changed.png">fr</a></td><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/account-deleted.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/account-deleted.png" width="260" alt="The account-deleted e-mail, in English"></a><br><code>account-deleted</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/account-deleted.png">fr</a></td><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/sign-in-code.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/sign-in-code.png" width="260" alt="The sign-in-code e-mail, in English"></a><br><code>sign-in-code</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/sign-in-code.png">fr</a></td></tr>
<tr><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/magic-link.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/magic-link.png" width="260" alt="The magic-link e-mail, in English"></a><br><code>magic-link</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/magic-link.png">fr</a></td><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/new-sign-in.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/new-sign-in.png" width="260" alt="The new-sign-in e-mail, in English"></a><br><code>new-sign-in</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/new-sign-in.png">fr</a></td><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/two-factor-enabled.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/two-factor-enabled.png" width="260" alt="The two-factor-enabled e-mail, in English"></a><br><code>two-factor-enabled</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/two-factor-enabled.png">fr</a></td></tr>
<tr><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/two-factor-disabled.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/two-factor-disabled.png" width="260" alt="The two-factor-disabled e-mail, in English"></a><br><code>two-factor-disabled</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/two-factor-disabled.png">fr</a></td><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/welcome.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/welcome.png" width="260" alt="The welcome e-mail, in English"></a><br><code>welcome</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/welcome.png">fr</a></td><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/invitation.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/invitation.png" width="260" alt="The invitation e-mail, in English"></a><br><code>invitation</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/invitation.png">fr</a></td></tr>
<tr><td valign="top"><a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/invitation-accepted.png"><img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/invitation-accepted.png" width="260" alt="The invitation-accepted e-mail, in English"></a><br><code>invitation-accepted</code> · <a href="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/invitation-accepted.png">fr</a></td></tr>
</table>

> **0.x.** A minor version may still change the surface; the changelog says how.

## Install

```sh
bun add @nxgt/mail-presets @nxgt/mail-i18n @nxgt/mail-ui @nxgt/mail-config @maizzle/framework @maizzle/tailwindcss vue
```

Peers, all required:

- `@nxgt/mail-i18n` — builds the templates once per locale, from the folder
  `presets()` names, with the messages it gives.
- `@nxgt/mail-ui` — the templates are written with its `Nx*` components, and
  use its shared `common.*` messages.
- `@maizzle/framework` (`^6.1.7`) — Maizzle itself. `@nxgt/mail-config` and
  `@maizzle/tailwindcss` (`^1.5.6`) are what `@nxgt/mail-ui` needs, the
  latter as a direct dependency of your project (see its
  [Setup](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/README.md#setup)).
- `vue` (`^3.5`) — the templates are Vue single-file components.
- `typescript` (6). Bundler resolution (`"moduleResolution": "bundler"`) is
  what is supported and tested; `nodenext` is out of contract.

Runs on Node `>=20` (the active LTS) or Bun; CI tests on Bun only.

Your project still has a `locales/<locale>.json` per locale, `{}` if it
overrides nothing: `@nxgt/mail-i18n` requires it.

## Exports

| Export | What it is |
| --- | --- |
| `presets(options?)` | `{ templates, catalogues }` for `i18n({ templates, catalogues })`: every preset, or the ones in `only` |
| `PRESETS` | The thirteen names, `['verify-email', 'reset-password', …]`, as a readonly tuple |
| `PresetName` | One of them, as a type |
| `presetCatalogues` | Every preset's messages, `{ en, fr }`, before `presets()` keeps the ones asked for; frozen, every group in it |
| `TEMPLATES_DIR` | The absolute path of the package's `emails/` folder |
| `Presets`, `PresetsOptions` | What `presets()` answers, and its options |

## Usage

### A few of them — `only`

```ts
import { presets } from '@nxgt/mail-presets';

const mails = presets({ only: ['verify-email', 'reset-password', 'magic-link'] });
// mails.templates  → { dir: '/…/@nxgt/mail-presets/emails', emails: ['verify-email', 'reset-password', 'magic-link'] }
// mails.catalogues → { en, fr }, with presets.*, verify-email.*, reset-password.*, magic-link.* only
```

Pass both to `i18n()` as above: only those three are built, beside your own
templates. A wrong `only` is a bare `TypeError` when the config loads:
`presets: only holds something that is not a preset — name one of
verify-email, reset-password, …`. See [Wiring the presets](docs/guide/presets.md).

### The e-mails

Each one takes its values at send time as placeholders, listed in the
manifest:

| E-mail | Placeholders | Subject (`en`) |
| --- | --- | --- |
| `verify-email` | `expiresIn`, `link`, `name` | Confirm your e-mail address |
| `reset-password` | `expiresIn`, `link`, `name` | Reset your password |
| `password-changed` | `link`, `name` | Your password was changed |
| `email-changed` | `link`, `name`, `newEmail` | Your e-mail address was changed |
| `account-deleted` | `expiresIn`, `link`, `name` | Your account was deleted |
| `sign-in-code` | `code`, `expiresIn` | Your sign-in code: `{{ code }}` |
| `magic-link` | `expiresIn`, `link` | Your sign-in link |
| `new-sign-in` | `device`, `link`, `location`, `name`, `time` | New sign-in to your account |
| `two-factor-enabled` | `link`, `name` | Two-factor authentication was turned on |
| `two-factor-disabled` | `link`, `name` | Two-factor authentication was turned off |
| `welcome` | `link`, `name` | Welcome, `{{ name }}` |
| `invitation` | `expiresIn`, `inviter`, `link`, `organization` | `{{ inviter }}` invited you to join `{{ organization }}` |
| `invitation-accepted` | `invitee`, `link`, `organization` | `{{ invitee }}` accepted your invitation to `{{ organization }}` |

`link` is a URL in each of them: the sender fills it with an `http:` or `https:` URL.
`expiresIn` is how long the link or the code stays valid, already written in
the recipient's language — `'1 hour'`, `'1 heure'` — shown as
`This link expires in {{ expiresIn }}.` (`This code expires in …` for
`sign-in-code`, `This invitation expires in …` for `invitation`,
`This restoration link expires in …` for `account-deleted`). See [The e-mails](docs/guide/emails.md) for what each one
says, in both locales, and every message key.

### Sending one

At send time, with [`@nxgt/mail`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/README.md)'s renderer, reading your build:

```ts
import { type Mailer, pickLocale } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';
import type { MailEmails } from './generated/mail'; // written by each build, git-ignored

export const mails = createMailRenderer<MailEmails>({ dir: 'dist' });

export async function sendReset(
	mailer: Mailer,
	user: { email: string; name: string; locale: string | null },
	link: string,
): Promise<void> {
	const locale = pickLocale(user.locale, mails.locales, 'en');
	const hours = new Intl.NumberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'long' });
	await mailer.send({
		to: user.email,
		from: 'noreply@acme.example',
		// expiresIn: '1 hour' in en, '1 heure' in fr
		...mails.render('reset-password', { name: user.name, link, expiresIn: hours.format(1) }, { locale }),
	});
}
```

The server knows how long the token it made lives; the build does not, so
the sender writes the duration in the recipient's language. Leaving
`expiresIn` out does not compile against `MailEmails`, and throws
[`render: reset-password needs the variable expiresIn`](docs/troubleshooting.md#render-reset-password-needs-the-variable-expiresin)
untyped.

### Replacing a template

```vue
<!-- emails/welcome.vue — built instead of the package's welcome -->
<template>
  <NxLayout :preheader="t('welcome.preheader')">
    <NxTypography variant="headline-small">{{ t('welcome.title', { brand: brand.name }) }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('welcome.action') }}</NxButton>
    <NxTypography variant="caption">{{ t('welcome.help') }}</NxTypography>
  </NxLayout>
</template>
```

A template in your `emails/` with the name of a preset replaces it. It keeps
the preset's messages, so it only writes the keys it adds (`welcome.help`
here) in your `locales/<locale>.json`. To start from the package's, copy it
from `TEMPLATES_DIR`.

### Overriding a message

```json
// locales/en.json — every other message stays the package's
{ "verify-email": { "action": "Yes, this is my address" } }
```

Your catalogues go over the package's, key by key, in each locale. The
`fr` button stays `Confirmer mon adresse`. See
[Wiring the presets](docs/guide/presets.md#overriding-a-message).

## Traps

**Give `i18n()` both catalogues.** The templates use `@nxgt/mail-ui`'s
`common.*` messages: without `uiCatalogues` the build fails with
`calls t('common.footer.why'), which is not a key of the catalogues`, and
without `mails.catalogues`, with `calls t('verify-email.preheader'), …`.

```ts
catalogues: [uiCatalogues, mails.catalogues],
```

**List `ui()` in `plugins`.** The templates are made of its `Nx*` components,
installed under `node_modules`, where Maizzle resolves no tag: `ui()` resolves
them, and without it the build fails with `i18n: en/verify-email.html is
empty — a tag of its template resolved to no component; list the plugin that
brings it, as ui()`.

**Another locale writes the keys itself.** The presets have `en` and `fr`
only: a project in `de` writes `common.*`, `presets.*` and the group of each
preset it builds in `locales/de.json`, or the build fails with
`i18n: de: presets.link-fallback is missing — en, the fallback locale, has it`.
See [Another locale](docs/guide/presets.md#another-locale).

**An `en` override keeps the template's arguments.** `en` is the fallback
locale, and the template still passes `{brand}` to `verify-email.body`: an
override without it fails with `passes {brand} to verify-email.body, which
does not use it`. Replace the template to change what it passes.

**`only` keeps only those presets' messages.** A template of yours named
like a preset left out of `only` writes all of its messages itself.

**`expiresIn` is text, not a number.** Pass `'1 hour'`, not `1` or
`3600`: the renderer writes a number as is, so the e-mail would say
`This link expires in 3600.`

**Three subjects hold placeholders.** `welcome`, `sign-in-code` and
`invitation` put `{{ name }}`, `{{ code }}`, `{{ inviter }}` and
`{{ organization }}` in the subject: take the subject from the manifest and
fill it like the body.

**The samples are not in the tarball.** They are on GitHub, in
[`samples/`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/README.md).

## Type safety, counted

**5 plausible mistakes, 5 refused** at compile time, each measured by a
`@ts-expect-error` in
[`test/types/refusals.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/test/types/refusals.ts)
that fails the typecheck the moment it stops holding:

1. A name in `only` that is not a preset (`'sign-in'`).
2. `only` given one name rather than a list.
3. `only` given an empty list, rather than left out for every preset.
4. The list given as the options (`presets(['welcome'])`) rather than in
   `only`.
5. `i18n({ templates })` given the folder alone (`mails.templates.dir`)
   rather than the whole `mails.templates`.

The same file holds the calls that must keep compiling: a refusal that refuses
the correct call is a bug.

## Documentation

- [The guides](docs/README.md) — one page per area, with every option,
  e-mail, message and error.
- [Troubleshooting](docs/troubleshooting.md) — an error message, its cause and
  its fix.
- [Roadmap](docs/roadmap.md) — what is next, and what is deliberately not
  planned.
- [Samples](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/README.md)
  — every preset built in `en` and `fr`, with the brand `Acme`.
- [Vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md)
  — the words these pages use, defined once.

## Licence

MIT
