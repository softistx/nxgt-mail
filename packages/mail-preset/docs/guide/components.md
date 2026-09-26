# Components

This page is for writing a template with the preset: `TransactionalLayout`,
the seven `Mail*` components, their props and slots, and what each one
renders.

```vue
<!-- emails/verify-email.vue -->
<script setup>
defineProps(['link', 'name', 'hours', 'code']);
</script>

<template>
  <TransactionalLayout :preheader="t('verifyEmail.preheader')">
    <MailHeading>{{ t('verifyEmail.title') }}</MailHeading>
    <MailText>{{ t('common.greeting', { name }) }}</MailText>
    <MailText>{{ t('verifyEmail.body') }}</MailText>
    <MailButton :href="link">{{ t('verifyEmail.action') }}</MailButton>
    <MailSpacer />
    <MailText>{{ t('verifyEmail.orCode') }}</MailText>
    <MailCode>{{ code }}</MailCode>
    <MailDivider />
    <MailText>{{ t('verifyEmail.expires', { hours }) }}</MailText>
    <template #footer>{{ t('common.footer.ignore') }}</template>
  </TransactionalLayout>
</template>
```

```json
{
	"verifyEmail": {
		"subject": "Confirm your e-mail address",
		"preheader": "One step left to finish signing up.",
		"title": "One step left",
		"body": "Confirm this address to finish signing up.",
		"action": "Confirm my address",
		"orCode": "Or enter this code:",
		"expires": "This link expires in {hours, plural, one {# hour} other {# hours}}."
	}
}
```

`common.greeting` and `common.footer.ignore` come from the preset (see
[Messages](messages.md)); the rest is the application's `messages/en.json`.
After `nxgt-mail build`:

```ts
import { mails } from './generated/mail';

const { subject, text } = mails.verifyEmail({
	locale: 'en',
	name: 'Ada',
	link: 'https://example.com/verify?token=abc',
	hours: 24,
	code: '482913',
});
// subject: 'Confirm your e-mail address'
// text:    'One step left to finish signing up. One step left Hello Ada, Confirm this address to finish signing up. Confirm my address
//
//           https://example.com/verify?token=abc
//
//           … Or enter this code: 482913 … This link expires in 24 hours. If you did not ask for this, you can ignore this e-mail.'
```

