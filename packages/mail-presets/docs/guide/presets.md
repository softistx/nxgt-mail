# Wiring the presets

This page is for adding the presets to a project: what `presets()` answers,
how `@nxgt/mail-i18n` builds it beside your own templates, and how your
project replaces a template, overrides a message, or adds a locale.

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { presets } from '@nxgt/mail-presets';
import { ui, uiCatalogues } from '@nxgt/mail-ui';

const mails = presets({ only: ['verify-email', 'reset-password'] });

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

```json
// locales/en.json, and the same in locales/fr.json — nothing to override yet
{}
```

`maizzle build` writes:

```text
dist/
  en/reset-password.html   en/reset-password.txt
  en/verify-email.html     en/verify-email.txt
  fr/reset-password.html   fr/reset-password.txt
  fr/verify-email.html     fr/verify-email.txt
  mail-manifest.json
```

The header and the footer show `Acme`, the button is in `ui()`'s theme, and
`{{ name }}` and `{{ link }}` wait for the values the sender fills.

## The signature

```ts
import type { Catalogues, TemplateSource } from '@nxgt/mail-i18n';

const PRESETS: readonly [
	'verify-email',
	'reset-password',
	'password-changed',
	'email-changed',
	'sign-in-code',
	'magic-link',
	'new-sign-in',
	'welcome',
	'invitation',
];

type PresetName = (typeof PRESETS)[number];

interface PresetsOptions {
	/** The presets to build, at least one. Default every one. */
	readonly only?: readonly [PresetName, ...PresetName[]];
}

interface Presets {
	/** For i18n({ templates }). */
	readonly templates: TemplateSource;
	/** For i18n({ catalogues }): the messages of the presets kept, and the shared presets.*. */
	readonly catalogues: Catalogues;
}

function presets(options?: PresetsOptions): Presets;
```

`presets()` reads nothing and writes nothing: it answers where the templates
are and which messages go with them. The build is `@nxgt/mail-i18n`'s, with
your `ui()` — your brand, your theme, your components.

## Options

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `only` | `readonly [PresetName, ...PresetName[]]` | every preset | The presets to build, at least one. The others are neither built nor in the manifest, and their messages are left out of `catalogues` |

`only: []` does not compile: leave `only` out for every preset. The options
are an object even for one preset — `presets(['welcome'])` does not compile,
and throws when the config loads.

## What it answers

With no option, the whole folder and every message:

```ts
import { presetCatalogues, presets, TEMPLATES_DIR } from '@nxgt/mail-presets';

const all = presets();
// all.templates  → { dir: TEMPLATES_DIR }
// all.catalogues → presetCatalogues, { en: {…}, fr: {…} }
```

`presetCatalogues` is frozen, every group in it: read it, never change it.
Your `locales/<locale>.json` is where a message changes — see
[Overriding a message](#overriding-a-message).

```ts
import { presetCatalogues } from '@nxgt/mail-presets';

Object.isFrozen(presetCatalogues.en?.verifyEmail); // true — and its type is readonly
```

With `only`, the folder with the e-mails to keep, and only their messages
with the shared `presets.*` group:

```ts
const one = presets({ only: ['sign-in-code'] });
// one.templates  → { dir: TEMPLATES_DIR, emails: ['sign-in-code'] }
// Object.keys(one.catalogues.en) → ['presets', 'signInCode']
```

| Field | What `i18n()` does with it |
| --- | --- |
| `templates.dir` | `TEMPLATES_DIR`, the absolute path of the package's `emails/`. Its templates are built once per locale, like yours; a name your own `emails/` also has is taken from yours |
| `templates.emails` | Present with `only`: the templates of the folder to build, and no other |
| `catalogues` | Merged under your `locales/<locale>.json`, key by key, in the order `catalogues` lists it |

Pass `mails.templates` whole: `templates: [mails.templates.dir]` does not
compile, and `i18n()` would refuse it with a `TypeError` if it did.

The rest of the exports serve a project that wants to look inside:

```ts
import { PRESETS, type PresetName, TEMPLATES_DIR } from '@nxgt/mail-presets';

const wanted: PresetName[] = PRESETS.filter((name) => name !== 'invitation');
const source = `${TEMPLATES_DIR}/verify-email.vue`; // to copy it into your emails/
```

## Your templates beside them

Your `emails/` is built as before. Its templates and the presets end up in
the same `dist/` and the same manifest:

```vue
<!-- emails/order-shipped.vue -->
<template>
  <NxLayout>
    <NxTypography>{{ t('orderShipped.body', { order: placeholder('order') }) }}</NxTypography>
  </NxLayout>
</template>
```

```json
// locales/en.json
{ "orderShipped": { "subject": "Order {order} is on its way", "body": "Order {order} has shipped." } }
```

The presets' messages are under their own keys (`verifyEmail.*`,
`presets.*`), so yours do not collide with them unless you mean them to.

