# Shared messages

This page is for the messages `@nxgt/mail-ui` brings to `@nxgt/mail-i18n`:
what they are, how your catalogues override them, and what a project in
another locale writes.

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

```vue
<!-- emails/welcome.vue -->
<template>
  <NxLayout>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('welcome.body') }}</NxTypography>
    <NxTypography variant="caption">{{ t('common.footer.ignore') }}</NxTypography>
  </NxLayout>
</template>
```

Your `locales/en.json` and `locales/fr.json` hold `welcome.subject` and
`welcome.body`; the `common` keys come from `uiCatalogues`. The English build
starts with `Hello {{ name }},` and the footer says `You received this e-mail
because you have an account with Acme.`

## The messages

| Key | `en` | `fr` | Arguments |
| --- | --- | --- | --- |
| `common.greeting` | `Hello {name},` | `Bonjour {name},` | `name` |
| `common.footer.why` | `You received this e-mail because you have an account with {brand}.` | `Vous recevez cet e-mail parce que vous avez un compte chez {brand}.` | `brand` |
| `common.footer.ignore` | `If you did not ask for this, you can ignore this e-mail.` | `Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.` | — |

```ts
import type { Catalogues } from '@nxgt/mail-i18n';
import { uiCatalogues } from '@nxgt/mail-ui';

const shared: Catalogues = uiCatalogues; // { en: { common: {…} }, fr: { common: {…} } }
```

`common.footer.why` is the one `<NxLayout>` writes itself, in its footer,
with the brand's name. The other two are for your templates.

## `<NxLayout>` needs `common.footer.why`

Once `i18n()` is in the plugins, `<NxLayout>` calls
`t('common.footer.why', { brand })`. Without `uiCatalogues`, and without the
key in your catalogues, the build fails:

```text
Error: i18n: fr: welcome calls t('common.footer.why'), which is not a key of the catalogues
```

Pass `catalogues: [uiCatalogues]`, or write the key yourself. The layout
formats it even when you fill its `footer` slot, so the key is needed either
way.

Without `@nxgt/mail-i18n`, `<NxLayout>` calls nothing and the footer shows the
brand's name alone.

## Overriding a message

Your catalogues are merged **over** `uiCatalogues`, key by key: write the
keys you want to change, and keep the others.

```json
// locales/en.json
{
	"common": { "greeting": "Hi {name}," },
	"welcome": { "subject": "Welcome to Acme, {name}", "body": "Your account is ready." }
}
```

```json
// locales/fr.json — no common: the three French messages are uiCatalogues'
{
	"welcome": { "subject": "Bienvenue chez Acme, {name}", "body": "Votre compte est prêt." }
}
```

The English build writes `Hi {{ name }},`, the French one
`Bonjour {{ name }},`; both keep `common.footer.why` and
`common.footer.ignore` from the package. The merge rules — several sources, a
message replacing a group — are in `@nxgt/mail-i18n`'s
[Catalogues](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/guide/catalogues.md#catalogues-from-a-package).

The merged catalogues are checked as your own are, against the fallback
locale: an override in `fr` may leave `{name}` out, but not use an argument
the `en` message does not declare.

## Another locale

`uiCatalogues` has `en` and `fr`. For any other locale, your catalogue writes
the three `common` keys, or the build fails on the first one missing:

```text
Error: i18n: de: common.footer.ignore is missing — en, the fallback locale, has it
```

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
	"welcome": { "subject": "Willkommen bei Acme, {name}", "body": "Ihr Konto ist bereit." }
}
```

`<NxLayout>` passes `{brand}` to `common.footer.why`, the brand's name. A
translation may leave it out; it cannot add another argument.

## See also

- [Components](components.md#nxlayout) — the layout's footer slot.
- `@nxgt/mail-i18n`'s
  [Templates](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/guide/templates.md)
  — `t` and `placeholder`.
