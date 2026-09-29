# The e-mails

This page is for sending one of the fifteen presets, or rewording it: what each
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
| [`account-deleted`](#account-deleted) | An account was deleted, with a grace period to restore it | `expiresIn`, `link`, `name` | `link` |
| [`sign-in-code`](#sign-in-code) | A user signs in with a one-time code | `code`, `expiresIn` | — |
| [`magic-link`](#magic-link) | A user signs in with a one-time link | `expiresIn`, `link` | `link` |
| [`new-sign-in`](#new-sign-in) | An account was signed in from a device not seen before | `device`, `link`, `location`, `name`, `time` | `link` |
| [`two-factor-enabled`](#two-factor-enabled) | Two-factor authentication was just turned on | `link`, `name` | `link` |
| [`two-factor-disabled`](#two-factor-disabled) | Two-factor authentication was just turned off | `link`, `name` | `link` |
| [`recovery-code-used`](#recovery-code-used) | A second-factor recovery code was spent | `link`, `name`, `recoveryCodesLeft`, `when` | `link` |
| [`confirm-action`](#confirm-action) | A one-time code confirms a sensitive action (step-up re-authentication) | `code`, `expiresIn`, `link`, `name` | `link` |
| [`welcome`](#welcome) | An account was just created | `link`, `name` | `link` |
| [`invitation`](#invitation) | Someone invites the recipient to an organisation | `expiresIn`, `inviter`, `link`, `organization` | `link` |
| [`invitation-accepted`](#invitation-accepted) | The recipient invited to join an organisation accepted — sent to the inviter | `invitee`, `link`, `organization` | `link` |

The placeholders are the manifest's `variables`, and the URL ones its
`urlVariables`: the sender fills a URL one with an `http:` or `https:` URL,
and the others with text, which the renderer HTML-escapes. `{brand}` in a
message is not a placeholder: it is your `ui({ brand })` name, written at
build time.

## `expiresIn`: how long the link or the code lives

`verify-email`, `reset-password`, `magic-link`, `sign-in-code`,
`confirm-action`, `invitation` and `account-deleted` send something that stops working after a
while, and say so: `This link expires in {{ expiresIn }}.` under the button,
`This code expires in {{ expiresIn }}.` under the code,
`This invitation expires in {{ expiresIn }}.` under the invitation's button, or
`This restoration link expires in {{ expiresIn }}.` under `account-deleted`'s
restore button. `expiresIn` is
required: the server that made the token — or that granted the grace period —
knows its lifetime, the build does
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
To say nothing about expiry, replace the template (see
[Replacing a template](presets.md#replacing-a-template)): a message override cannot drop the
argument, because the template still passes it.

The other presets do not take it: `password-changed`, `new-sign-in`,
`two-factor-enabled`, `two-factor-disabled`, `recovery-code-used`, `welcome`
and `invitation-accepted` link to your site, not to a token, and
`email-changed` says nothing about a lifetime its undo link may not have. To
tell one, replace `email-changed.vue` with your own and pass it as a
placeholder of yours.

## What they share

Every preset is an `<NxLayout>`: the brand at the top, the content on a card,
and the footer's `common.footer.why`. Every one with a `link` shows it twice —
a button, then the URL itself under `presets.link-fallback`, for a mail client
that breaks the button.

The `fr` messages put a no-break space (U+00A0) before a colon, as French
typography does, so a line never starts with `:`. Keep it in a `fr` override.

| Key | `en` | `fr` | Used by |
| --- | --- | --- | --- |
| `presets.code-expires` | This code expires in {expiresIn}. | Ce code expire dans {expiresIn}. | `sign-in-code`, `confirm-action` |
| `presets.link-expires` | This link expires in {expiresIn}. | Ce lien expire dans {expiresIn}. | `verify-email`, `reset-password`, `magic-link` |
| `presets.link-fallback` | If the button does not work, open this link: | Si le bouton ne fonctionne pas, ouvrez ce lien : | every preset with a `link` |
| `presets.not-you` | If this was not you, secure your account now. | Si ce n'était pas vous, sécurisez votre compte dès maintenant. | `password-changed`, `email-changed`, `new-sign-in`, `account-deleted`, `two-factor-enabled`, `two-factor-disabled`, `recovery-code-used` |
| `common.greeting` | Hello {name}, | Bonjour {name}, | every preset but `sign-in-code`, `magic-link`, `invitation` and `invitation-accepted` |
| `common.footer.ignore` | If you did not ask for this, you can ignore this e-mail. | Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail. | `verify-email`, `reset-password`, `magic-link` |
| `common.footer.why` | You received this e-mail because you have an account with {brand}. | Vous recevez cet e-mail parce que vous avez un compte chez {brand}. | every preset, in the footer |

The `common` keys come from `@nxgt/mail-ui`'s `uiCatalogues`; see its
[Shared messages](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/docs/guide/messages.md).
The `presets` keys come with every `presets()` answer, whatever `only` holds.

Each preset below has its own group, named after its file: `verify-email`'s
messages are under `verify-email`. `subject` is its subject; `preheader` is the line a mail
client shows after the subject in the inbox.

## `verify-email`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/verify-email.png" width="420" alt="The verify-email e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/verify-email.png)

To confirm that an address belongs to the user, after they sign up or add
it. A title, the greeting, the body, the **Confirm my address** button,
`presets.link-expires`, the link as text, and `common.footer.ignore`.

| Key | `en` | `fr` |
| --- | --- | --- |
| `verify-email.subject` | Confirm your e-mail address | Confirmez votre adresse e-mail |
| `verify-email.preheader` | One click to confirm your address. | Un clic pour confirmer votre adresse. |
| `verify-email.title` | Confirm your e-mail address | Confirmez votre adresse e-mail |
| `verify-email.body` | Confirm that this address is yours to finish setting up your {brand} account. | Confirmez que cette adresse est bien la vôtre pour terminer la création de votre compte {brand}. |
| `verify-email.action` | Confirm my address | Confirmer mon adresse |

Placeholders: `name`, `link` (a URL), `expiresIn` (a duration, as text).
Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/verify-email.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/verify-email.html).

## `reset-password`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/reset-password.png" width="420" alt="The reset-password e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/reset-password.png)

To let a user choose a new password. A title, the greeting, the body, the
**Choose a new password** button, `presets.link-expires`, the link as text,
and `common.footer.ignore`.

| Key | `en` | `fr` |
| --- | --- | --- |
| `reset-password.subject` | Reset your password | Réinitialisez votre mot de passe |
| `reset-password.preheader` | Choose a new password for your account. | Choisissez un nouveau mot de passe pour votre compte. |
| `reset-password.title` | Reset your password | Réinitialisez votre mot de passe |
| `reset-password.body` | Someone asked to reset the password of your {brand} account. Choose a new one with the button below. | Quelqu'un a demandé à réinitialiser le mot de passe de votre compte {brand}. Choisissez-en un nouveau avec le bouton ci-dessous. |
| `reset-password.action` | Choose a new password | Choisir un nouveau mot de passe |

Placeholders: `name`, `link` (a URL), `expiresIn` (a duration, as text).
Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/reset-password.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/reset-password.html).

## `password-changed`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/password-changed.png" width="420" alt="The password-changed e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/password-changed.png)

A notice, after the password of an account changed. A title, the greeting,
the body, a warning alert with `presets.not-you`, the **Secure my account**
button, and the link as text. `link` is where the user secures the account —
your recovery or account-settings page.

| Key | `en` | `fr` |
| --- | --- | --- |
| `password-changed.subject` | Your password was changed | Votre mot de passe a été modifié |
| `password-changed.preheader` | The password of your account was just changed. | Le mot de passe de votre compte vient d'être modifié. |
| `password-changed.title` | Your password was changed | Votre mot de passe a été modifié |
| `password-changed.body` | The password of your {brand} account was just changed. | Le mot de passe de votre compte {brand} vient d'être modifié. |
| `password-changed.action` | Secure my account | Sécuriser mon compte |

Placeholders: `name`, `link` (a URL). Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/password-changed.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/password-changed.html).

## `email-changed`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/email-changed.png" width="420" alt="The email-changed e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/email-changed.png)

A notice sent to the **former** address, after an account's address changed,
so its owner can undo a change they did not make. A title, the greeting, the
body naming the new address, a warning alert with `presets.not-you`, the
**Undo this change** button, and the link as text.

| Key | `en` | `fr` |
| --- | --- | --- |
| `email-changed.subject` | Your e-mail address was changed | Votre adresse e-mail a été modifiée |
| `email-changed.preheader` | Your account now signs in with a new address. | Votre compte utilise désormais une nouvelle adresse. |
| `email-changed.title` | Your e-mail address was changed | Votre adresse e-mail a été modifiée |
| `email-changed.body` | Your {brand} account now uses {newEmail}. We send this notice to your former address. | Votre compte {brand} utilise désormais {newEmail}. Nous envoyons cet avis à votre ancienne adresse. |
| `email-changed.action` | Undo this change | Annuler ce changement |

Placeholders: `name`, `newEmail` (the new address, as text), `link` (a URL).
Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/email-changed.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/email-changed.html).

## `account-deleted`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/account-deleted.png" width="420" alt="The account-deleted e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/account-deleted.png)

A confirmation, after an account was deleted, with a grace period during
which it can still be restored. A title, the greeting, the body, an error
alert with `presets.not-you`, the **Restore my account** button,
`account-deleted.expires`, and the link as text.

| Key | `en` | `fr` |
| --- | --- | --- |
| `account-deleted.subject` | Your account was deleted | Votre compte a été supprimé |
| `account-deleted.preheader` | Your account and its data are being removed. | Votre compte et ses données sont en cours de suppression. |
| `account-deleted.title` | Your account was deleted | Votre compte a été supprimé |
| `account-deleted.body` | Your {brand} account was deleted, along with its data. | Votre compte {brand} a été supprimé, ainsi que ses données. |
| `account-deleted.action` | Restore my account | Restaurer mon compte |
| `account-deleted.expires` | This restoration link expires in {expiresIn}. | Ce lien de restauration expire dans {expiresIn}. |

Placeholders: `name`, `link` (a URL), `expiresIn` (a duration, as text).
`expiresIn` is required, for the same reason as `invitation.expires`: the
server that runs the grace period knows how long it lasts, the build does
not. A project with no grace period — an immediate, unrecoverable deletion —
replaces `account-deleted.vue` with its own, dropping the button and the
expiry message. Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/account-deleted.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/account-deleted.html).

## `sign-in-code`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/sign-in-code.png" width="420" alt="The sign-in-code e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/sign-in-code.png)

A one-time code to type in, for a sign-in without a password or a second
factor. A title, the body, the code in a large block (`<NxCode>`),
`presets.code-expires`, and `sign-in-code.ignore`. No greeting and no link.

| Key | `en` | `fr` |
| --- | --- | --- |
| `sign-in-code.subject` | Your sign-in code: {code} | Votre code de connexion : {code} |
| `sign-in-code.preheader` | Enter this code to sign in. | Saisissez ce code pour vous connecter. |
| `sign-in-code.title` | Your sign-in code | Votre code de connexion |
| `sign-in-code.body` | Enter this code to sign in to {brand}. It works once. | Saisissez ce code pour vous connecter à {brand}. Il ne fonctionne qu'une fois. |
| `sign-in-code.ignore` | If you did not try to sign in, you can ignore this e-mail: no one can sign in without the code. | Si vous n'avez pas essayé de vous connecter, vous pouvez ignorer cet e-mail : personne ne peut se connecter sans ce code. |

Placeholders: `expiresIn` (a duration, as text), and `code`, in the body and **in the subject** — the manifest's
subject is `Your sign-in code: {{ code }}`, filled like the body, so the code
shows in an inbox's list. Write a `sign-in-code.subject` without `{code}` in
your catalogues to keep it out:

```json
// locales/en.json
{ "sign-in-code": { "subject": "Your sign-in code" } }
```

```json
// locales/fr.json
{ "sign-in-code": { "subject": "Votre code de connexion" } }
```

Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/sign-in-code.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/sign-in-code.html).

## `magic-link`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/magic-link.png" width="420" alt="The magic-link e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/magic-link.png)

A one-time link that signs the user in. A title with the brand, the body,
the **Sign in** button, `presets.link-expires`, the link as text, and
`common.footer.ignore`. No greeting.

| Key | `en` | `fr` |
| --- | --- | --- |
| `magic-link.subject` | Your sign-in link | Votre lien de connexion |
| `magic-link.preheader` | One click to sign in. | Un clic pour vous connecter. |
| `magic-link.title` | Sign in to {brand} | Connectez-vous à {brand} |
| `magic-link.body` | Click the button below to sign in. The link works once. | Cliquez sur le bouton ci-dessous pour vous connecter. Le lien ne fonctionne qu'une fois. |
| `magic-link.action` | Sign in | Me connecter |

Placeholders: `link` (a URL), `expiresIn` (a duration, as text). Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/magic-link.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/magic-link.html).

## `new-sign-in`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/new-sign-in.png" width="420" alt="The new-sign-in e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/new-sign-in.png)

An alert, after an account was signed in from a device not seen before. A
title, the greeting, a warning banner, a summary of the device, the location
and the time, the body with `presets.not-you`, the **Secure my account**
button, and the link as text.

| Key | `en` | `fr` |
| --- | --- | --- |
| `new-sign-in.subject` | New sign-in to your account | Nouvelle connexion à votre compte |
| `new-sign-in.preheader` | Your account was signed in from a new device. | Votre compte a été utilisé depuis un nouvel appareil. |
| `new-sign-in.title` | New sign-in to your account | Nouvelle connexion à votre compte |
| `new-sign-in.banner` | Your account was signed in from a device we had not seen. | Votre compte a été utilisé depuis un appareil que nous ne connaissions pas. |
| `new-sign-in.device` | Device | Appareil |
| `new-sign-in.location` | Location | Lieu |
| `new-sign-in.time` | Time | Heure |
| `new-sign-in.body` | If this was you, there is nothing to do. | Si c'était vous, vous n'avez rien à faire. |
| `new-sign-in.action` | Secure my account | Sécuriser mon compte |

Placeholders: `name`, `device`, `location`, `time`, `link` (a URL).
`device`, `location` and `time` are text the sender writes: the build cannot
format a value it does not have, so format `time` in the recipient's locale
and time zone before sending (`2 janvier 2026, 14:05 (Paris)`). Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/new-sign-in.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/new-sign-in.html).

## `two-factor-enabled`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/two-factor-enabled.png" width="420" alt="The two-factor-enabled e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/two-factor-enabled.png)

A notice, after two-factor authentication was turned on for an account. A
title, the greeting, the body, a warning alert with `presets.not-you`, the
**Secure my account** button, and the link as text. `link` is where the user
secures the account — your recovery or account-settings page.

| Key | `en` | `fr` |
| --- | --- | --- |
| `two-factor-enabled.subject` | Two-factor authentication was turned on | L'authentification à deux facteurs a été activée |
| `two-factor-enabled.preheader` | Your account now asks for a second factor at sign-in. | Votre compte demande désormais un second facteur à la connexion. |
| `two-factor-enabled.title` | Two-factor authentication is now on | L'authentification à deux facteurs est maintenant active |
| `two-factor-enabled.body` | Your {brand} account now asks for a second factor at sign-in. | Votre compte {brand} demande désormais un second facteur à la connexion. |
| `two-factor-enabled.action` | Secure my account | Sécuriser mon compte |

Placeholders: `name`, `link` (a URL). Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/two-factor-enabled.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/two-factor-enabled.html).

## `two-factor-disabled`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/two-factor-disabled.png" width="420" alt="The two-factor-disabled e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/two-factor-disabled.png)

A notice, after two-factor authentication was turned off for an account —
worded more strongly than `two-factor-enabled`, since the account now signs
in with a password alone. A title, the greeting, the body, an **error**
alert with `presets.not-you`, the **Secure my account** button, and the link
as text.

| Key | `en` | `fr` |
| --- | --- | --- |
| `two-factor-disabled.subject` | Two-factor authentication was turned off | L'authentification à deux facteurs a été désactivée |
| `two-factor-disabled.preheader` | Your account no longer asks for a second factor at sign-in. | Votre compte ne demande plus de second facteur à la connexion. |
| `two-factor-disabled.title` | Two-factor authentication is now off | L'authentification à deux facteurs est maintenant désactivée |
| `two-factor-disabled.body` | Your {brand} account no longer asks for a second factor at sign-in — anyone with just your password can sign in. | Votre compte {brand} ne demande plus de second facteur à la connexion : toute personne connaissant votre mot de passe peut désormais se connecter. |
| `two-factor-disabled.action` | Secure my account | Sécuriser mon compte |

Placeholders: `name`, `link` (a URL). Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/two-factor-disabled.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/two-factor-disabled.html).

## `recovery-code-used`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/recovery-code-used.png" width="420" alt="The recovery-code-used e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/recovery-code-used.png)

A notice, after a second-factor recovery code was spent. A title, the
greeting, a warning banner naming when the code was used, how many recovery
codes remain, the body with `presets.not-you`, the **Secure my account**
button, and the link as text. `link` is where the user regenerates codes or
secures the account — your recovery or account-settings page.

| Key | `en` | `fr` |
| --- | --- | --- |
| `recovery-code-used.subject` | A recovery code was used on your account | Un code de récupération a été utilisé sur votre compte |
| `recovery-code-used.preheader` | A recovery code from your account was just used. | Un code de récupération de votre compte vient d'être utilisé. |
| `recovery-code-used.title` | A recovery code was used on your account | Un code de récupération a été utilisé sur votre compte |
| `recovery-code-used.banner` | A recovery code was used on your account at {when}. | Un code de récupération a été utilisé sur votre compte le {when}. |
| `recovery-code-used.codes-left` | `{recoveryCodesLeft, plural, =0 {You have no recovery codes left.} one {You have # recovery code left.} other {You have # recovery codes left.}}` | `{recoveryCodesLeft, plural, =0 {Il ne vous reste aucun code de récupération.} one {Il vous reste # code de récupération.} other {Il vous reste # codes de récupération.}}` |
| `recovery-code-used.body` | If this was you, generate new codes from your {brand} account when you are running low. | Si c'était vous, générez de nouveaux codes depuis votre compte {brand} lorsque vous êtes à court. |
| `recovery-code-used.action` | Secure my account | Sécuriser mon compte |

Placeholders: `name`, `when`, `recoveryCodesLeft`, `link` (a URL). `when` is
text the sender writes, as `new-sign-in.time`: format it in the recipient's
locale and time zone before sending (`2 janvier 2026, 14:05 (Paris)`).

`recovery-code-used.codes-left` is not read by the template — the build has
no way to pick a plural branch for a count it only learns at send time (see
[`@nxgt/mail-i18n`'s troubleshooting — a plural, a number or a date](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/troubleshooting.md#i18n-en-verify-email-passes-minutes-to-verify-emailexpires-as-a-string--the-message-uses-it-as-a-number)).
It exists so your code can format the sentence itself, with the real count
and the recipient's plural rules, and pass the result as `recoveryCodesLeft`:

```ts
import { createTranslator } from '@nxgt/mail-i18n';
import { presetCatalogues } from '@nxgt/mail-presets';

const t = createTranslator(presetCatalogues, () => locale);
const recoveryCodesLeft = t('recovery-code-used.codes-left', { recoveryCodesLeft: count });
// en, count 0: 'You have no recovery codes left.'
// en, count 1: 'You have 1 recovery code left.'
// fr, count 1: 'Il vous reste 1 code de récupération.'

mails.render('recovery-code-used', { name, when, recoveryCodesLeft, link }, { locale });
```

Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/recovery-code-used.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/recovery-code-used.html).

## `confirm-action`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/confirm-action.png" width="420" alt="The confirm-action e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/confirm-action.png)

A one-time code to confirm a sensitive action — a step-up re-authentication
before changing the e-mail address, turning off two-factor authentication or
deleting the account. It is generic on purpose: the message does not name the
action, because the renderer refuses a missing variable, so no optional
placeholder could hold it. A title, the greeting, the body, the code in a
large block (`<NxCode>`), `presets.code-expires`, a warning for the recipient
who did not ask, the **Secure my account** button, and the link as text.
`link` is where the user secures the account — your account-settings page.

| Key | `en` | `fr` |
| --- | --- | --- |
| `confirm-action.subject` | Your confirmation code | Votre code de confirmation |
| `confirm-action.preheader` | Enter this code to confirm your request. | Saisissez ce code pour confirmer votre demande. |
| `confirm-action.title` | Your confirmation code | Votre code de confirmation |
| `confirm-action.body` | Someone, we hope you, asked to do something sensitive on your {brand} account. Enter this code to confirm it. | Quelqu'un, nous l'espérons vous, a demandé une action sensible sur votre compte {brand}. Saisissez ce code pour la confirmer. |
| `confirm-action.warning` | If this was not you, do not share this code: someone may be trying to act on your account. Secure your account now. | Si ce n'était pas vous, ne communiquez pas ce code : quelqu'un essaie peut-être d'agir sur votre compte. Sécurisez votre compte dès maintenant. |
| `confirm-action.action` | Secure my account | Sécuriser mon compte |

Placeholders: `name`, `code`, `expiresIn` (a duration, as text), `link` (a
URL). The code is not in the subject, unlike `sign-in-code`'s. Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/confirm-action.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/confirm-action.html).

## `welcome`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/welcome.png" width="420" alt="The welcome e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/welcome.png)

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

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/invitation.png" width="420" alt="The invitation e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/invitation.png)

To invite someone — who may have no account yet — to join an organisation.
A title with the organisation, the body naming who invites, the
**Accept the invitation** button, `invitation.expires`, and the link as
text. No greeting: the recipient's name is often unknown.

| Key | `en` | `fr` |
| --- | --- | --- |
| `invitation.subject` | {inviter} invited you to join {organization} | {inviter} vous invite à rejoindre {organization} |
| `invitation.preheader` | Join {organization} on {brand}. | Rejoignez {organization} sur {brand}. |
| `invitation.title` | Join {organization} | Rejoignez {organization} |
| `invitation.body` | {inviter} invited you to join {organization} on {brand}. | {inviter} vous invite à rejoindre {organization} sur {brand}. |
| `invitation.action` | Accept the invitation | Accepter l'invitation |
| `invitation.expires` | This invitation expires in {expiresIn}. | Cette invitation expire dans {expiresIn}. |

Placeholders: `inviter`, `organization` (both in the subject too), `link`
(a URL), `expiresIn` (a duration, as text: `'7 days'`, `'7 jours'`). Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/invitation.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/invitation.html).

## `invitation-accepted`

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/en/invitation-accepted.png" width="420" alt="The invitation-accepted e-mail, in English">

[In French](https://raw.githubusercontent.com/softistx/nxgt-mail/refs/heads/develop/packages/mail-presets/previews/fr/invitation-accepted.png)

Tells the **inviter**, after the person they invited accepted and joined the
organisation. A title naming who joined, the body, the **View the team**
button, and the link as text. No greeting: unlike `invitation`, the
recipient here is the inviter, but the preset takes no `name` for them —
replace the template to add one.

| Key | `en` | `fr` |
| --- | --- | --- |
| `invitation-accepted.subject` | {invitee} accepted your invitation to {organization} | {invitee} a accepté votre invitation à rejoindre {organization} |
| `invitation-accepted.preheader` | {invitee} joined {organization}. | {invitee} a rejoint {organization}. |
| `invitation-accepted.title` | {invitee} joined {organization} | {invitee} a rejoint {organization} |
| `invitation-accepted.body` | {invitee} accepted your invitation and now belongs to {organization} on {brand}. | {invitee} a accepté votre invitation et fait désormais partie de {organization} sur {brand}. |
| `invitation-accepted.action` | View the team | Voir l'équipe |

Placeholders: `invitee`, `organization` (both in the subject too), `link`
(a URL). Samples:
[en](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/en/invitation-accepted.html) ·
[fr](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/fr/invitation-accepted.html).

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
  `sign-in-code.subject` is fine in both locales at once; adding `{brand}` to a
  subject would add a `brand` placeholder, not your brand's name.

```json
// locales/en.json
{
	"welcome": { "subject": "Welcome to Acme, {name}" },
	"verify-email": { "action": "Yes, this is my address" }
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