## Replacing a template

A template in your `emails/` with the name of a preset is built instead of
the package's. Your folder is read first, and a name found there is never
taken from the package:

```vue
<!-- emails/welcome.vue -->
<template>
  <NxLayout :preheader="t('welcome.preheader')">
    <NxTypography variant="headline-small">{{ t('welcome.title', { brand: brand.name }) }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('welcome.body') }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('welcome.action') }}</NxButton>
    <NxTypography variant="caption">{{ t('welcome.help') }}</NxTypography>
  </NxLayout>
</template>
```

```json
// locales/en.json
{ "welcome": { "help": "Questions? Reply to this e-mail." } }
```

```json
// locales/fr.json
{ "welcome": { "help": "Une question ? Répondez à cet e-mail." } }
```

It uses the preset's `welcome.*` messages and adds one. Its placeholders are
whatever it writes: the manifest records yours, not the package's. To start
from the package's template, copy `${TEMPLATES_DIR}/welcome.vue`.

A replaced preset still needs its messages when your template calls them:
keep it in `only` (or leave `only` out), or write every key it uses in your
catalogues.

## Overriding a message

Your `locales/<locale>.json` goes over the package's messages, key by key, in
each locale:

```json
// locales/en.json
{ "verifyEmail": { "action": "Yes, this is my address" } }
```

```json
// locales/fr.json — no override: the French button stays "Confirmer mon adresse"
{}
```

The English button says `Yes, this is my address`; every other message,
English or French, stays the package's. An override keeps the arguments
the template passes: in `en`, the fallback locale, `verifyEmail.body` keeps
`{brand}`, or the build fails with
`i18n: en: verify-email passes {brand} to verifyEmail.body, which does not use it`.
In `fr` it may leave `{brand}` out, and never use an argument `en` does not
declare. To change what a template passes, replace the template. The keys of
every preset are in [The e-mails](emails.md), and the merge rules in
`@nxgt/mail-i18n`'s
[Catalogues](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/guide/catalogues.md#catalogues-from-a-package).

## `ui()` and `uiCatalogues` are required

The templates are made of `@nxgt/mail-ui`'s components (`<NxLayout>`,
`<NxButton>`, `<NxCode>`…) and call its shared messages: `common.greeting`,
`common.footer.ignore`, and `common.footer.why`, which `<NxLayout>` writes in
every footer. So:

