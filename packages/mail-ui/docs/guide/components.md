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

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-ui@0.1.0/packages/mail-ui/previews/components-en.png" width="420" alt="An e-mail using the first Nx components: layout, typography, code, buttons, separator, card with badge, summary data and status, alert, banner, link">

The components from `NxLayout` to `NxCode`, in one e-mail
([its template](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/test/fixture/emails/welcome.vue)).

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-ui@0.1.0/packages/mail-ui/previews/data-components.png" width="420" alt="An e-mail using the data components: a table with a footer and caption, an empty table, descriptions, list tiles with an avatar and a chip, chips, an avatar group and an avatar">

The components from `NxTable` to `NxAvatar`
([their template](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/test/fixture/emails/gallery.vue)).

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-ui@0.1.0/packages/mail-ui/previews/sequence-components.png" width="420" alt="An e-mail using the sequence components: three progress bars, three numbered steps joined by a line, a timeline of three toned events, and an empty timeline's text">

`NxProgress`, `NxSteps` and `NxTimeline`
([their template](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/test/fixture/emails/sequence.vue)).

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-ui@0.1.0/packages/mail-ui/previews/summary-components.png" width="420" alt="An e-mail using the summary components: a hero with an eyebrow and a button, an entity header with an icon, a status badge and a link, three stat cards with toned deltas, a goal card, a ratio card, a compare card, a breakdown card with three bars, and a see-also list of two links">

The components from `NxHero` to `NxSeeAlso`
([their template](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/test/fixture/emails/summary.vue)).

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-ui@0.2.0/packages/mail-ui/previews/content-components.png" width="420" alt="An e-mail using the layout and content components: an extended label with a count badge, highlighted text, keys, three action cards, a figure with its caption, a button group with icon buttons, an icon button and two link buttons">

The components from `NxSpacer` to `NxButtonGroup`
([their template](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/test/fixture/emails/content.vue)).

<img src="https://raw.githubusercontent.com/softistx/nxgt-mail/refs/tags/@nxgt/mail-ui@0.2.0/packages/mail-ui/previews/details-components.png" width="420" alt="An e-mail using the details components: event chips, a list of attributes, postal addresses, opening hours, contacts, a file list with a download link and empty ones, a rating of four stars and a row of five review stars">