The components are used like Maizzle's own — no import, the name as a tag —
and a template holds only what any template may hold: props, `lang` and
`t('key', { prop })`, no `v-if`. Those rules are
[`@nxgt/mail-build`'s Templates guide](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/guide/templates.md).

## `TransactionalLayout`

The page every other component goes in: the canvas, a card holding the
template (the logo first, when the brand has one), and a footer under the
card.

| Prop or slot | Type | Default | Effect |
| --- | --- | --- | --- |
| `preheader` | `string` | none | The preview text a client shows beside the subject in the inbox, hidden in the e-mail. Without it, none is written |
| default slot | | | The content of the card |
| `#footer` | | `t('common.footer.why')` | The small, muted text under the card |

```vue
<!-- The footer says why the recipient got it, unless the template says otherwise. -->
<TransactionalLayout>
  <MailText>{{ t('orderPlaced.body') }}</MailText>
</TransactionalLayout>

<TransactionalLayout :preheader="t('passwordReset.preheader')">
  <MailText>{{ t('passwordReset.body') }}</MailText>
  <template #footer>{{ t('common.footer.ignore') }}</template>
</TransactionalLayout>
```

Pass the preheader as a message, `t('…')`: it is text the recipient reads,
translated like the rest. `common.footer.why` suits an e-mail a user's own
action triggered; `common.footer.ignore` suits one a user may not have asked
for — a verification, a password reset.

It also sets the page up for e-mail clients: the `lang` of the e-mail, a light
colour scheme, no automatic links on numbers, dates and addresses, images no
wider than the card, and Maizzle's Tailwind with the theme's tokens — see
[Theme](theme.md).

## `MailHeading`

```vue
<MailHeading>{{ t('verifyEmail.title') }}</MailHeading>
<MailHeading level="2">{{ t('orderPlaced.itemsTitle') }}</MailHeading>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `level` | `1` to `6`, a number or a string | `1` | `<h1>` to `<h6>` |

Bold, `text-2xl`, in `text-foreground`, whatever the level: the level is for
the structure, not the size. Write `level="2"` as a literal attribute: the
level is decided once, when the template is built.

## `MailText`

```vue
<MailText>{{ t('common.greeting', { name }) }}</MailText>
```

A paragraph in `text-base`, `text-foreground`, with space below it. It may
hold a `MailLink`:

```vue
<MailText>{{ t('orderPlaced.body') }} <MailLink :href="orderLink">{{ reference }}</MailLink></MailText>
```

## `MailButton`

```vue
<MailButton :href="link">{{ t('verifyEmail.action') }}</MailButton>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `href` | `string` | required | Where the button leads |

Maizzle's `Button`, with its Outlook fallback, in `bg-primary`,
`text-on-primary` and `rounded-button`. Bind `href` to a prop: the render
function checks it is an `http:`, `https:` or `mailto:` URL each time an
e-mail is rendered. The plain text writes the label, then the link.

## `MailLink`

```vue
<MailLink :href="orderLink">{{ reference }}</MailLink>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `href` | `string` | required | Where the link leads, checked as `MailButton`'s is |

Underlined, in `text-primary`, inline — usually inside a `MailText`.

## `MailDivider`

```vue
<MailDivider />
```

A horizontal rule in `bg-border`, with space above and below.

## `MailSpacer`

```vue
<MailSpacer />
```

Vertical space, 24 pixels — between a button and the text after it, for
instance.

## `MailCode`

```vue
<MailText>{{ t('verifyEmail.orCode') }}</MailText>
<MailCode>{{ code }}</MailCode>
```

A one-time code, easy to read and to copy: large, bold, monospaced
(`font-mono`, so `0` and `O` stand apart), spaced out and centred, on a
`bg-code` block with `rounded-card` corners. It is a table rather than a
`<div>`, because Outlook for Windows paints no background on a `<div>`.

Pass the code as a string prop — `'482913'` — so a leading zero survives.

## In a real project

Two e-mails sharing the layout, sent from a route handler:

```vue
<!-- emails/order-placed.vue -->
<script setup>
defineProps(['name', 'reference', 'orderLink']);
</script>

<template>
  <TransactionalLayout>
    <MailHeading>{{ t('orderPlaced.title', { name }) }}</MailHeading>
    <MailText>{{ t('orderPlaced.body') }} <MailLink :href="orderLink">{{ reference }}</MailLink></MailText>
  </TransactionalLayout>
</template>
```

```ts
import { type Mailer, pickLocale } from '@nxgt/mail';
import { fallbackLocale, locales, mails } from './generated/mail';

export async function confirmOrder(
	mailer: Mailer,
	user: { readonly email: string; readonly name: string; readonly locale: string | null },
	order: { readonly reference: string },
): Promise<void> {
	const locale = pickLocale(user.locale, locales, fallbackLocale);
	await mailer.send({
		to: user.email,
		...mails.orderPlaced({
			locale,
			name: user.name,
			reference: order.reference,
			orderLink: `https://example.com/orders/${encodeURIComponent(order.reference)}`,
		}),
	});
}
```

The footer of this one is `common.footer.why`, in the recipient's locale:
*You are receiving this e-mail because of an action on your account.*

## Replacing one

A `components/MailButton.vue` in your project replaces the preset's
`MailButton` in every template, and leaves the others alone — see
[Extending](extending.md#replacing-a-component).

## See also

- [Theme](theme.md) — the classes these components use, and their tokens.
- [Messages](messages.md) — the `common.*` keys the layout writes.
- [Mail clients](../../README.md#mail-clients) — what the rendered HTML was
  checked against.