- `ui({ brand })` is in `plugins`, or no component renders. The templates
  are installed under `node_modules`, where Maizzle resolves no tag: `ui()`
  resolves them — your `components/` first, then its `Nx*` components, then
  Maizzle's built-ins (see its
  [Components from a package](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/docs/guide/plugin.md#components-from-a-package)).
  Without it, every preset renders empty and the build fails:

```text
Error: i18n: en/verify-email.html is empty — a tag of its template resolved to no component; list the plugin that brings it, as ui()
```

- `uiCatalogues` is in `catalogues`, or your catalogues hold the `common`
  keys, or the build fails:

```text
Error: i18n: en: verify-email calls t('common.footer.why'), which is not a key of the catalogues
```

Without `mails.catalogues`, it fails on the first preset message instead:

```text
Error: i18n: en: verify-email calls t('verifyEmail.preheader'), which is not a key of the catalogues
```

## Another locale

The presets are written in `en` and `fr`. A project that builds another
locale writes, in its catalogue for it, every key the fallback locale has:
the three `common` keys, the four `presets` keys, and the group of each preset
it builds. Otherwise the build fails on the first one missing:

```text
Error: i18n: de: presets.linkFallback is missing — en, the fallback locale, has it
```

With `presets({ only: ['sign-in-code'] })` and `locales: ['en', 'fr', 'de']`:

```json
// locales/de.json
{
	"common": {
		"greeting": "Hallo {name},",
		"footer": {
			"why": "Sie erhalten diese E-Mail, weil Sie ein Konto bei {brand} haben.",
			"ignore": "Wenn Sie dies nicht angefordert haben, können Sie diese E-Mail ignorieren."
		}
	},
	"presets": {
		"codeExpires": "Dieser Code läuft in {expiresIn} ab.",
		"linkExpires": "Dieser Link läuft in {expiresIn} ab.",
		"linkFallback": "Wenn die Schaltfläche nicht funktioniert, öffnen Sie diesen Link:",
		"notYou": "Wenn Sie das nicht waren, sichern Sie jetzt Ihr Konto."
	},
	"signInCode": {
		"subject": "Ihr Anmeldecode: {code}",
		"preheader": "Geben Sie diesen Code ein, um sich anzumelden.",
		"title": "Ihr Anmeldecode",
		"body": "Geben Sie diesen Code ein, um sich bei {brand} anzumelden. Er gilt einmal.",
		"ignore": "Wenn Sie sich nicht anmelden wollten, können Sie diese E-Mail ignorieren."
	}
}
```

The manifest then has `"de": "Ihr Anmeldecode: {{ code }}"` for its subject.
`presetCatalogues.en` is the list of keys to translate.

## Checking what your build sends

The manifest is the contract between the build and the code that sends. A
spec in your project keeps it from drifting when you replace a template or
upgrade the package:

```ts
// mail.spec.ts
import { expect, test } from 'bun:test';
import type { Manifest } from '@nxgt/mail-i18n';
import built from './dist/mail-manifest.json';

const manifest = built as Manifest;

test('the verification e-mail takes a name, a link and how long it lives', () => {
	expect(manifest.emails['verify-email']?.variables).toEqual(['expiresIn', 'link', 'name']);
	expect(manifest.emails['verify-email']?.urlVariables).toEqual(['link']);
});

test('the verification e-mail is built in every locale', () => {
	expect(Object.keys(manifest.emails['verify-email']?.files ?? {})).toEqual(['en', 'fr']);
});
```

Run it after `maizzle build`. Each preset's placeholders are in
[The e-mails](emails.md).

## Errors

`presets()` throws a bare `TypeError` when `maizzle.config.ts` loads:

| Message | Cause |
| --- | --- |
| `presets: options must be an object, as { only: ['verify-email'] }` | `presets(null)`, `presets(['welcome'])` — a list rather than `{ only: [...] }` — or anything that is not an object |
| `presets: only must list at least one preset, as ['verify-email']` | `only: []`, or `only: 'welcome'` |
| `presets: only holds something that is not a preset — name one of verify-email, reset-password, password-changed, email-changed, sign-in-code, magic-link, new-sign-in, welcome, invitation` | `only: ['sign-in']` |
| `presets: only holds the same preset twice` | `only: ['welcome', 'welcome']` |

```ts
presets({ only: [] });
// TypeError: presets: only must list at least one preset, as ['verify-email']
```

Four more come from `i18n()`'s `templates` option, when the config loads —
see `@nxgt/mail-i18n`'s
[Templates from a package](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/guide/templates.md#templates-from-a-package):

| Message | When |
| --- | --- |
| `i18n: templates must be a list of template folders, as [{ dir: '/abs/path/emails' }] — emails, when given, names at least one, each once` | A `TypeError` when the config loads: `templates: mails.templates` without the list, a relative `dir`, or an empty `emails` |
| `i18n: templates[0] has no template sign-in.vue — name one of its e-mails` | A plain `Error` when the config loads: an `emails` list written by hand, naming a template the folder does not have |
| `i18n: templates[0] holds no template — is /…/emails the folder of a package's e-mails?` | A plain `Error` when the config loads: a `dir` written by hand that is missing or has no template — use `TEMPLATES_DIR` |
| `i18n: templates[0] and templates[1] both have welcome.vue — keep one with emails: [...], or write the project's own in its folder` | A plain `Error` when the config loads: another package ships an e-mail of the same name as a preset. Keep one with `only`, or write your own `emails/welcome.vue` |

Every other failure is the build's, from the catalogues or the templates, and
is in `@nxgt/mail-i18n`'s
[Troubleshooting](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/troubleshooting.md).

## See also

- [The e-mails](emails.md) — each preset's placeholders, subject and messages.
- `@nxgt/mail-ui`'s
  [plugin](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/docs/guide/plugin.md)
  — the brand and the theme the presets are built with.
- [Samples](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-presets/samples/README.md)
  — every preset, built.
