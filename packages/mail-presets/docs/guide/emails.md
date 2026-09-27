# The e-mails

This page is for sending one of the nine presets, or rewording it: what each
one is for, what it shows, the placeholders the sender fills, its subject,
and every message it uses in `en` and `fr`.

Every preset is built from your `ui()` brand and theme. The built HTML of
each, with the brand `Acme`, is in
[`samples/`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/README.md).

```ts
// maizzle.config.ts — the one that built the samples
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

| E-mail | Sent when | Placeholders | A URL |
| --- | --- | --- | --- |
| [`verify-email`](#verify-email) | An address must be confirmed as the user's | `expiresIn`, `link`, `name` | `link` |
| [`reset-password`](#reset-password) | A user asked to reset their password | `expiresIn`, `link`, `name` | `link` |
| [`password-changed`](#password-changed) | A password was just changed | `link`, `name` | `link` |
| [`email-changed`](#email-changed) | An account's address was changed — sent to the former one | `link`, `name`, `newEmail` | `link` |
| [`sign-in-code`](#sign-in-code) | A user signs in with a one-time code | `code`, `expiresIn` | — |
| [`magic-link`](#magic-link) | A user signs in with a one-time link | `expiresIn`, `link` | `link` |
| [`new-sign-in`](#new-sign-in) | An account was signed in from a device not seen before | `device`, `link`, `location`, `name`, `time` | `link` |
| [`welcome`](#welcome) | An account was just created | `link`, `name` | `link` |
| [`invitation`](#invitation) | Someone invites the recipient to an organisation | `inviter`, `link`, `organization` | `link` |

The placeholders are the manifest's `variables`, and the URL ones its
`urlVariables`: the sender fills a URL one with an `http:` or `https:` URL,
and the others with text, which the renderer HTML-escapes. `{brand}` in a
message is not a placeholder: it is your `ui({ brand })` name, written at
build time.

## `expiresIn`: how long the link or the code lives

`verify-email`, `reset-password`, `magic-link` and `sign-in-code` send
something that stops working after a while, and say so:
`This link expires in {{ expiresIn }}.` under the button, or
`This code expires in {{ expiresIn }}.` under the code. `expiresIn` is
required: the server that made the token knows its lifetime, the build does
not. Pass it as text already written in the recipient's language — the
renderer writes a value as is and translates nothing:

```ts
const locale = pickLocale(user.locale, mails.locales, 'en');
const minutes = new Intl.NumberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay: 'long' });

