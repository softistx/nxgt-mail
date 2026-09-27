# Components

This page is for writing templates with the `Nx*` components: each one's
props, defaults and slots, and the `@nxgt/material-vue` component it mirrors.

```vue
<!-- emails/sign-in-code.vue -->
<template>
  <NxLayout preheader="Your sign-in code">
    <NxTypography variant="headline-small">Your sign-in code</NxTypography>
    <NxTypography>Enter this code to sign in to {{ brand.name }}.</NxTypography>
    <NxCode>493 812</NxCode>
    <NxTypography variant="caption">It expires in 15 minutes.</NxTypography>
  </NxLayout>
</template>
```

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/develop/packages/mail-ui/previews/components-en.png" width="420" alt="An e-mail using the first Nx components: layout, typography, code, buttons, separator, card with badge, summary data and status, alert, banner, link">

The components from `NxLayout` to `NxCode`, in one e-mail
([its template](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/test/fixture/emails/welcome.vue)).

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/develop/packages/mail-ui/previews/data-components.png" width="420" alt="An e-mail using the data components: a table with a footer and caption, an empty table, descriptions, list tiles with an avatar and a chip, chips, an avatar group and an avatar">

The components from `NxTable` to `NxAvatar`
([their template](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/test/fixture/emails/gallery.vue)).

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/develop/packages/mail-ui/previews/sequence-components.png" width="420" alt="An e-mail using the sequence components: three progress bars, three numbered steps joined by a line, a timeline of three toned events, and an empty timeline's text">

`NxProgress`, `NxSteps` and `NxTimeline`
([their template](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/test/fixture/emails/sequence.vue)).

Every component is registered by [`ui()`](plugin.md) and used with no import.
They keep material-vue's names (with the `Nx` prefix), its props and its
values, and render with tables and inlined styles, which every mail client
reads. They need no JavaScript and no web font.

## What every component shares

- **`class` is merged, not appended.** A class you pass wins over the
  component's own for the same property (Tailwind Merge):
  `<NxButton class="rounded-md">` replaces its `rounded-full`. Other
  attributes (`style`, `id`, `data-*`) go to the same element as `class`.
