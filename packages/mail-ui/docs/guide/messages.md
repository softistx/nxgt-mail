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
| `common.avatarGroup.more` | `{count, plural, other {# more}}` | `{count, plural, one {# autre} other {# autres}}` | `count`, a number |
| `common.timeline.empty` | `No activity yet` | `Aucune activité pour le moment` | — |
| `common.metrics.ofTarget` | `of {target}` | `sur {target}` | `target` |
| `common.metrics.thisPeriod` | `This period` | `Cette période` | — |
| `common.metrics.lastPeriod` | `Last period` | `Période précédente` | — |
| `common.seeAlso` | `See also` | `Voir aussi` | — |

```ts
import type { Catalogues } from '@nxgt/mail-i18n';
import { uiCatalogues } from '@nxgt/mail-ui';

const shared: Catalogues = uiCatalogues; // { en: { common: {…} }, fr: { common: {…} } }
```

`common.footer.why` is the one `<NxLayout>` writes itself, in its footer,
with the brand's name; `common.avatarGroup.more` is the label `<NxAvatarGroup>`
gives its `+N`, for a screen reader; `common.timeline.empty` is what
`<NxTimeline>` writes for no events, unless given `empty`;
`common.metrics.ofTarget` is `<NxGoalCard>`'s `of 24`, with its `target`;
`common.metrics.thisPeriod` and `common.metrics.lastPeriod` label
`<NxCompareCard>`'s two boxes, unless given their `label`; `common.seeAlso`
heads `<NxSeeAlso>`, unless given `label`. The other two, `common.greeting`
and `common.footer.ignore`, are for your templates.

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
// locales/fr.json — no common: the nine French messages are uiCatalogues'
{
	"welcome": { "subject": "Bienvenue chez Acme, {name}", "body": "Votre compte est prêt." }
}
```

The English build writes `Hi {{ name }},`, the French one
`Bonjour {{ name }},`; both keep the eight other `common` messages from the
package. The merge rules — several sources, a
message replacing a group — are in `@nxgt/mail-i18n`'s
[Catalogues](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/guide/catalogues.md#catalogues-from-a-package).

The merged catalogues are checked as your own are, against the fallback
locale: an override in `fr` may leave `{name}` out, but not use an argument
the `en` message does not declare.

## Another locale

`uiCatalogues` has `en` and `fr`. For any other locale, your catalogue writes
the nine `common` keys, or the build fails on the first one missing:

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
		},
		"avatarGroup": { "more": "{count, plural, other {# weitere}}" },
		"timeline": { "empty": "Noch keine Aktivität" },
		"metrics": {
			"ofTarget": "von {target}",
			"thisPeriod": "Dieser Zeitraum",
			"lastPeriod": "Vorheriger Zeitraum"
		},
		"seeAlso": "Siehe auch"
	},
	"welcome": { "subject": "Willkommen bei Acme, {name}", "body": "Ihr Konto ist bereit." }
}
```

`<NxLayout>` passes `{brand}` to `common.footer.why`, the brand's name, and
`<NxGoalCard>` `{target}` to `common.metrics.ofTarget`. A translation may
leave one out; it cannot add another argument.

## See also

- [Components](components.md#nxlayout) — the layout's footer slot, and the
  components that write a shared message.
- `@nxgt/mail-i18n`'s
  [Templates](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/guide/templates.md)
  — `t` and `placeholder`.