mails.render('sign-in-code', { code, expiresIn: minutes.format(10) }, { locale });
// en: This code expires in 10 minutes.   fr: Ce code expire dans 10 minutes.
```

A number is written as is (`This link expires in 3600.`), so format it.
Without `expiresIn`, the call does not compile against `MailEmails`, and
`render` throws
[`render: <email> needs the variable expiresIn`](../troubleshooting.md#render-reset-password-needs-the-variable-expiresin).
The other presets do not take it: `password-changed`, `new-sign-in` and
`welcome` link to your site, not to a token, and `email-changed` and
`invitation` say nothing about a lifetime their link may not have. To tell an
invitation's lifetime, replace `invitation.vue` with your own and pass it as
a placeholder of yours.

To say nothing about expiry, replace the template (see
[Replacing a template](presets.md#replacing-a-template)): a message override cannot drop the
argument, because the template still passes it.

## What they share

Every preset is an `<NxLayout>`: the brand at the top, the content on a card,
and the footer's `common.footer.why`. Every one with a `link` shows it twice —
a button, then the URL itself under `presets.linkFallback`, for a mail client
that breaks the button.

The `fr` messages put a no-break space (U+00A0) before a colon, as French
typography does, so a line never starts with `:`. Keep it in a `fr` override.

| Key | `en` | `fr` | Used by |
| --- | --- | --- | --- |
| `presets.codeExpires` | This code expires in {expiresIn}. | Ce code expire dans {expiresIn}. | `sign-in-code` |
| `presets.linkExpires` | This link expires in {expiresIn}. | Ce lien expire dans {expiresIn}. | `verify-email`, `reset-password`, `magic-link` |
| `presets.linkFallback` | If the button does not work, open this link: | Si le bouton ne fonctionne pas, ouvrez ce lien : | every preset with a `link` |
| `presets.notYou` | If this was not you, secure your account now. | Si ce n'était pas vous, sécurisez votre compte dès maintenant. | `password-changed`, `email-changed`, `new-sign-in` |
| `common.greeting` | Hello {name}, | Bonjour {name}, | every preset but `sign-in-code`, `magic-link` and `invitation` |
| `common.footer.ignore` | If you did not ask for this, you can ignore this e-mail. | Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail. | `verify-email`, `reset-password`, `magic-link` |
| `common.footer.why` | You received this e-mail because you have an account with {brand}. | Vous recevez cet e-mail parce que vous avez un compte chez {brand}. | every preset, in the footer |

The `common` keys come from `@nxgt/mail-ui`'s `uiCatalogues`; see its
[Shared messages](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/docs/guide/messages.md).
The `presets` keys come with every `presets()` answer, whatever `only` holds.

Each preset below has its own group, named after it (`verify-email` →
`verifyEmail`). `subject` is its subject; `preheader` is the line a mail
client shows after the subject in the inbox.

## `verify-email`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/en/verify-email.png" width="420" alt="The verify-email e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/fr/verify-email.png)

To confirm that an address belongs to the user, after they sign up or add
it. A title, the greeting, the body, the **Confirm my address** button,
`presets.linkExpires`, the link as text, and `common.footer.ignore`.

| Key | `en` | `fr` |
| --- | --- | --- |
| `verifyEmail.subject` | Confirm your e-mail address | Confirmez votre adresse e-mail |
| `verifyEmail.preheader` | One click to confirm your address. | Un clic pour confirmer votre adresse. |
| `verifyEmail.title` | Confirm your e-mail address | Confirmez votre adresse e-mail |
| `verifyEmail.body` | Confirm that this address is yours to finish setting up your {brand} account. | Confirmez que cette adresse est bien la vôtre pour terminer la création de votre compte {brand}. |
| `verifyEmail.action` | Confirm my address | Confirmer mon adresse |

Placeholders: `name`, `link` (a URL), `expiresIn` (a duration, as text).
Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/verify-email.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/verify-email.html).

## `reset-password`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/en/reset-password.png" width="420" alt="The reset-password e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/fr/reset-password.png)

To let a user choose a new password. A title, the greeting, the body, the
**Choose a new password** button, `presets.linkExpires`, the link as text,
and `common.footer.ignore`.

| Key | `en` | `fr` |
| --- | --- | --- |
| `resetPassword.subject` | Reset your password | Réinitialisez votre mot de passe |
| `resetPassword.preheader` | Choose a new password for your account. | Choisissez un nouveau mot de passe pour votre compte. |
| `resetPassword.title` | Reset your password | Réinitialisez votre mot de passe |
| `resetPassword.body` | Someone asked to reset the password of your {brand} account. Choose a new one with the button below. | Quelqu'un a demandé à réinitialiser le mot de passe de votre compte {brand}. Choisissez-en un nouveau avec le bouton ci-dessous. |
| `resetPassword.action` | Choose a new password | Choisir un nouveau mot de passe |

Placeholders: `name`, `link` (a URL), `expiresIn` (a duration, as text).
Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/reset-password.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/reset-password.html).

## `password-changed`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/en/password-changed.png" width="420" alt="The password-changed e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/fr/password-changed.png)

A notice, after the password of an account changed. A title, the greeting,
the body, a warning alert with `presets.notYou`, the **Secure my account**
button, and the link as text. `link` is where the user secures the account —
your recovery or account-settings page.

| Key | `en` | `fr` |
| --- | --- | --- |
| `passwordChanged.subject` | Your password was changed | Votre mot de passe a été modifié |
| `passwordChanged.preheader` | The password of your account was just changed. | Le mot de passe de votre compte vient d'être modifié. |
| `passwordChanged.title` | Your password was changed | Votre mot de passe a été modifié |
| `passwordChanged.body` | The password of your {brand} account was just changed. | Le mot de passe de votre compte {brand} vient d'être modifié. |
| `passwordChanged.action` | Secure my account | Sécuriser mon compte |

Placeholders: `name`, `link` (a URL). Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/password-changed.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/password-changed.html).

## `email-changed`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/en/email-changed.png" width="420" alt="The email-changed e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/fr/email-changed.png)

A notice sent to the **former** address, after an account's address changed,
so its owner can undo a change they did not make. A title, the greeting, the
body naming the new address, a warning alert with `presets.notYou`, the
**Undo this change** button, and the link as text.

| Key | `en` | `fr` |
| --- | --- | --- |
| `emailChanged.subject` | Your e-mail address was changed | Votre adresse e-mail a été modifiée |
| `emailChanged.preheader` | Your account now signs in with a new address. | Votre compte utilise désormais une nouvelle adresse. |
| `emailChanged.title` | Your e-mail address was changed | Votre adresse e-mail a été modifiée |
| `emailChanged.body` | Your {brand} account now uses {newEmail}. We send this notice to your former address. | Votre compte {brand} utilise désormais {newEmail}. Nous envoyons cet avis à votre ancienne adresse. |
| `emailChanged.action` | Undo this change | Annuler ce changement |

Placeholders: `name`, `newEmail` (the new address, as text), `link` (a URL).
Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/email-changed.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/email-changed.html).

## `sign-in-code`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/en/sign-in-code.png" width="420" alt="The sign-in-code e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/fr/sign-in-code.png)

A one-time code to type in, for a sign-in without a password or a second
factor. A title, the body, the code in a large block (`<NxCode>`),
`presets.codeExpires`, and `signInCode.ignore`. No greeting and no link.

| Key | `en` | `fr` |
| --- | --- | --- |
| `signInCode.subject` | Your sign-in code: {code} | Votre code de connexion : {code} |
| `signInCode.preheader` | Enter this code to sign in. | Saisissez ce code pour vous connecter. |
| `signInCode.title` | Your sign-in code | Votre code de connexion |
| `signInCode.body` | Enter this code to sign in to {brand}. It works once. | Saisissez ce code pour vous connecter à {brand}. Il ne fonctionne qu'une fois. |
| `signInCode.ignore` | If you did not try to sign in, you can ignore this e-mail: no one can sign in without the code. | Si vous n'avez pas essayé de vous connecter, vous pouvez ignorer cet e-mail : personne ne peut se connecter sans ce code. |

Placeholders: `expiresIn` (a duration, as text), and `code`, in the body and **in the subject** — the manifest's
subject is `Your sign-in code: {{ code }}`, filled like the body, so the code
shows in an inbox's list. Write a `signInCode.subject` without `{code}` in
your catalogues to keep it out:

```json
// locales/en.json
{ "signInCode": { "subject": "Your sign-in code" } }
```

```json
// locales/fr.json
{ "signInCode": { "subject": "Votre code de connexion" } }
```

Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/sign-in-code.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/sign-in-code.html).

## `magic-link`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/en/magic-link.png" width="420" alt="The magic-link e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/fr/magic-link.png)

A one-time link that signs the user in. A title with the brand, the body,
the **Sign in** button, `presets.linkExpires`, the link as text, and
`common.footer.ignore`. No greeting.

| Key | `en` | `fr` |
| --- | --- | --- |
| `magicLink.subject` | Your sign-in link | Votre lien de connexion |
| `magicLink.preheader` | One click to sign in. | Un clic pour vous connecter. |
| `magicLink.title` | Sign in to {brand} | Connectez-vous à {brand} |
| `magicLink.body` | Click the button below to sign in. The link works once. | Cliquez sur le bouton ci-dessous pour vous connecter. Le lien ne fonctionne qu'une fois. |
| `magicLink.action` | Sign in | Me connecter |

Placeholders: `link` (a URL), `expiresIn` (a duration, as text). Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/magic-link.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/magic-link.html).

## `new-sign-in`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/en/new-sign-in.png" width="420" alt="The new-sign-in e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/fr/new-sign-in.png)

An alert, after an account was signed in from a device not seen before. A
title, the greeting, a warning banner, a summary of the device, the location
and the time, the body with `presets.notYou`, the **Secure my account**
button, and the link as text.

| Key | `en` | `fr` |
| --- | --- | --- |
| `newSignIn.subject` | New sign-in to your account | Nouvelle connexion à votre compte |
| `newSignIn.preheader` | Your account was signed in from a new device. | Votre compte a été utilisé depuis un nouvel appareil. |
| `newSignIn.title` | New sign-in to your account | Nouvelle connexion à votre compte |
| `newSignIn.banner` | Your account was signed in from a device we had not seen. | Votre compte a été utilisé depuis un appareil que nous ne connaissions pas. |
| `newSignIn.device` | Device | Appareil |
| `newSignIn.location` | Location | Lieu |
| `newSignIn.time` | Time | Heure |
| `newSignIn.body` | If this was you, there is nothing to do. | Si c'était vous, vous n'avez rien à faire. |
| `newSignIn.action` | Secure my account | Sécuriser mon compte |

Placeholders: `name`, `device`, `location`, `time`, `link` (a URL).
`device`, `location` and `time` are text the sender writes: the build cannot
format a value it does not have, so format `time` in the recipient's locale
and time zone before sending (`2 janvier 2026, 14:05 (Paris)`). Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/new-sign-in.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/new-sign-in.html).

## `welcome`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/en/welcome.png" width="420" alt="The welcome e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/fr/welcome.png)

After an account was created. A title with the brand, the greeting, the body,
the **Get started** button, and the link as text.

| Key | `en` | `fr` |
| --- | --- | --- |
| `welcome.subject` | Welcome, {name} | Bienvenue, {name} |
| `welcome.preheader` | Your account is ready. | Votre compte est prêt. |
| `welcome.title` | Welcome to {brand} | Bienvenue chez {brand} |
| `welcome.body` | Your account is ready. Everything you need is one click away. | Votre compte est prêt. Tout ce dont vous avez besoin est à portée de clic. |
| `welcome.action` | Get started | Commencer |

Placeholders: `name` (in the subject too), `link` (a URL). Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/welcome.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/welcome.html).

## `invitation`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/en/invitation.png" width="420" alt="The invitation e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-presets@0.1.0/packages/mail-presets/previews/fr/invitation.png)

To invite someone — who may have no account yet — to join an organisation.
A title with the organisation, the body naming who invites, the
**Accept the invitation** button, and the link as text. No greeting: the
recipient's name is often unknown.

| Key | `en` | `fr` |
| --- | --- | --- |
| `invitation.subject` | {inviter} invited you to join {organization} | {inviter} vous invite à rejoindre {organization} |
| `invitation.preheader` | Join {organization} on {brand}. | Rejoignez {organization} sur {brand}. |
| `invitation.title` | Join {organization} | Rejoignez {organization} |
| `invitation.body` | {inviter} invited you to join {organization} on {brand}. | {inviter} vous invite à rejoindre {organization} sur {brand}. |
| `invitation.action` | Accept the invitation | Accepter l'invitation |

Placeholders: `inviter`, `organization` (both in the subject too), `link`
(a URL). Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/invitation.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/invitation.html).

## Rewording one

Any key above can be overridden in your `locales/<locale>.json`, key by key.
The arguments are what an override must respect:

- **In the fallback locale** (`en` unless you set `fallbackLocale`), keep
  every argument of a message the template passes arguments to. The
  template still passes them, and the build fails on one the message no
  longer uses: `i18n: en: welcome passes {brand} to welcome.title, which does
  not use it`.
- **In another locale**, an override may leave an argument out, never use
  one the fallback locale's message does not declare:
  `i18n: fr: welcome.subject uses {extra}, which en does not declare`.
- **A subject** is not passed arguments by the template: each of its
  arguments becomes a placeholder the sender fills. Dropping `{code}` from
  `signInCode.subject` is fine in both locales at once; adding `{brand}` to a
  subject would add a `brand` placeholder, not your brand's name.

```json
// locales/en.json
{
	"welcome": { "subject": "Welcome to Acme, {name}" },
	"verifyEmail": { "action": "Yes, this is my address" }
}
```

To drop an argument from a body message, replace the template, which then
passes what its messages use. See
[Wiring the presets](presets.md#overriding-a-message).

## See also

- [Wiring the presets](presets.md) — `presets()`, replacing a template,
  another locale.
- `@nxgt/mail-i18n`'s
  [The manifest](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/guide/manifest.md)
  — `variables`, `urlVariables` and `subject`, field by field.
