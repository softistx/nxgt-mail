# Messages

This page is for the messages the preset brings: the `common.*` keys in
English and French, overriding one of them, and adding a locale the preset
does not translate.

```vue
<template>
  <TransactionalLayout>
    <MailText>{{ t('common.greeting', { name }) }}</MailText>
    <MailText>{{ t('welcome.body') }}</MailText>
    <template #footer>{{ t('common.footer.ignore') }}</template>
  </TransactionalLayout>
</template>
```

A template calls them like its own messages; `TransactionalLayout` itself
writes `common.footer.why` when the template leaves its `#footer` slot empty.

## The keys

| Key | Arguments | `en` | `fr` |
| --- | --- | --- | --- |
| `common.greeting` | `name` | `Hello {name},` | `Bonjour {name},` |
| `common.footer.why` | | `You are receiving this e-mail because of an action on your account.` | `Vous recevez cet e-mail suite à une action sur votre compte.` |
| `common.footer.ignore` | | `If you did not ask for this, you can ignore this e-mail.` | `Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail.` |

`name` is a `string` argument: a template that writes `common.greeting` passes
it a prop, and that prop becomes a required `string` of the e-mail's render
function.

## Overriding one key

Write the same key in your own catalogue. It replaces the preset's in that
locale only, and every other key is kept. In `messages/en.json` (a catalogue
is strict JSON: no comment):

```json
{
	"common": {
		"footer": { "why": "You are receiving this e-mail because you have an Acme account." }
	},
	"welcome": {
		"subject": "Welcome to Acme",
		"body": "Your account is ready."
	}
}
```

English e-mails now carry the Acme footer; French ones keep
*Vous recevez cet e-mail suite à une action sur votre compte.* until
`messages/fr.json` overrides the key too.

An override is a message, never a namespace: `"common": "Hi"` fails the build
with `KEY_CONFLICT`. And it keeps to the arguments of the fallback locale's
message — `"greeting": "Bonjour {nom},"` in `fr` fails with
`ARGUMENT_UNDECLARED`. How catalogues merge is in
[`@nxgt/mail-build`'s Catalogues guide](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/guide/catalogues.md#merging-sources--presets-then-the-application).

## A locale the preset does not translate

The preset holds `en` and `fr`. A config with `locales: ['en', 'fr', 'de']`
needs every `common.*` key in `messages/de.json`, beside your own:

```json
{
	"common": {
		"greeting": "Hallo {name},",
		"footer": {
			"why": "Sie erhalten diese E-Mail aufgrund einer Aktion in Ihrem Konto.",
			"ignore": "Wenn Sie das nicht angefordert haben, können Sie diese E-Mail ignorieren."
		}
	},
	"welcome": {
		"subject": "Willkommen bei Acme",
		"body": "Ihr Konto ist bereit."
	}
}
```

Leave one out, and the build fails before writing anything, naming the first
missing key:

```text
messages: de: common.footer.ignore is missing — en, the fallback locale, has it
```

That is a `MailBuildError` with the code `KEY_MISSING`: nothing falls back to
the English text. It holds for every key the preset ships, including one no
template of yours calls — the layout calls `common.footer.why` in every
e-mail that keeps the default footer.

## The fallback locale

The preset's messages are checked like yours: the fallback locale's are the
reference. With `fallbackLocale: 'fr'`, the French `common.greeting` declares
`{name}`, and the English one is checked against it.

A fallback locale the preset does not translate — `fallbackLocale: 'de'` —
needs the `common.*` keys in `messages/de.json` for the same reason.

## See also

- [Components](components.md) — where the layout writes `common.footer.why`.
- [Extending](extending.md) — overriding a message from a preset of your own,
  for several applications at once.