The components from `NxEventChip` to `NxRating`
([their template](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/test/fixture/emails/details.vue)).

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
  `NxDescription`, `NxAvatarGroup`, `NxProgress`, `NxSteps`, `NxTimeline`,
  `NxHero`, `NxEntityHeader`, the metric cards (`NxStatCard` to
  `NxBreakdownCard`), `NxSeeAlso`, `NxActionCard`, `NxFigure`,
  `NxButtonGroup`, `NxAttributes`, `NxPostalAddress`, `NxOpeningHours`,
  `NxContacts`, `NxFileList` and `NxRating` carry `mb-4`, `NxListTile` and
  `NxEventChip` `mb-2`, `NxExtendedLabel` `mb-1.5`. On `NxTypography`,
  `NxSummaryData`, `NxTable`, `NxDescription`, `NxAvatarGroup`,
  `NxProgress`, `NxSteps`, `NxTimeline`, `NxSeeAlso`, `NxFigure`,
  `NxExtendedLabel`, `NxEventChip` and the components from `NxAttributes` to
  `NxRating`, `class="mb-0"` removes it (the last tile of a list keeps its
  own `mb-2`). `NxAlert`, `NxBanner`, `NxCard`, `NxCode`, `NxListTile`,
  `NxHero`, `NxEntityHeader`, the metric cards, `NxActionCard` and
  `NxButtonGroup` put their `class` on the box inside, and keep their 16px
  below: to change it, replace the component with your own
  (see [Replacing a component](plugin.md#replacing-a-component)).
- **Vertical space is `NxSpacer`**, on Maizzle's `<Spacer>`, which Outlook
  respects:

  ```vue
  <NxSpacer size="lg" />
  ```

- **Icons are slots.** An e-mail has no icon font: pass an `<img>` with an
  absolute URL, or a character, where a component has an `icon` slot —
  or to `NxIconButton`'s `icon` prop.
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
| [`NxHero`](#nxhero) | `Hero` | `title` (required), `eyebrow`, `description` | default, `actions` |
| [`NxEntityHeader`](#nxentityheader) | `EntityHeader` | `title` (required), `metadata` (`[]`) | default, `icon`, `status`, `actions` |
| [`NxStatCard`](#nxstatcard) | `StatCard` | `label` (required), `value`, `hint`, `delta`, `deltaTone` (by the delta's sign) | `icon` |
| [`NxGoalCard`](#nxgoalcard) | `GoalCard` | `label`, `value`, `target` (required), `unit` | — |
| [`NxRatioCard`](#nxratiocard) | `RatioCard` | `label`, `left`, `right`, `percent` (required) | — |
| [`NxCompareCard`](#nxcomparecard) | `CompareCard` | `label`, `current`, `previous` (required), `delta` | — |
| [`NxBreakdownCard`](#nxbreakdowncard) | `BreakdownCard` | `label`, `items` (required) | — |
| [`NxSeeAlso`](#nxseealso) | `SeeAlso` | `items` (required), `label` (a shared message) | — |
| [`NxSpacer`](#nxspacer) | — (e-mail's own) | `size` (`'md'`) | — |
| [`NxExtendedLabel`](#nxextendedlabel) | `ExtendedLabel` | `variant` (`'title-medium'`), `indicatorClass` | default, `trailing` |
| [`NxHighlightText`](#nxhighlighttext) | `HighlightText` | `text` (required), `query` (`''`) | — |
| [`NxKbd`](#nxkbd) | `Kbd` | — | default |
| [`NxCountBadge`](#nxcountbadge) | `CountBadge` | `count` (required), `max` (`99`), `variant` (`'error'`) | default |
| [`NxActionCard`](#nxactioncard) | `ActionCard` | `title`, `description`, `active` (`false`), `variant` (`'sm'`), `withIndicator` (`true`), `href` | `icon` |
| [`NxFigure`](#nxfigure) | `Figure` | `src`, `alt`, `caption` | default |
| [`NxLinkButton`](#nxlinkbutton) | `LinkButton` | `to` (required), `variant` (`'link'`), `color`, `size`, `align` | default |
| [`NxIconButton`](#nxiconbutton) | `IconButton` | `href` (required), `icon`, `variant` (`'filled'`), `color` (`'primary'`), `tooltip` | default |
| [`NxButtonGroup`](#nxbuttongroup) | `ButtonGroup` | — | default: buttons |
| [`NxEventChip`](#nxeventchip) | `EventChip` | `title` (required), `time`, `color` (`'primary'`), `allDay`, `compact`, `selected`, `continuesBefore`, `continuesAfter` (`false`) | — |
| [`NxAttributes`](#nxattributes) | `AttributesList`, read | `data` (`[]`), `values` (`{}`), `label` (a shared message) | `label` |
| [`NxPostalAddress`](#nxpostaladdress) | `PostalAddress` | `data`, `label` (a shared message) | `label` |
| [`NxOpeningHours`](#nxopeninghours) | `OpeningHours` | `data` (`[]`), `label` (a shared message) | `label` |
| [`NxContacts`](#nxcontacts) | `Contacts` | `data` (`[]`), `label` (a shared message) | `label` |
| [`NxFileList`](#nxfilelist) | `FileList` | `items` (required), `empty` (a shared message) | `empty` |
| [`NxRating`](#nxrating) | `RatingField`, read only | `modelValue` (`0`), `max` (`5`), `color` (`'warning'`), `label`, `helperText`, `href` | — |

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
padding for each size is set for you. In an
[`NxButtonGroup`](#nxbuttongroup), a button is `rounded` and, unless it says
its `variant`, `tonal` — `filled` when marked `data-state="active"`.

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
| `height` | `number` | `8` | The bar's height in pixels, above 0; an addition, where material-vue sets a class such as `h-1.5` |

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
  />
  <NxTimeline :items="[]" empty="Nothing this week" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `items` | `{ id: string; title: string; description?: string; timestampLabel?: string; tone?: TimelineTone }[]` | required | The events, in order; each `id` unique |
| `empty` | `string` | the shared message `common.timeline.empty` (`No activity yet`); without `@nxgt/mail-i18n`, `No activity yet` in every language | The text shown, centred and muted, when `items` is empty |

`TimelineTone` is `'default' | 'primary' | 'success' | 'info' | 'warning' | 'error'`:
the marker's border at 40% of the tone, its ground at 15%, and its dot in the
tone; `default` is `border`, `muted` and muted text.

An e-mail is built before it is sent, so there is no `timestamp` turned into
"2 hours ago" as in material-vue: that would be the time of the build. Write
the time as `timestampLabel`, most often a placeholder filled at send time.
There is no `loading` either: an e-mail does not load.

## NxHero

material-vue's `Hero`: an eyebrow, a large title, a description and actions,
in a rounded, bordered box. Its gradient and blurred shapes are a plain ground
at 5% of the primary colour: a mail client draws neither reliably.

```vue
<template>
  <NxHero eyebrow="September" title="Your month at Acme" description="What your team did, and what is next.">
    <template #actions><NxButton href="https://acme.example/report">Open the report</NxButton></template>
  </NxHero>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `title` | `string` | required | `<h1>`, `text-3xl` semibold |
| `eyebrow` | `string` | none | Above the title: `text-xs`, semibold, uppercase, in `text-primary` |
| `description` | `string` | none | Under the title, `text-base` muted |

| Slot | Effect |
| --- | --- |
| `actions` | Under the description, `mt-6`: an `NxButton` or two |
| default | Under the actions, `mt-8` |

The box is `rounded-2xl`, a `border` line, `px-8 py-10`; its `class` goes on
it.

## NxEntityHeader

material-vue's `EntityHeader`: what an e-mail is about — an icon, a title with
its status, its details on one line, and actions on the right. Its shadow is a
border here.

```vue
<template>
  <NxEntityHeader title="Acme Labs" :metadata="[{ label: 'Plan', value: 'Pro' }, { label: 'Seats', value: 12 }]">
    <template #icon>&#127970;</template>
    <template #status><NxBadge variant="success">Active</NxBadge></template>
    <template #actions><NxLink href="https://acme.example/settings">Settings</NxLink></template>
  </NxEntityHeader>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `title` | `string` | required | `<h2>`, `text-lg` semibold |
| `metadata` | `{ label: string; value?: string \| number \| null }[]` | `[]` | Under the title, as an `inline` [`NxSummaryData`](#nxsummarydata): `Plan: Pro  Seats: 12`. A row without a value is left out, as there |

| Slot | Effect |
| --- | --- |
| `icon` | A column on the left, `text-3xl`: a character or an `<img>` |
| `status` | After the title, on its line: an `NxBadge` or an `NxStatusIndicator` |
| `actions` | A column on the right, aligned to the middle |
| default | Under the title and its details |

The box is `rounded`, a `border` line, `bg-background`, `p-4`; its `class`
goes on it.

## The metric cards

`NxStatCard`, `NxGoalCard`, `NxRatioCard`, `NxCompareCard` and
`NxBreakdownCard` are material-vue's metric cards: each is an
[`NxCard`](#nxcard-and-its-parts) with a `label` at its top, one under the
other, full width. Their `class` goes on the card's box.

They have no `loading` state: an e-mail does not load. The figures they
**write** — a `value`, a `delta` — may be placeholders; the numbers they
**draw** as an [`NxProgress`](#nxprogress) — `NxGoalCard`'s `value` and
`target`, `NxRatioCard`'s `percent`, each `percent` of `NxBreakdownCard` —
are known when the e-mail is built: a placeholder there
[fails the build](../troubleshooting.md#nxprogress-modelvalue-must-be-a-number-known-when-the-e-mail-is-built--a-placeholder-is-filled-only-when-it-is-sent).

### A delta and its arrow

`NxStatCard` and `NxCompareCard` write a `delta` as material-vue's
`formatStatDelta` does, with an arrow before it that follows its tone, as
material-vue's `TrendingUp`, `TrendingDown` and `Minus` icons do — a
character here, since an e-mail has no icon font:

| `delta` | Written | Tone (without `deltaTone`) |
| --- | --- | --- |
| `12` | `▲ +12` | `up`: `text-success` |
| `-3` | `▼ -3` | `down`: `text-error` |
| `0` | `– 0` | `neutral`: muted |
| `'flat'`, any string | `– flat`, as given | `neutral`: muted |

The arrow is `aria-hidden`, and left out of the plain-text version: there,
`▲ +12` reads `+12`.

## NxStatCard

material-vue's `StatCard`: a label, a figure, and under it a delta and a hint.

```vue
<template>
  <NxStatCard label="Revenue" value="$12,400" :delta="12" hint="vs last month" />
  <NxStatCard label="Refunds" value="3" :delta="-2" delta-tone="up" />
  <NxStatCard label="Churn" value="0.4%" delta="flat" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `label` | `string` | required | The first line, `text-sm` muted |
| `value` | `string \| number` | none | The figure, `text-2xl` semibold. A placeholder is fine |
| `delta` | `number \| string` | none | Under the figure, toned, with its arrow — see [A delta and its arrow](#a-delta-and-its-arrow). `''` writes none |
| `deltaTone` | `'up' \| 'down' \| 'neutral'` | by the sign; `neutral` for a string | Overrides the tone, and so the arrow and colour |
| `hint` | `string` | none | After the delta, `text-xs` muted |

| Slot | Effect |
| --- | --- |
| `icon` | On the right of the label, muted: a character or an `<img>` |

`deltaTone` is for a figure whose fall is good: above, `Refunds` is `▲ -2` in
`text-success`. A delta known only when the e-mail is sent is a string —
`:delta="placeholder('delta')"` — and neutral, unless `delta-tone` says
otherwise: no component branches on a placeholder.

## NxGoalCard

material-vue's `GoalCard`: a figure against its target, `of {target}`, and a
thin bar of the share reached.

```vue
<template>
  <NxGoalCard label="Signed contracts" :value="18" :target="24" />
  <NxGoalCard label="Storage used" :value="42" :target="100" unit=" GB" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `label` | `string` | required | The first line, `text-sm` muted |
| `value` | `number` | required | The figure, `text-2xl` semibold, and the bar's `modelValue` |
| `target` | `number` | required | Written after the figure, and the bar's `max` |
| `unit` | `string` | none | Written right after `value`, with no space: `unit="%"` gives `18%`. Not after the target |

`of 24` is the shared message `common.metrics.ofTarget` (`of {target}`,
`sur {target}`) when `@nxgt/mail-i18n` is listed, and English otherwise; see
[Shared messages](messages.md). The bar is an `NxProgress` of `height` 6: a
`value` past its `target` fills it, and both are numbers known at build time.

## NxRatioCard

material-vue's `RatioCard`: two figures side by side, and a bar of the left
one's share, on a track at 15% of the primary colour.

```vue
<template>
  <NxRatioCard label="Plans" :left="{ label: 'Pro', value: '72%' }" :right="{ label: 'Free', value: '28%' }" :percent="72" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `label` | `string` | required | The first line, `text-sm` muted |
| `left` | `{ label: string; value: string }` | required | On the left: its label small and uppercase, its value `text-lg` semibold |
| `right` | `{ label: string; value: string }` | required | On the right, the same, its value muted |
| `percent` | `number` | required | The bar's fill, out of 100: the left one's share |

The values are written as given, and `percent` is not computed from them:
pass both. `percent` is a number known at build time; the values may be
placeholders.

## NxCompareCard

material-vue's `CompareCard`: this period's figure beside the last one's, in
two boxes, and the delta between them.

```vue
<template>
  <NxCompareCard label="Sign-ups" :current="{ value: '340' }" :previous="{ value: '298' }" :delta="42" />
  <NxCompareCard label="Orders" :current="{ value: '51', label: 'October' }" :previous="{ value: '63', label: 'September' }" :delta="-12" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `label` | `string` | required | The first line, `text-sm` muted |
| `current` | `{ value: string; label?: string }` | required | The left box, `text-2xl` semibold. `label` defaults to the shared message `common.metrics.thisPeriod` (`This period`) |
| `previous` | `{ value: string; label?: string }` | required | The right box, muted. `label` defaults to `common.metrics.lastPeriod` (`Last period`) |
| `delta` | `number` | none | On the right of the label, toned by its sign, with its arrow — see [A delta and its arrow](#a-delta-and-its-arrow) |

Without `@nxgt/mail-i18n`, the two default labels are in English. The delta's
tone is its sign's: there is no `deltaTone` here.

## NxBreakdownCard

material-vue's `BreakdownCard`: the parts of a whole, each a label, its value,
and a thin bar of its share.

```vue
<template>
  <NxBreakdownCard
    label="Traffic"
    :items="[
      { label: 'Search', percent: 54.4 },
      { label: 'Direct', value: '1,204', percent: 30 },
      { label: 'Social', percent: 15.6 },
    ]"
  />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `label` | `string` | required | The first line, `text-sm` muted |
| `items` | `{ label: string; value?: string; percent: number }[]` | required | The parts, in order; each `label` unique |

Each part writes its `value`, or its share rounded to a whole percent when it
has none: above, `54%`, `1,204` and `16%`. Its bar is an `NxProgress` of
`height` 6 filled to `percent`, a number known at build time.

## NxSeeAlso

material-vue's `SeeAlso`: a line, a small uppercase label, and links one per
row, each with the `↗` material-vue gives an external link — every link of an
e-mail opens a browser.

```vue
<template>
  <NxSeeAlso
    :items="[
      { title: 'Billing', href: 'https://acme.example/billing' },
      { id: 'team', title: 'Your team', href: 'https://acme.example/team' },
    ]"
  />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `items` | `{ id?: string; title: string; href: string }[]` | required | The links, in order; each `id`, or else each `href`, unique |
| `label` | `string` | the shared message `common.seeAlso` (`See also`); without `@nxgt/mail-i18n`, `See also` in every language | The label over the links |

With no `items`, it writes nothing: no line, no label. The `↗` is
`aria-hidden` and left out of the plain-text version. Its `class` is merged
on the block, `mt-10 pt-8 mb-4` with a line above.

## NxSpacer

Vertical space in the theme's steps, on Maizzle's `<Spacer>`, which gives it
a line height as tall as the space so that Outlook keeps it. material-vue has
no spacer: this is the e-mail's own.

```vue
<template>
  <NxTypography>Your code expires in 15 minutes.</NxTypography>
  <NxSpacer />
  <NxSpacer size="xl" />
  <NxSpacer class="h-5" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 8, 16, 24, 32 or 48 pixels |

A height class you pass (`h-5`) wins over `size`. Maizzle's
`<Spacer height="24px" />`, or its horizontal spacer
(`<Spacer type="horizontal" />`), stays available beside it.

## NxExtendedLabel

material-vue's `ExtendedLabel`: a title in a `NxTypography` variant, a short
bar in the primary colour under it, and a `trailing` slot on the right, at
the bottom — a section's heading.

```vue
<template>
  <NxExtendedLabel>
    Your inbox
    <template #trailing><NxLink href="https://acme.example/inbox">See all</NxLink></template>
  </NxExtendedLabel>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `variant` | a `NxTypography` variant | `'title-medium'` | The title's size, and its tag (`h3` for `title-medium`) |
| `indicatorClass` | `string` | none | Merged on the bar, `w-14 rounded bg-primary`: `bg-success`, `w-24` |

| Slot | Content |
| --- | --- |
| default | The title |
| `trailing` | Beside it, on the right: a link, a count |

The bar is 56 by 4 pixels, drawn by a table cell as `NxProgress`'s, and left
out of the plain-text version; material-vue's growing animation is not. Its
`class` is merged on the block, `mt-2 mb-1.5 w-full`.

## NxHighlightText

material-vue's `HighlightText`: `text` with each match of `query`, whatever
its case, marked on 20% of the primary colour — a search's results.

```vue
<template>
  <NxTypography>
    <NxHighlightText :text="t('digest.result', { name: placeholder('name') })" query="invoice" />
  </NxTypography>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `text` | `string` | required | The text, written as is |
| `query` | `string` | `''` | What to mark; empty marks nothing |

The matches are found when the e-mail is built, and marked with `<mark>`. A
placeholder in `text` (`{{ name }}`) is written whole and never marked, so
the renderer still fills it. A `query` holding a placeholder fails the build:
[`NxHighlightText: query must be text known when the e-mail is built`](../troubleshooting.md#nxhighlighttext-query-must-be-text-known-when-the-e-mail-is-built--a-placeholder-is-filled-only-when-it-is-sent).
The plain-text version has the text, unmarked.

## NxKbd

material-vue's `Kbd`: a key, in monospace, small, on the muted background
with a border.

```vue
<template>
  <NxTypography>Press <NxKbd>Ctrl</NxKbd> + <NxKbd>K</NxKbd> to search.</NxTypography>
</template>
```

No props. The default slot is the key. material-vue's `KbdShortcut` is not
mirrored: see the [roadmap](../roadmap.md#not-planned).

## NxCountBadge

material-vue's `CountBadge`: what it counts, then a small `NxBadge` with the
count — `99+` past `max`, nothing at 0.

```vue
<template>
  <NxCountBadge :count="3"><NxLink href="https://acme.example/inbox">Unread</NxLink></NxCountBadge>
  <NxCountBadge :count="120" variant="info">Mentions</NxCountBadge>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `count` | `number` | required | The count, rounded; at 0 or less, no badge |
| `max` | `number` | `99` | Past it, the badge reads `99+` |
| `variant` | an `NxBadge` variant | `'error'` | The badge's colours |

The badge follows the content on its line, 4 pixels after it: a mail client
does not place it over a corner as material-vue does. A screen reader hears
the shared message `common.countBadge.label` (`3 notifications`, `1 notification`; without
`@nxgt/mail-i18n`, in English), and the plain-text version writes the count
in brackets: `Unread (3)`.

The count is written at build time: a placeholder
(`:count="placeholder('unread')"`) fails the build with
[`NxCountBadge: count must be a number known when the e-mail is built`](../troubleshooting.md#nxcountbadge-count-must-be-a-number-known-when-the-e-mail-is-built--a-placeholder-is-filled-only-when-it-is-sent).
A count known only at send time is text: write it with an `NxBadge`.

## NxActionCard

material-vue's `ActionCard`, still: an `icon` in a box, a title, a
description and a round indicator, ticked and in the primary colour when
`active` — the option a reader chose, or one to choose.

```vue
<template>
  <NxActionCard title="Weekly digest" description="One e-mail each Monday." active href="https://acme.example/digest">
    <template #icon>&#128240;</template>
  </NxActionCard>
  <NxActionCard variant="md" title="Mobile" description="Push to your phone." :with-indicator="false" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `title` | `string` | none | The title, an `NxCardTitle` |
| `description` | `string` | none | Under it, an `NxCardDescription` |
| `active` | `boolean` | `false` | A border at 50% of the primary; the icon's box and the indicator in the primary colour, the indicator ticked `✓` |
| `variant` | `'sm' \| 'md'` | `'sm'` | `sm`: icon, text and indicator on one row. `md`: icon and indicator above the text |
| `withIndicator` | `boolean` | `true` | Shows the round indicator |
| `href` | `string` | none | The e-mail's own: makes the title a link |

| Slot | Content |
| --- | --- |
| `icon` | A character or an `<img>` by absolute URL, in a bordered box |

An e-mail runs no script: the card is not selected by a click, and its hover
and focus rings are not drawn. The indicator is `aria-hidden` and left out of
the plain-text version. Its `class` is merged on the card's box.

## NxFigure

material-vue's `Figure`: an image in a rounded frame with a border, and its
caption centred under it.

```vue
<template>
  <NxFigure src="https://acme.example/chart.png" alt="Messages per day" caption="Your messages this week" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `src` | `string` | none | The image, by absolute URL. A placeholder is fine |
| `alt` | `string` | `''` | Its text for a reader |
| `caption` | `string` | none | Under it, `text-sm` muted, centred; also in the plain-text version |

| Slot | Content |
| --- | --- |
| default | Any content in the image's place, as in material-vue; without it, the image of `src` |

The image is Maizzle's `<Img>`, which sets its `width` to the width of the
card for Outlook. The frame's corners and border are the image's own: a mail
client does not clip an image to a rounded box. Its `class` is merged on the
block, `mb-4 w-full`.

## NxLinkButton

material-vue's `LinkButton`: an `NxButton` to `to`, drawn as a link unless its
`variant` says otherwise.

```vue
<template>
  <NxLinkButton to="https://acme.example/preferences">Manage your preferences</NxLinkButton>
  <NxLinkButton to="https://acme.example/unsubscribe" variant="outlined" color="error" size="sm">Unsubscribe</NxLinkButton>
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `to` | `string` | required | The URL it opens. A placeholder is fine |
| `variant` | as `NxButton`'s | `'link'` | |
| `color`, `size`, `align` | as `NxButton`'s | as `NxButton`'s | |

An e-mail has no router: `to` is a URL, and material-vue's `replace` and
`target` have nothing to do.

## NxIconButton

material-vue's `IconButton`, as a link: one icon in a round `NxButton`, 36
pixels across.

```vue
<template>
  <NxIconButton href="https://acme.example/help" icon="?" tooltip="Help" />
  <NxIconButton href="https://acme.example/settings" icon="https://acme.example/gear.png" aria-label="Settings" variant="outlined" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `href` | `string` | required | Where it goes. A placeholder is fine |
| `icon` | `string` | none | An image by absolute `http(s)` URL, drawn at 16 pixels, or a character such as `★` |
| `variant`, `color` | as `NxButton`'s | `'filled'`, `'primary'` | |
| `tooltip` | `string` | none | Its `title`, and its name for a reader without an `aria-label` |

| Slot | Content |
| --- | --- |
| default | Any content in the icon's place |

An e-mail has no icon font: an icon is never a font's name. Give every icon
button a name — `aria-label` or `tooltip`: a reader hears it, the image takes
it as its `alt`, and the plain-text version writes it before the link (the
character, without one). The `icon` is read when the e-mail is built: one
starting `http://` or `https://` is an image, anything else is written as
text. A placeholder in `icon` fails the build with
[`NxIconButton: icon must be known when the e-mail is built`](../troubleshooting.md#nxiconbutton-icon-must-be-known-when-the-e-mail-is-built--a-placeholder-is-filled-only-when-it-is-sent):
for an image known only when the e-mail is sent, put an `<img>` in the
default slot, `<img :src="placeholder('iconUrl')" width="16" height="16" alt="">`. Outlook on Windows pads it as Maizzle pads any button, so there it may
be wider than round. material-vue's `IconLinkButton` is this component: it already
takes a URL.

## NxButtonGroup

material-vue's `ButtonGroup`: its buttons side by side, 4 pixels apart, on
the background with 8 pixels around.

```vue
<template>
  <NxButtonGroup>
    <NxButton href="https://acme.example/inbox" data-state="active">Inbox</NxButton>
    <NxButton href="https://acme.example/archive">Archive</NxButton>
    <NxIconButton href="https://acme.example/starred" icon="&#9733;" tooltip="Starred" />
  </NxButtonGroup>
</template>
```

No props. The default slot holds `NxButton`s, `NxLinkButton`s and
`NxIconButton`s, a `v-for` included; each is a cell of one row, which every
client keeps on a line. As in material-vue, the buttons inside are `rounded`
rather than pills and `tonal`, and the one marked `data-state="active"` is
`filled`; a button that says its `variant` keeps it. Unlike material-vue's,
which paints every button of a group in the primary colour, each keeps its
own `color`. Its `class` is merged
on the group's box, `bg-background p-2`, and it keeps 16 pixels below.

## NxEventChip

material-vue's `EventChip`, static: an event's time over its title, on a
ground of its colour with a bar of the colour on the left — the date and
time of an invitation.

```vue
<template>
  <NxEventChip title="Onboarding call" :time="placeholder('time')" />
  <NxEventChip title="Team offsite" color="#0f766e" all-day compact continues-after />
  <NxEventChip title="Review" color="success" time="14:00" selected />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `title` | `string` | required | `text-xs` medium (`text-[10px]` and muted when `compact`, material-vue's `caption`) |
| `time` | `string` | none | Over the title, in `text-[10px]`, as written: a placeholder, or a time you format |
| `color` | ``Color \| `#${string}` `` | `'primary'` | A colour of the theme (`'primary'`, `'secondary'`, `'info'`, `'success'`, `'warning'`, `'error'`, `'default'`), or a hex colour (`'#0f766e'`) |
| `allDay` | `boolean` | `false` | Leaves the time out |
| `compact` | `boolean` | `false` | Less padding, a smaller title |
| `selected` | `boolean` | `false` | A 1px border in the primary colour |
| `continuesBefore`, `continuesAfter` | `boolean` | `false` | Squares the left or right corners, for an event that runs on from another day |

material-vue mixes the colour at 18% over nothing, which a mail client would
not draw: here the ground is a plain colour, mixed when the e-mail is built.
A colour of the theme takes its 20% tint (`bg-primary-20`) and follows the
theme; a hex colour is mixed at 18% over white. Any other colour — a name,
a `var()`, a placeholder — fails the build:
`NxEventChip: color must be a colour of the theme, as success, or a hex colour, as #0f766e — the build mixes its tint`.
There is no click and no `disabled`: an e-mail runs no script.

## NxAttributes

material-vue's `AttributesList`, read: its label over one tile per
attribute, the attribute's `label` as the title and its value under it, with
its `unit`.

```vue
<template>
  <NxAttributes
    :data="[
      { name: 'room', label: 'Room', type: 'STRING' },
      { name: 'area', label: 'Area', type: 'NUMBER', unit: 'm²' },
      { name: 'equipment', label: 'Equipment', type: 'MULTI_SELECT' },
      { name: 'floor', label: 'Floor', type: 'STRING', defaultValue: 'Ground' },
    ]"
    :values="{ room: placeholder('room'), area: 42, equipment: ['Screen', 'Whiteboard'] }"
  />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `data` | `Attribute[]`: `{ name: string; label: string; unit?: string \| null; defaultValue?: AttributeValue; type?; description?; options?; priority? }` | `[]` | The attributes, in order — material-vue's `Attribute`, of which `name`, `label`, `unit` and `defaultValue` are read |
| `values` | `Record<string, AttributeValue>` | `{}` | The values, by attribute `name` |
| `label` | `string` | the shared message `common.attributes` (`Attributes`) | The heading |

material-vue's list describes attributes to edit, with their type under the
label; an e-mail tells the reader what they hold, so it shows the value, from
the `values` it adds. `AttributeValue` is
`string | number | (string | number)[] | null`. A value is written as given,
from `values` or else — when `values` has no entry for the `name`, or `null`
— from the attribute's `defaultValue`; a list is joined with commas. Nothing
is parsed or formatted when the e-mail is built — format a date or a number
yourself, or pass a placeholder. An attribute without a value (`undefined`,
`null`, `''`, `[]`) is left out — a `''` or `[]` in `values` without its
`defaultValue` — and `0` stays. With none left, nothing is written, heading
included: an e-mail has no "Add" button for an empty list. The `label`
slot replaces the heading's text.

The heading of `NxAttributes`, `NxPostalAddress`, `NxOpeningHours` and
`NxContacts` is an [`NxExtendedLabel`](#nxextendedlabel), as in
material-vue: a title in `title-medium`, and a 56 × 4px bar in the primary
colour under it, left out of the plain-text version.

## NxPostalAddress

material-vue's `PostalAddress`, read: its label over one tile, the street as
the title and `postalCode locality · country` under it.

```vue
<template>
  <NxPostalAddress :data="{ street: '12 rue de la Paix', postalCode: '75002', locality: 'Paris', country: 'FR' }" />
  <NxPostalAddress label="Warehouse" :data="{ locality: 'Potsdam', region: 'Brandenburg', country: 'DE' }" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `data` | `{ street?; locality?; region?; postalCode?; country? }`, each `string \| null` | none | The address |
| `label` | `string` | the shared message `common.postalAddress` (`Address`) | The heading |

The layout is material-vue's, the same in every locale: without a street, the
city — else the country, else the region — is the title and
`region · country` is under it, without the part that is already the title — where
material-vue takes the heading as the title and repeats the part. A
two-letter `country` code is named in the template's locale by
`Intl.DisplayNames` — `DE` is `Germany` in English, `Allemagne` in French —
where material-vue writes an English name; anything else, a placeholder
included, is written as given. An address with no field (or `null`) writes
nothing.

## NxOpeningHours

material-vue's `OpeningHours`, read: its label over one tile per day, the
day as the title and its hours under it.

```vue
<template>
  <NxOpeningHours
    :data="[
      { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 2, openTime: '09:00' },
      { dayOfWeek: 6, isClosed: true },
    ]"
  />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `data` | `{ dayOfWeek: number; openTime?: string; closeTime?: string; isClosed?: boolean }[]` | `[]` | The days, sorted from Sunday (`0`) to Saturday (`6`) |
| `label` | `string` | the shared message `common.openingHours.label` (`Opening hours`) | The heading |

The day's name is a shared message (`common.openingHours.days.monday`, …),
the hours `09:00 – 18:00` as written, `—` for a time not given, and a closed
day `common.openingHours.closed` (`Closed all day`). With no day, nothing is
written. A `dayOfWeek` outside `0`–`6` names no day and fails the build:
`NxOpeningHours: dayOfWeek must be a whole number from 0 (Sunday) to 6 (Saturday)`.

## NxContacts

material-vue's `Contacts`, read: its label over one tile per contact, its
`label` — else the words for its type — as the title, and its value under
it.

```vue
<template>
  <NxContacts
    :data="[
      { type: 'EMAIL', value: 'hello@acme.example' },
      { type: 'PHONE', value: '+33 1 23 45 67 89', label: 'Front desk' },
      { type: 'WEBSITE', value: 'https://acme.example' },
    ]"
  />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `data` | `{ type: ContactType; value: string; label?: string \| null }[]` | `[]` | The contacts, in order |
| `label` | `string` | the shared message `common.contacts.label` (`Contacts`) | The heading |

`ContactType` is material-vue's:
`'EMAIL' | 'FAX' | 'MOBILE' | 'PHONE' | 'WEBSITE'`, its words the shared messages `common.contacts.types.email`, …
The title links to the contact where a mail client can follow it: `mailto:`
an e-mail address, `tel:` a phone or mobile number, and a website to its
value, which must then be an absolute `http(s)` URL — a placeholder there is
checked at send time as any URL. A placeholder after `mailto:` or `tel:` is
filled with the bare address or number, HTML-escaped; the scheme stays. A
literal number keeps its spaces in `tel:`, which phones accept. A fax is not
linked. Another `type` fails the build:
`NxContacts: type must be EMAIL, FAX, MOBILE, PHONE or WEBSITE`. With no contact, nothing is written.

## NxFileList

material-vue's `FileList`: one tile per file, its name as the title and its
size under it, with a `Download` link for a file with an `href` — an
attachment's page, or a download.

```vue
<template>
  <NxFileList
    :items="[
      { id: 'agenda', name: 'agenda.pdf', size: 1572864, href: 'https://acme.example/files/agenda.pdf', type: 'application/pdf' },
      { id: 'badge', name: 'badge.pkpass', size: placeholder('badgeSize'), href: placeholder('badgeLink') },
    ]"
  />
  <NxFileList :items="[]" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `items` | `{ id: string; name: string; size?: number \| string; href?: string; type?: string; disabled?: boolean }[]` | required | The files, in order; each `id` unique |
| `empty` | `string` | the shared message `common.fileList.empty` (`No files`) | The text shown, centred and muted, when `items` is empty; the `empty` slot replaces it |

A size in bytes is written as material-vue's `formatFileSize` does, in the
template's locale: `1.5 MB`, `1,5 Mo` (`common.fileList.size`). A string — a
placeholder — is written as given. Where material-vue draws an icon for the
type, the tile shows the extension on a tonal circle, from the name
(`agenda.pdf` is `PDF`), else from the MIME `type` (`image/png` is `PNG`),
four letters at most, and left out of the plain-text version. A `disabled`
file's name is muted and it has no link. There is no remove button and no
loading state: an e-mail runs no script and does not load.

## NxRating

material-vue's `RatingField`, read only: `max` stars, the first
`modelValue` in its `color` and the others muted — or, with `href`, a row of
links for a review request, one per star.

```vue
<template>
  <NxRating :model-value="4" label="Your last visit" />
  <NxRating label="How was it?" :href="(star) => `https://acme.example/review?rating=${star}`" />
</template>
```

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` | The stars filled, rounded and kept between 0 and `max` |
| `max` | `number` | `5` | The stars drawn, at least 1 |
| `color` | `Color` | `'warning'` | The filled stars' colour |
| `label` | `string` | none | Over the stars, `text-sm` medium |
| `helperText` | `string` | none | Under the stars, muted |
| `href` | `(star: number) => string` | none | Makes each star a link to `href(star)` |

A star is the character `★` at 20px — an e-mail has no icon font — and a
muted one is in the foreground at 25%, where material-vue draws a duotone
icon, lighter than its muted text. The row
reads `4 of 5` to a screen reader (`common.rating.star`), and says it in the
plain-text version, where each linked star is `2 of 5` followed by its link.
The stars are drawn when the e-mail is built: a `modelValue` or `max` that is
not a number — a placeholder — fails the build, as `NxProgress`'s does. For
a rating known only at send time, write it in text.

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
    <NxSpacer size="sm" />
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
- [Shared messages](messages.md) — `common.greeting`, the footer's text, and
  the words the components write themselves.
