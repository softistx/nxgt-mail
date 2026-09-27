# Troubleshooting `@nxgt/mail-presets`

Each entry is headed by the message you see. Search this page for the words of
your message. Near the end, a trap that fails no build, and a section for
contributors to this package.

How the messages are shaped:

- **A wiring mistake is a `TypeError` starting `presets:`**, thrown by the
  `presets()` call in `maizzle.config.ts` when the config loads, so
  `maizzle build` and `maizzle serve` stop before any template is built. Fix
  the call.
- **The other failures come from the packages the presets are built with.**
  `@nxgt/mail-i18n` prints `i18n: …`, and a missing `ui()` shows first as
  Vue's `Failed to resolve component` warnings.
  Most of them mean one of the three lines that wire the presets is missing:
  `ui()`, a catalogue in `catalogues`, or the templates in `templates`. This
  page covers the ones the presets cause. The rest are in
  [`@nxgt/mail-i18n`'s troubleshooting](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/troubleshooting.md)
  and
  [`@nxgt/mail-ui`'s](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/docs/troubleshooting.md).

Every fix below ends in the same config, which builds every preset in `en`
and `fr`:

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { presets } from '@nxgt/mail-presets';
import { ui, uiCatalogues } from '@nxgt/mail-ui';

const mails = presets();   // or presets({ only: ['verify-email', 'reset-password'] })

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

The samples below use the locales `en` and `fr`, the preset `verify-email`,
and the brand `Acme`.

## Index

**Wiring**: when `maizzle.config.ts` loads
- [`presets: options must be an object, as { only: ['verify-email'] }`](#presets-options-must-be-an-object-as--only-verify-email-)
- [`presets: only must list at least one preset, as ['verify-email']`](#presets-only-must-list-at-least-one-preset-as-verify-email)
- [`presets: only holds something that is not a preset — name one of verify-email, reset-password, …`](#presets-only-holds-something-that-is-not-a-preset--name-one-of-verify-email-reset-password-password-changed-email-changed-sign-in-code-magic-link-new-sign-in-welcome-invitation)
- [`presets: only holds the same preset twice`](#presets-only-holds-the-same-preset-twice)
- [`i18n: templates must be a list of template folders, as [{ dir: '/abs/path/emails' }] — emails, when given, names at least one, each once`](#i18n-templates-must-be-a-list-of-template-folders-as--dir-abspathemails---emails-when-given-names-at-least-one-each-once)
- [`i18n: templates[0] and templates[1] both have welcome.vue — keep one with emails: [...], or write the project's own in its folder`](#i18n-templates0-and-templates1-both-have-welcomevue--keep-one-with-emails--or-write-the-projects-own-in-its-folder)
- [`i18n: de: presets.link-fallback is missing — en, the fallback locale, has it`](#i18n-de-presetslink-fallback-is-missing--en-the-fallback-locale-has-it)
- [`i18n: fr: verify-email.body uses {brand}, which en does not declare`](#i18n-fr-verify-emailbody-uses-brand-which-en-does-not-declare)

**Build**: while `maizzle build` renders
- [`i18n: en: verify-email calls t('common.footer.why'), which is not a key of the catalogues`](#i18n-en-verify-email-calls-tcommonfooterwhy-which-is-not-a-key-of-the-catalogues)
- [`i18n: en: verify-email calls t('verify-email.preheader'), which is not a key of the catalogues`](#i18n-en-verify-email-calls-tverify-emailpreheader-which-is-not-a-key-of-the-catalogues)
- [`TypeError: Cannot read properties of undefined (reading 'name')`](#typeerror-cannot-read-properties-of-undefined-reading-name)
- [`i18n: en/new-sign-in.html is empty — a tag of its template resolved to no component; list the plugin that brings it, as ui()`](#i18n-ennew-sign-inhtml-is-empty--a-tag-of-its-template-resolved-to-no-component-list-the-plugin-that-brings-it-as-ui)
- [`i18n: en: verify-email passes {brand} to verify-email.body, which does not use it`](#i18n-en-verify-email-passes-brand-to-verify-emailbody-which-does-not-use-it)

**Sending**: when your code renders a built preset
- [`render: reset-password needs the variable expiresIn`](#render-reset-password-needs-the-variable-expiresin)

**Upgrading**
- [`i18n: en: verify-email calls t('presets.linkExpires'), which is not a key of the catalogues`](#i18n-en-verify-email-calls-tpresetslinkexpires-which-is-not-a-key-of-the-catalogues)

**Traps: a build that succeeds and is wrong**
- [A bug in `@nxgt/mail-presets` itself](#a-bug-in-nxgtmail-presets-itself)

**Contributing to this package**
- [``samples/ is what the build writes — run `bun run samples` after a change``](#samples-is-what-the-build-writes--run-bun-run-samples-after-a-change)

---

## Wiring

### `presets: options must be an object, as { only: ['verify-email'] }`

**When:** loading `maizzle.config.ts`, when `presets` is called with the list
of names directly (`presets(['welcome'])`), a string (`presets('welcome')`),
`null`, or another value that is not an object.
**Why:** `presets` takes one optional object. Its one option, `only`, names
the presets to build. Call it with nothing to build every preset.
**Fix:**

```ts
import { presets } from '@nxgt/mail-presets';

const mails = presets({ only: ['welcome'] });   // not presets(['welcome']), not presets('welcome')
```

### `presets: only must list at least one preset, as ['verify-email']`

**When:** loading `maizzle.config.ts`, when `only` is an empty list or a
single name rather than a list (`only: 'welcome'`).
**Why:** `only` keeps the presets it names and no other, so an empty list
would build none of them.
**Fix:** pass a list, or leave `only` out to build every preset:

```ts
presets({ only: ['welcome'] });   // not only: 'welcome', not only: []
presets();                        // every preset
```

### `presets: only holds something that is not a preset — name one of verify-email, reset-password, password-changed, email-changed, sign-in-code, magic-link, new-sign-in, welcome, invitation`

**When:** loading `maizzle.config.ts`, when `only` names an e-mail the
package does not ship. Common causes are a typo, a name in camelCase
(`'verifyEmail'`), a name with `.vue`, or a name of your own template such as
`'sign-in'`.
**Why:** `only` names the package's templates, by the name of their file and
of their built file (`dist/en/verify-email.html`). The message lists them.
TypeScript refuses such a name too, where the config is type-checked.
**Fix:**

```ts
import { PRESETS, presets } from '@nxgt/mail-presets';

presets({ only: ['verify-email', 'sign-in-code'] });   // not 'verifyEmail', not 'sign-in'
console.log(PRESETS);                                   // every name
```

An e-mail of your own goes in the project's `emails/`, not in `only`.

### `presets: only holds the same preset twice`

**When:** loading `maizzle.config.ts`, when `only` names a preset twice. This
usually happens when a list is joined from two others.
**Why:** each preset is built once. A name given twice is a mistake in the
list that builds it.
**Fix:**

```ts
presets({ only: [...new Set([...authMails, ...accountMails])] });
```

### `i18n: templates must be a list of template folders, as [{ dir: '/abs/path/emails' }] — emails, when given, names at least one, each once`

**When:** loading `maizzle.config.ts`, most often when the presets' templates
are passed alone instead of in a list: `templates: mails.templates`.
**Why:** `@nxgt/mail-i18n` takes a list of template folders, so that several
packages can each ship templates. `presets()` answers one folder.
**Fix:** wrap it in a list, even when there is one:

```ts
i18n({
  locales: ['en', 'fr'],
  catalogues: [uiCatalogues, mails.catalogues],
  templates: [mails.templates],   // not templates: mails.templates
});
```

### `i18n: templates[0] and templates[1] both have welcome.vue — keep one with emails: [...], or write the project's own in its folder`

**When:** loading `maizzle.config.ts`, when `templates` lists the presets'
folder twice with a preset in common. This usually happens when `presets()`
is called twice, once for each group of e-mails, the two `only` lists share a
preset or one call has no `only`, and both answers are listed.
**Why:** each e-mail is built once. Two entries that ship the same e-mail
leave no obvious one to build, so `@nxgt/mail-i18n` refuses to pick.
**Fix:** call `presets()` once, with every preset you build:

```ts
const mails = presets({ only: ['verify-email', 'reset-password', 'welcome'] });

i18n({
  locales: ['en', 'fr'],
  catalogues: [uiCatalogues, mails.catalogues],
  templates: [mails.templates],   // not [authMails.templates, accountMails.templates]
});
```

To replace a preset with your own, write `emails/welcome.vue` in the project.
It wins over the preset, and this error does not apply to it.

### `i18n: de: presets.link-fallback is missing — en, the fallback locale, has it`

The message names your locale. The key starts `presets.` or with a preset's
key (`verify-email.`, `sign-in-code.`, …), or `common.` when the `common` keys
are missing as well (`i18n: de: common.footer.ignore is missing — …`).
After an upgrade to 0.2, a catalogue written for 0.1 misses the keys it
added: `presets.code-expires` and `presets.link-expires`
(`i18n: de: presets.code-expires is missing — …`), and `invitation.expires`
when it builds `invitation`. Translate them with the `{expiresIn}` argument,
as `"Dieser Link läuft in {expiresIn} ab."`.

**When:** loading `maizzle.config.ts`, when the project builds a locale other
than `en` and `fr`, such as `locales: ['en', 'de']`.
**Why:** the presets' messages ship in `en` and `fr` only, and so do
`@nxgt/mail-ui`'s `common` messages. Every locale must have every key of the
fallback locale.
**Fix:** write the missing messages in the project's own catalogue:

```jsonc
// locales/de.json
{
  "common": { "greeting": "Hallo {name},", "footer": { "why": "…", "ignore": "…" } },
  "presets": { "code-expires": "…", "link-expires": "…", "link-fallback": "…", "not-you": "…" },
  "verify-email": { "subject": "…", "preheader": "…", "title": "…", "body": "…", "action": "…" }
}
```

The keys to write are the ones in `presetCatalogues.en` and
`uiCatalogues.en`. With `only`, write just the `presets` group and the groups
of the presets kept, as `presets({ only }).catalogues.en` shows:

```ts
import { presets } from '@nxgt/mail-presets';

console.log(JSON.stringify(presets({ only: ['verify-email'] }).catalogues.en, null, 2));
```

### `i18n: fr: verify-email.body uses {brand}, which en does not declare`

The message names a locale the project did not override, a preset's key, and
an argument of the preset's message.

**When:** loading `maizzle.config.ts`, after the project overrides a preset's
message in `locales/en.json` with other arguments than the preset's, as
`"body": "Confirm your address for {company}."` in place of the preset's
`{brand}`.
**Why:** a project's message replaces the preset's in that locale only. The
other locale keeps the preset's text, and every locale must use only the
arguments that the fallback locale declares.
**Fix:** keep the preset's arguments in the override. They are the ones in
the preset's own message:

```ts
import { presetCatalogues } from '@nxgt/mail-presets';

console.log(presetCatalogues.en['verify-email']);   // body: '… your {brand} account.'
```

```jsonc
// locales/en.json
{ "verify-email": { "body": "Confirm your address to start using {brand}." } }
```

When both locales are overridden with a new argument, as `{company}` in `en`
and in `fr`, the build stops later, on
`i18n: en: verify-email calls t('verify-email.body') without {company}`: the
preset's template passes `brand`, not `company`. To add an argument, write
the project's own template in `emails/verify-email.vue`, which replaces the
preset's.

---

## Build

These fail while `maizzle build` renders a template. The build stops, and the
line to read starts `Error:` or `TypeError:`, after Vue's warnings and a stack
trace. Maizzle builds the locales in no set order, so the locale in the
message is `en` in one run and `fr` in the next.

### `i18n: en: verify-email calls t('common.footer.why'), which is not a key of the catalogues`

The message names a preset, and the key starts `common.`.

**When:** `maizzle build`, on the first preset, when `catalogues` holds the
presets' messages but not `uiCatalogues`.
**Why:** a preset's layout and greeting use `@nxgt/mail-ui`'s shared
`common.*` messages, which ship in `uiCatalogues`. `presets().catalogues`
holds only the presets' own messages.
**Fix:** pass both, `uiCatalogues` first:

```ts
i18n({
  locales: ['en', 'fr'],
  catalogues: [uiCatalogues, mails.catalogues],   // not [mails.catalogues]
  templates: [mails.templates],
});
```

### `i18n: en: verify-email calls t('verify-email.preheader'), which is not a key of the catalogues`

The message names a preset, and the key starts with that preset's key
(`verify-email.`, `sign-in-code.`, …) or `presets.`.

**When:** `maizzle build`, on the first preset, when `templates` holds the
presets' templates but `catalogues` does not hold their messages.
**Why:** `presets()` answers the templates and their messages separately,
because `@nxgt/mail-i18n` takes each in its own option. Passing one without
the other builds templates that have no text.
**Fix:** pass `mails.catalogues` with `mails.templates`, from the same
`presets()` call:

```ts
const mails = presets({ only: ['verify-email'] });

i18n({
  locales: ['en', 'fr'],
  catalogues: [uiCatalogues, mails.catalogues],
  templates: [mails.templates],
});
```

When `only` differs between two `presets()` calls, the catalogues of one lack
the messages of the templates of the other. Call it once.

### `TypeError: Cannot read properties of undefined (reading 'name')`

It follows `[Vue warn]: Failed to resolve component: NxLayout` (and
`NxTypography`, `NxButton`, …) and
`[Vue warn]: Property "brand" was accessed during render but is not defined on instance.`

**When:** `maizzle build`, on the first preset, when `ui()` is not in the
plugins. That includes a project that registers `@nxgt/mail-ui`'s components
itself, with `COMPONENTS_DIR` in `components.source`, instead of calling
`ui()`.
**Why:** the presets are built with `@nxgt/mail-ui`'s components and read
the brand that `ui()` gives every template (`brand.name`). Maizzle resolves
no component in a template under `node_modules`, where the presets are
installed; `ui()` does it for them. Without `ui()`, the components do not
resolve and `brand` is undefined.
**Fix:** add `ui()`, with your brand, and remove any `components.source`
entry that points at `COMPONENTS_DIR`:

```ts
export default defineMailConfig({
  plugins: [
    ui({ brand: { name: 'Acme', url: 'https://acme.example' } }),
    i18n({ /* … */ }),
  ],
});
```

### `i18n: en/new-sign-in.html is empty — a tag of its template resolved to no component; list the plugin that brings it, as ui()`

It follows `[Vue warn]: Failed to resolve component: NxLayout` (and
`NxTypography`, `NxButton`, …).

**When:** `maizzle build`, after the templates, when `ui()` is not in the
plugins and the presets built read no brand, as with
`presets({ only: ['new-sign-in'] })`. The other presets stop earlier, on the
`TypeError` above.
**Why:** without `ui()`, the presets' components do not resolve, and Vue
renders a component it cannot resolve as nothing. The e-mail would go out
blank.
**Fix:** add `ui()`, as above.

### `i18n: en: verify-email passes {brand} to verify-email.body, which does not use it`

**When:** `maizzle build`, on that preset, after the project overrides one of
its messages in every locale with a text that leaves out an argument the
preset's template passes, as `"body": "Confirm your address."` in
`locales/en.json` and `"body": "Confirmez votre adresse."` in
`locales/fr.json`.
**Why:** a template passes exactly the arguments its message uses, and one
more is refused: the message and the template disagree. The preset's
template still passes `brand`.
**Fix:** keep the argument in the override, or write the project's own
template in `emails/verify-email.vue`, which replaces the preset's:

```jsonc
// locales/en.json
{ "verify-email": { "body": "Confirm your address to start using {brand}." } }
```

When only `en` leaves the argument out, the build stops earlier, when the
config loads, on `i18n: fr: verify-email.body uses {brand}, which en does not
declare`.

---

## Sending

These come from `@nxgt/mail`'s renderer, `createMailRenderer` from
`@nxgt/mail/renderer`, when your code renders a preset the build wrote.

### `render: reset-password needs the variable expiresIn`

An `Error`, from `@nxgt/mail`'s renderer: its
[`render: <email> needs the variable <key>`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#render-email-needs-the-variable-key).
The e-mail named may be `verify-email`, `reset-password`, `magic-link`,
`sign-in-code` or `invitation`. Typed with `MailEmails`, the same call does not compile:
`Property 'expiresIn' is missing in type '…' but required in type …`.

**When:** `mails.render(…)`, after an upgrade to 0.2, with the values that
0.1's e-mails took (`{ name, link }`, `{ code }`,
`{ inviter, organization, link }`).
**Why:** from 0.2, the five presets whose link or code expires say how long
it lives, `This link expires in {{ expiresIn }}.`, and the server is the one
that knows.
**Fix:** pass `expiresIn`, a duration already written in the recipient's
language:

```ts
const hours = new Intl.NumberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'long' });
mails.render('reset-password', { name, link, expiresIn: hours.format(1) }, { locale }); // '1 hour', '1 heure'
```

Pass text, not a number: `expiresIn: 3600` renders
`This link expires in 3600.` To say nothing about expiry, replace the
template with your own in `emails/`; see
[Replacing a template](guide/presets.md#replacing-a-template).

---

## Upgrading

### `i18n: en: verify-email calls t('presets.linkExpires'), which is not a key of the catalogues`

**When:** after upgrading `@nxgt/mail-presets` to a version whose messages
moved to `kebab-case` keys (0.3), on your own override in
`locales/<locale>.json` for a preset or a shared `presets.*` message, or a
template of your own that still calls the old `camelCase` key.
**Why:** `@nxgt/mail-i18n` accepts a `camelCase` or a `kebab-case` key, so
this is not a format refusal — but the specific key moved: every preset's
namespace (`verifyEmail` becoming `verify-email`, `resetPassword` becoming
`reset-password`, `passwordChanged` becoming `password-changed`,
`emailChanged` becoming `email-changed`, `signInCode` becoming
`sign-in-code`, `magicLink` becoming `magic-link`, `newSignIn` becoming
`new-sign-in`) and the shared `presets.*` group (`codeExpires`,
`linkExpires`, `linkFallback`, `notYou` becoming `code-expires`,
`link-expires`, `link-fallback`, `not-you`). An override under the old key
is not an error by itself — it becomes a key of its own that no preset
reads. **This is silent only in the fallback locale**: an override under
the old key in the fallback locale's own file (`locales/en.json`) builds
without complaint, until a template's own call to the new key finds nothing
under the old one. The same override in another locale's file is not
silent — the fallback locale's catalogue never gained the old key, so the
build fails immediately, naming the locale and the key:

```
i18n: fr: presets.linkExpires is not a key of en, the fallback locale
```

**Fix:** rename the key in your override and in any template you replaced a
preset with — see the package's changeset for the full old → new list:

```json
// locales/en.json — before
{ "verifyEmail": { "action": "Yes, this is my address" } }
```

```json
// locales/en.json — after
{ "verify-email": { "action": "Yes, this is my address" } }
```

## Traps: a build that succeeds and is wrong

### A bug in `@nxgt/mail-presets` itself

A preset that fails to build with the config at the top of this page, or a
text that differs between `en` and `fr` in meaning, is a bug in this package.
The same goes for a built e-mail that differs from its sample in `samples/`
for the same brand and theme. Open an issue on
[`softistx/nxgt-mail`](https://github.com/softistx/nxgt-mail/issues) with the
message, the package version, the Maizzle version, and your
`maizzle.config.ts`. Never include a real address or link.

---

## Contributing to this package

### ``samples/ is what the build writes — run `bun run samples` after a change``

**When:** `bun test` in `packages/mail-presets`, after a change to a template
in `emails/`, a message in `src/locales/`, or anything that changes the
built HTML, including a change to `@nxgt/mail-ui`'s components or theme. The
diff shows the old text as expected and the new text as received.
**Why:** `samples/` holds each preset as the test fixture builds it, and
the spec compares a fresh build with it, file by file. The samples must stay
what the package builds.
**Fix:** rebuild them, check the diff, and commit it with the change:

```sh
cd packages/mail-presets
bun run samples      # builds test/fixture, copies its HTML to samples/, rewrites samples/README.md
git diff samples/
```

Never edit `samples/` by hand.