- **Block components end with space below.** `NxTypography`, `NxAlert`,
  `NxBanner`, `NxCard`, `NxCode`, `NxSummaryData`, `NxTable`,
  `NxDescription`, `NxAvatarGroup`, `NxProgress`, `NxSteps` and `NxTimeline`
  carry `mb-4`, `NxListTile` `mb-2`. On `NxTypography`, `NxSummaryData`,
  `NxTable`, `NxDescription`, `NxAvatarGroup`, `NxProgress`, `NxSteps` and
  `NxTimeline`, `class="mb-0"` removes it. `NxAlert`,
  `NxBanner`, `NxCard`, `NxCode` and `NxListTile` put their `class` on the box inside, and
  keep their 16px below: to change it, replace the component with your own
  (see [Replacing a component](plugin.md#replacing-a-component)).
- **Vertical space is Maizzle's `<Spacer>`**, which Outlook respects:

  ```vue
  <Spacer height="24px" />
  ```

- **Icons are slots.** An e-mail has no icon font: pass an `<img>` with an
  absolute URL, or a character, where a component has an `icon` slot.
- **A placeholder passes through.** `:href="placeholder('link')"` or
  `{{ placeholder('code') }}` from `@nxgt/mail-i18n` is written as is; no
  component branches on a value only known at send time.

## Summary

| Component | Mirrors | Props (default) | Slots |
| --- | --- | --- | --- |
| [`NxLayout`](#nxlayout) | the app shell | `lang`, `preheader`, `width` (`600`) | default, `footer` |
| [`NxTypography`](#nxtypography) | `Typography` | `variant` (`'normal'`), `as` | default |
| [`NxButton`](#nxbutton) | `Button` | `href` (required), `variant` (`'filled'`), `color` (`'primary'`), `size` (`'default'`), `align` | default |
| [`NxLink`](#nxlink) | a text link | `href` (required) | default |
| [`NxSeparator`](#nxseparator) | `Separator` | — | — |
| [`NxCard`](#nxcard-and-its-parts) | `Card` | — | default: its parts |
| `NxCardHeader` | `CardHeader` | `title`, `description` | default, `action` |
| `NxCardTitle`, `NxCardDescription` | `CardTitle`, `CardDescription` | — | default |
| `NxCardContent`, `NxCardFooter` | `CardContent`, `CardFooter` | — | default |
| [`NxBadge`](#nxbadge) | `Badge` | `variant` (`'default'`) | default |
| [`NxAlert`](#nxalert) | `Alert` | `variant` (`'primary'`), `title`, `description` | default, `icon`, `title`, `description` |
| [`NxBanner`](#nxbanner) | `Banner` | `tone` (`'info'`), `title`, `description` | default, `icon`, `action` |
| [`NxStatusIndicator`](#nxstatusindicator) | `StatusIndicator` | `tone` (`'neutral'`) | default |
| [`NxSummaryData`](#nxsummarydata) | `SummaryData` | `data` (`[]`), `inline` (`false`), `showEmpty` (`false`) | — |
| [`NxCode`](#nxcode) | — (e-mail's own) | — | default |
| [`NxTable`](#nxtable-and-its-parts) | `Table` | — | default: its parts |
| `NxTableHeader`, `NxTableBody`, `NxTableFooter` | `TableHeader`, `TableBody`, `TableFooter` | — | default: `NxTableRow`s |
| `NxTableRow`, `NxTableHead`, `NxTableCell`, `NxTableCaption` | `TableRow`, `TableHead`, `TableCell`, `TableCaption` | — | default |
| `NxTableEmpty` | `TableEmpty` | `colspan` (`1`) | default |
| [`NxDescription`](#nxdescription) | `Description` | `label` (required), `value` | default |
| [`NxListTile`](#nxlisttile) | `ListTile` | `title` (required), `subtitle`, `href`, `selected` (`false`), `disabled` (`false`), `size` (`'md'`) | `leading`, `trailing` |
| [`NxChip`](#nxchip) | `Chip` | `label`, `variant` (`'outlined'`), `color` (`'primary'`), `active` (`false`) | default, `avatar`, `leading`, `trailing` |
| [`NxAvatar`](#nxavatar-and-nxavatargroup) | `Avatar` | `size` (`32`, or its group's) | default: `NxAvatarImage` or `NxAvatarFallback` |
| `NxAvatarImage` | `AvatarImage` | `src` (required), `alt` | — |
| `NxAvatarFallback` | `AvatarFallback` | — | default |
| `NxAvatarGroup` | `AvatarGroup` | `max`, `size` (`'md'`) | default: `NxAvatar`s |
| [`NxProgress`](#nxprogress) | `Progress` | `modelValue` (`0`), `max` (`100`), `height` (`8`) | — |
| [`NxSteps`](#nxsteps-and-nxstepsitem) | `Steps` | — | default: `NxStepsItem`s |
| `NxStepsItem` | `StepsItem` | `title`, `index` (its place), `last` (set by `NxSteps`) | default, `index` |
| [`NxTimeline`](#nxtimeline) | `Timeline` | `items` (required), `empty` (a shared message) | — |

## NxLayout

The page of an e-mail: the brand's logo or name at the top, the content on a
card, and a footer. Every other component goes inside it: it holds the theme
in its `<style>`.

```vue
<template>
  <NxLayout preheader="Your account is ready" :width="560">
    <NxTypography>Welcome aboard.</NxTypography>
    <template #footer>
      <p class="m-0 mb-2">You are receiving this because you signed up.</p>
    </template>
  </NxLayout>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `lang` | `string` | the template's `locale` with `@nxgt/mail-i18n`, else `'en'` | `<html lang>` |
| `preheader` | `string` | none | The text a client shows beside the subject, before the e-mail is opened (Maizzle's `<Preheader>`) |
| `width` | `number` | `600` | The card's maximum width, in pixels — and the fixed width of the table Outlook on Windows draws, since it ignores a maximum width |

| Slot | Default content |
| --- | --- |
| default | — the e-mail's content, on the card |
| `footer` | With `@nxgt/mail-i18n` listed: `t('common.footer.why', { brand: brand.name })`, as `You received this e-mail because you have an account with Acme.` Without it: nothing |

Under the footer slot, the brand's name is always written, linked to
`brand.url` when there is one.

The page behind the card is `paper` (5% of the primary colour over the
background), the card `card` with a `border` line and `rounded-xl` corners.
The layout declares `<meta name="color-scheme" content="light">`: there is no
dark version — see [The theme](theme.md#light-only).

It is built on Maizzle's `<Html>`, `<Head>`, `<Body>`, `<Preheader>` and
`<Container>`, so Maizzle's Outlook and client resets apply, and the
`<Container>` writes the fixed-width table that holds the card at `width` in
Outlook.

## NxTypography

Text, on the tag an e-mail reads it as.

```vue
<template>
  <NxTypography variant="headline-small">Reset your password</NxTypography>
  <NxTypography>Someone asked to reset the password of your account.</NxTypography>
  <NxTypography variant="caption">If it was not you, ignore this e-mail.</NxTypography>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `variant` | see below | `'normal'` | Size and weight |
| `as` | `string` | by `variant` | The tag: `h1`, `p`, `span`… |

| `variant` | Style | Tag |
| --- | --- | --- |
| `normal`, `body-medium` | `text-sm` | `p` |
| `body-small` | `text-xs` | `p` |
| `caption` | `text-[10px]`, muted | `p` |
| `headline-large` | `text-4xl`, semibold | `h1` |
| `headline-medium` | `text-3xl`, semibold | `h1` |
| `headline-small` | `text-2xl`, semibold | `h1` |
| `title-large` | `text-xl`, semibold | `h2` |
| `title-medium` | `text-lg`, semibold | `h3` |
| `title-small` | `text-base`, semibold | `h4` |

All are `text-foreground` with `m-0 mb-4`, but `caption`, which is
`text-muted-foreground`.

## NxButton

material-vue's `Button`, as a link: its variants, colours and sizes, on
Maizzle's `<Button>`, which pads it for Outlook.

```vue
<template>
  <NxButton :href="placeholder('link')">Confirm my address</NxButton>
  <NxButton href="https://acme.example/billing" variant="tonal" size="sm">See my invoice</NxButton>
  <NxButton href="https://acme.example/account/delete" variant="outlined" color="error">Delete my account</NxButton>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `href` | `string` | — (required) | Where it goes. A placeholder is fine |
| `variant` | `'filled' \| 'tonal' \| 'outlined' \| 'ghost' \| 'link'` | `'filled'` | See below |
| `color` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error' \| 'default'` | `'primary'` | `default` is the foreground colour |
| `size` | `'xs' \| 'sm' \| 'default' \| 'lg'` | `'default'` | Padding and text size |
| `align` | `'left' \| 'center' \| 'right'` | none | Aligns the button in its row |

| `variant` | Looks like |
| --- | --- |
| `filled` | The colour, with its `-foreground` text (`default`: foreground on background) |
| `tonal` | The colour at 15% over the background, with the colour as text |
| `outlined` | Transparent, a 1px border of the colour at 50%, the colour as text |
| `ghost` | Transparent, foreground text; `color` is ignored |
| `link` | No padding, no background: the colour as text, not underlined |

| `size` | Padding | Text |
| --- | --- | --- |
| `xs` | `px-2 py-1` | `text-xs` |
| `sm` | `px-3 py-2` | `text-sm` |
| `default` | `px-4 py-2.5` | `text-sm` |
| `lg` | `px-6 py-3` | `text-sm` |

Every variant but `link` is `rounded-full`, as in material-vue. The Outlook
padding for each size is set for you.

## NxLink

A link in running text, in material-vue's link colour (`info`), underlined —
a phone has no hover to reveal it.

```vue
<template>
  <NxTypography>
    Questions? Read the <NxLink href="https://acme.example/help">help centre</NxLink>.
  </NxTypography>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `href` | `string` | — (required) | Where it goes |

## NxSeparator

material-vue's horizontal `Separator`: a 1px line in the `border` colour,
with `py-6` around it. The space is padding, which Outlook keeps where it
drops a margin.

```vue
<template>
  <NxSeparator />
  <NxSeparator class="py-2" />
</template>
```

No props, no slot.

## NxCard and its parts

material-vue's `Card`: a bordered, rounded box, `bg-card`. Its parts are its
rows, so **only its parts go directly inside it**: `NxCardHeader`,
`NxCardContent`, `NxCardFooter`.

```vue
<template>
  <NxCard>
    <NxCardHeader title="Pro plan" description="Billed monthly">
      <template #action><NxBadge variant="success">Active</NxBadge></template>
    </NxCardHeader>
    <NxCardContent>
      <NxSummaryData :data="[{ label: 'Seats', value: 3 }, { label: 'Next invoice', value: '1 November' }]" />
    </NxCardContent>
    <NxCardFooter>
      <NxButton href="https://acme.example/billing" variant="tonal" size="sm">Manage billing</NxButton>
    </NxCardFooter>
  </NxCard>
</template>
```

| Part | Props | Slots | Renders |
| --- | --- | --- | --- |
| `NxCard` | — | default: its parts | The box, `py-6` |
| `NxCardHeader` | `title?: string`, `description?: string` | default (under the description), `action` (on the right) | A row, `px-6 pb-6` |
| `NxCardTitle` | — | default | `<h3>`, `text-base` semibold |
| `NxCardDescription` | — | default | `<p>`, `text-sm` muted |
| `NxCardContent` | — | default | A row, `px-6` |
| `NxCardFooter` | — | default | A row, `px-6 pt-6` |

`title` and `description` are shorthands for `NxCardTitle` and
`NxCardDescription`; use the parts in the default slot when the title needs
markup:

```vue
<template>
  <NxCardHeader>
    <NxCardTitle>Order <strong>#{{ placeholder('orderNumber') }}</strong></NxCardTitle>
    <NxCardDescription>Shipped today</NxCardDescription>
  </NxCardHeader>
</template>
```

## NxBadge

material-vue's `Badge`: a small pill of text, inline.

```vue
<template>
  <NxTypography>Your plan is <NxBadge variant="success">Active</NxBadge></NxTypography>
</template>
```

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'error' \| 'success' \| 'info' \| 'warning' \| 'outline' \| 'outlined'` | `'default'` |

`default` is the primary colour. Each colour variant is filled with its
`-foreground` text; `destructive` is `error` with white text; `outline` and
`outlined` are a `border` line with foreground text.

## NxAlert

material-vue's `Alert`: a block tinted at 5% of its colour, with an 8px bar of
the colour on its left.

```vue
<template>
  <NxAlert variant="warning" title="Heads up" description="The code expires in 15 minutes." />
  <NxAlert variant="error">
    <template #icon><img src="https://acme.example/icons/alert.png" width="16" alt=""></template>
    <template #title>Payment failed</template>
    We could not charge your card ending in {{ placeholder('last4') }}.
  </NxAlert>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'error' \| 'success' \| 'info' \| 'warning' \| 'foreground'` | `'primary'` | The colour. `foreground` is a foreground bar on the `muted` background |
| `title` | `string` | none | Bold, first line |
| `description` | `string` | none | Muted, under the title |

| Slot | Replaces |
| --- | --- |
| `icon` | Nothing: a 24px column on the left, shown only when given, in the variant's colour (`text-<variant>`), so a character icon takes it |
| `title`, `description` | The prop of the same name |
| default | — written under the description |

## NxBanner

material-vue's `Banner`: a status in a rounded box tinted at 10% of its tone,
with a border at 40%, and an optional action on the right.

```vue
<template>
  <NxBanner tone="info" title="New sign-in" description="From Firefox on Linux.">
    <template #action>
      <NxLink href="https://acme.example/security">Review</NxLink>
    </template>
  </NxBanner>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `tone` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | The colour of the box, and of the icon column's text |
| `title` | `string` | none | Semibold, first line |
| `description` | `string` | none | Muted, under the title |

| Slot | Effect |
| --- | --- |
| `icon` | A column on the left, in the tone's colour (a character takes it) |
| `action` | A column on the right, aligned to the middle |
| default | Written under the description |

## NxStatusIndicator

material-vue's `StatusIndicator`: a coloured dot before a label, inline. The
dot is a character (`●`), which every client sizes, where an empty `<span>`
would be dropped.

```vue
<template>
  <NxTypography>Invoice: <NxStatusIndicator tone="success">Paid</NxStatusIndicator></NxTypography>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `tone` | `'neutral' \| 'primary' \| 'success' \| 'info' \| 'warning' \| 'error'` | `'neutral'` | The dot's colour; `neutral` is muted |

## NxSummaryData

material-vue's `SummaryData`: labels and their values, one row each with a
line under it, or on one line with `inline`.

```vue
<template>
  <NxSummaryData
    :data="[
      { label: 'Order', value: placeholder('orderNumber') },
      { label: 'Items', value: 3 },
      { label: 'Discount', value: 0 },
      { label: 'Coupon', value: null },
    ]"
  />
  <NxSummaryData inline :data="[{ label: 'Plan', value: 'Pro' }, { label: 'Seats', value: 3 }]" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `data` | `{ label: string; value?: string \| number \| null }[]` | `[]` | The rows, in order |
| `inline` | `boolean` | `false` | One paragraph, `Plan: Pro  Seats: 3`, rather than a table |
| `showEmpty` | `boolean` | `false` | Keeps a row whose value is empty |

A row without a value (`undefined`, `null`, `''`) is left out, unless
`showEmpty`; `0` is a value and stays. Above, `Coupon` is left out and
`Discount` shows `0`. A placeholder is a value: its row is always written.

## NxCode

A code the reader types in, such as a one-time code: large, spaced, in
monospace, centred on the `muted` background. It has no material-vue
counterpart.

```vue
<template>
  <NxCode>{{ placeholder('code') }}</NxCode>
</template>
```

No props; the code is the default slot.

## NxTable and its parts

material-vue's `Table`: rows ruled by a line under each, a header in
`font-medium`, and a footer on the `muted` background with a line above it.
The parts are the HTML table's, so they nest as it does.

```vue
<template>
  <NxTable>
    <NxTableCaption>Prices include VAT.</NxTableCaption>
    <NxTableHeader>
      <NxTableRow>
        <NxTableHead>Item</NxTableHead>
        <NxTableHead class="text-right">Amount</NxTableHead>
      </NxTableRow>
    </NxTableHeader>
    <NxTableBody>
      <NxTableRow>
        <NxTableCell>Pro plan</NxTableCell>
        <NxTableCell class="text-right">{{ placeholder('amount') }}</NxTableCell>
      </NxTableRow>
    </NxTableBody>
    <NxTableFooter>
      <NxTableRow>
        <NxTableCell>Total</NxTableCell>
        <NxTableCell class="text-right">{{ placeholder('total') }}</NxTableCell>
      </NxTableRow>
    </NxTableFooter>
  </NxTable>
</template>
```

| Part | Props | Renders |
| --- | --- | --- |
| `NxTable` | — | `<table role="table">`, full width, `text-sm` |
| `NxTableHeader`, `NxTableBody`, `NxTableFooter` | — | `<thead>`, `<tbody>`, `<tfoot>` |
| `NxTableRow` | — | `<tr>` |
| `NxTableHead` | — | `<th>`, `h-10 px-2`, left-aligned, `font-medium`, a line under it; in `NxTableFooter`, a line above it instead, `bg-muted` |
| `NxTableCell` | — | `<td>`, `p-2`, a line under it; in `NxTableFooter`, a line above it instead, `bg-muted`, `font-medium` |
| `NxTableCaption` | — | `<caption>`, under the table, `text-sm` muted |
| `NxTableEmpty` | `colspan?: number` (`1`) | A row of one cell across `colspan` columns, centred, `py-10` — the text for a table with no rows. Its `class` goes on the cell |

A cell's text wraps, where material-vue's does not: a long value would
otherwise widen the e-mail past a phone's screen. `NxTableHead` keeps
`whitespace-nowrap`. Align a column with `class="text-right"` on its head and
its cells.

`NxTable` carries `role="table"`: Maizzle marks every other table
`role="none"`, a layout, and a screen reader then reads its rows as plain text.
The caption is placed under the table by `align="bottom"` as well as
`caption-side`, which some clients drop.

## NxDescription

material-vue's `Description`: a label in `font-semibold`, and its value under
it, muted.

```vue
<template>
  <NxDescription label="Billing period" value="September 2026" />
  <NxDescription label="Credits left" :value="0" />
  <NxDescription label="Coupon" :value="null" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `label` | `string` | required | The first line |
| `value` | `string \| number \| null` | none | The second line |

Like a row of `NxSummaryData`, a description without a value (`undefined`,
`null`, `''`) is left out entirely, and `0` is a value: above, `Coupon` is
not written. The default slot is written under the value.

## NxListTile

material-vue's `ListTile`: a title, a subtitle under it, and `leading` and
`trailing` slots on its sides, on a rounded box tinted at 5% of the primary
colour.

```vue
<template>
  <NxListTile title="Ada Lovelace" subtitle="Owner" href="https://acme.example/team/ada" selected>
    <template #leading>
      <NxAvatar><NxAvatarFallback>AL</NxAvatarFallback></NxAvatar>
    </template>
    <template #trailing><NxChip variant="tonal" color="success">Active</NxChip></template>
  </NxListTile>
  <NxListTile title="Grace Hopper" subtitle="Invited" size="sm" disabled />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `title` | `string` | required | `text-sm` semibold (`md`) or `text-[13px]` medium (`sm`) |
| `subtitle` | `string` | none | Muted, under the title |
| `href` | `string` | none | Makes the title a link |
| `selected` | `boolean` | `false` | A border at 40% of the primary colour, on a 15% tint (`md`) or a 10% one (`sm`) |
| `disabled` | `boolean` | `false` | A muted title, and no link even with `href` |
| `size` | `'sm' \| 'md'` | `'md'` | `md` is `px-4 py-2` on the tint; `sm` is `px-2 py-1.5` with no tint until selected |

material-vue's ring is a border here: a mail client draws no `box-shadow`.
Only the title is a link, not the whole tile: a mail client cannot make a
table cell clickable.

## NxChip

material-vue's `Chip`, static: a rounded label, with the colours of
[`NxButton`](#nxbutton).

```vue
<template>
  <NxTypography>
    <NxChip label="Design" />
    <NxChip label="Selected" active />
    <NxChip variant="tonal" color="success">Paid</NxChip>
  </NxTypography>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `label` | `string` | none | The text, when the default slot is empty |
| `variant` | `'filled' \| 'tonal' \| 'outlined' \| 'ghost' \| 'link'` | `'outlined'` | As `NxButton`'s |
| `color` | `'default' \| 'primary' \| 'secondary' \| 'error' \| 'success' \| 'info' \| 'warning'` | `'primary'` | As `NxButton`'s |
| `active` | `boolean` | `false` | Makes it `filled`, whatever its `variant` |

| Slot | Effect |
| --- | --- |
| default | The text, in place of `label` |
| `avatar` | Before the text; an `NxAvatar` in it is 20px |
| `leading` | Before the text, when there is no `avatar` |
| `trailing` | After the text |

An e-mail runs no script: a chip has no dismiss button and no click. It is
inline; put several in an `NxTypography` to give them space below. Unlike
material-vue's, the avatar is not pulled into the chip's padding: Gmail drops
a negative margin.

## NxAvatar and NxAvatarGroup

material-vue's `Avatar`: a round picture, or initials on the `muted`
background when there is none.

```vue
<template>
  <NxAvatar :size="48"><NxAvatarImage src="https://acme.example/ada.png" alt="Ada" /></NxAvatar>
  <NxAvatarGroup :max="3" size="lg">
    <NxAvatar><NxAvatarImage src="https://acme.example/ada.png" alt="Ada" /></NxAvatar>
    <NxAvatar><NxAvatarFallback>GH</NxAvatarFallback></NxAvatar>
    <NxAvatar><NxAvatarFallback>AT</NxAvatarFallback></NxAvatar>
    <NxAvatar><NxAvatarFallback>KJ</NxAvatarFallback></NxAvatar>
  </NxAvatarGroup>
</template>
```

| Part | Props | Renders |
| --- | --- | --- |
| `NxAvatar` | `size?: number`: pixels; its group's, else `32` | A round, inline box of that size |
| `NxAvatarImage` | `src: string` (required), `alt?: string` (`''`, a decorative picture) | The `<img>`, with `width` and `height` set to the avatar's size |
| `NxAvatarFallback` | — | Its text (initials), `text-[12px]`, centred on `bg-muted` |
| `NxAvatarGroup` | `max?: number`, `size?: 'sm' \| 'md' \| 'lg'` (`'md'`) | Its avatars in a row, each ringed with the background, sized 24, 32 or 40px; past `max`, one more reading `+N`. Without `max`, or with one under 1, all of them |

Choose `NxAvatarImage` or `NxAvatarFallback`: an e-mail cannot fall back on a
picture that fails to load, so there is no switching between them. Give the
image an absolute URL, and a square picture. A group's avatars sit side by
side, 4px apart, rather than overlapping as in material-vue: Gmail drops the
negative margin that stacks them. Avatars from a `v-for` count one by one.

The `+N` is labelled for a screen reader with the shared message
`common.avatarGroup.more` (`2 more`, `2 autres`) when `@nxgt/mail-i18n` is
listed, and in English otherwise; see [Shared messages](messages.md).

Outlook on Windows ignores the width and height of an inline box: there,
`NxAvatarFallback`'s initials show on a grey strip rather than in a circle. An
`NxAvatarImage` keeps its size everywhere, from its `width` and `height`.

## NxProgress

material-vue's `Progress`, still: a bar filled to `modelValue` out of `max`,
on a rounded track at 20% of the primary colour.

```vue
<template>
  <NxTypography>2 of 3 steps done</NxTypography>
  <NxProgress :model-value="2" :max="3" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` | How much is done — material-vue's name, passed one way: an e-mail has no `v-model` |
| `max` | `number` | `100` | What `modelValue` is out of |
| `height` | `number` | `8` | The bar's height in pixels; an addition, where material-vue sets a class such as `h-1.5` |

The fill is `modelValue / max`, rounded to a whole percent and kept between 0 and
100. It is a table cell of that width, which every client draws: material-vue's
`transform` and pulse are not. The table carries `role="progressbar"` and the
`aria-value*` attributes.

The share is computed when the e-mail is built, so each prop is a number,
never a placeholder: one that is not
[fails the build](../troubleshooting.md#nxprogress-modelvalue-must-be-a-number-known-when-the-e-mail-is-built--a-placeholder-is-filled-only-when-it-is-sent).
A share that differs per recipient is written as text. The bar is left out of
the plain-text version, where it says nothing.

## NxSteps and NxStepsItem

material-vue's `Steps`: numbered circles one under the other, each with a
title and its text, joined by a line.

```vue
<template>
  <NxSteps>
    <NxStepsItem title="Create your account">Done on 1 September.</NxStepsItem>
    <NxStepsItem title="Invite your team">Add the people who work with you.</NxStepsItem>
    <NxStepsItem title="Connect your bank" />
  </NxSteps>
</template>
```

| Part | Props | Slots | Renders |
| --- | --- | --- | --- |
| `NxSteps` | — | default: `NxStepsItem`s | A table of its items, `mb-4`; numbers them 1, 2, 3… |
| `NxStepsItem` | `title?: string`, `index?: number` (its place in `NxSteps`), `last?: boolean` (set by `NxSteps`) | default (the text), `index` (in the circle, in place of the number) | A 32px circle, `border-primary-25`, the number in `text-primary`; the title `text-base` semibold; the text `text-sm` muted; a line down to the next item |

**Only `NxStepsItem`s go directly inside `NxSteps`, and an `NxStepsItem` only
inside `NxSteps`**, as a `v-for` or one by one: `NxSteps` numbers them and
tells each whether it is the `last`, which draws no line under it. An item is
table rows: alone, it is broken HTML with an empty circle.
An `index` you give wins over the item's place. The item's `class` goes on its
text's cell.

The line is the border of a cell in the same row as the text, so it runs as far
down as the text in every client; Outlook on Windows draws the circle square.

## NxTimeline

material-vue's `Timeline`: events one under the other, each a toned marker on
a line, its title, a time on the right, and a description.

```vue
<template>
  <NxTimeline
    :items="[
      { id: 'sign-in', title: 'Signed in', description: 'Firefox on Linux', timestampLabel: placeholder('time'), tone: 'success' },
      { id: 'password', title: 'Password changed', tone: 'warning' },
      { id: 'created', title: 'Account created' },
    ]"
    empty="No activity yet"
  />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `items` | `{ id: string; title: string; description?: string; timestampLabel?: string; tone?: TimelineTone }[]` | required | The events, in order; each `id` unique |
| `empty` | `string` | the shared message `common.timeline.empty` (`No activity yet`) | The text shown, centred and muted, when `items` is empty |

`TimelineTone` is `'default' | 'primary' | 'success' | 'info' | 'warning' | 'error'`:
the marker's border at 40% of the tone, its ground at 15%, and its dot in the
tone; `default` is `border`, `muted` and muted text.

An e-mail is built before it is sent, so there is no `timestamp` turned into
"2 hours ago" as in material-vue: that would be the time of the build. Write
the time as `timestampLabel`, most often a placeholder filled at send time.
There is no `loading` either: an e-mail does not load.

## A complete template

With `@nxgt/mail-i18n` and [`uiCatalogues`](messages.md), in two locales:

```json
// locales/en.json — locales/fr.json has the same keys
{
	"paymentFailed": {
		"subject": "Your payment did not go through",
		"title": "Your payment did not go through",
		"body": "We could not charge your card for the {plan} plan.",
		"action": "Update my card"
	}
}
```

```vue
<!-- emails/payment-failed.vue -->
<template>
  <NxLayout :preheader="t('paymentFailed.body', { plan: 'Pro' })">
    <NxTypography variant="headline-small">{{ t('paymentFailed.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxAlert variant="error" :description="t('paymentFailed.body', { plan: 'Pro' })" />
    <NxSummaryData :data="[{ label: 'Invoice', value: placeholder('invoiceNumber') }, { label: 'Amount', value: placeholder('amount') }]" />
    <NxButton :href="placeholder('link')" align="center">{{ t('paymentFailed.action') }}</NxButton>
    <Spacer height="16px" />
    <NxTypography variant="caption">{{ t('common.footer.ignore') }}</NxTypography>
  </NxLayout>
</template>
```

`maizzle build` writes `dist/en/payment-failed.html` and
`dist/fr/payment-failed.html`, each with `{{ name }}`, `{{ invoiceNumber }}`,
`{{ amount }}` and `{{ link }}` left for the code that sends.

## See also

- [The plugin](plugin.md) — replacing one of these components with your own.
- [The theme](theme.md) — the colours and radii these classes use.
- [Shared messages](messages.md) — `common.greeting` and the footer's text.
