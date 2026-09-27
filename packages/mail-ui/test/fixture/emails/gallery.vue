<template>
  <NxLayout preheader="Your invoice and your team">
    <NxTypography variant="headline-small">Invoice</NxTypography>
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
          <NxTableCell class="text-right">$20.00</NxTableCell>
        </NxTableRow>
        <NxTableRow>
          <NxTableCell>Extra seats</NxTableCell>
          <NxTableCell class="text-right">$10.00</NxTableCell>
        </NxTableRow>
      </NxTableBody>
      <NxTableFooter>
        <NxTableRow>
          <NxTableCell>Total</NxTableCell>
          <NxTableCell class="text-right">$30.00</NxTableCell>
        </NxTableRow>
      </NxTableFooter>
    </NxTable>
    <NxTable>
      <NxTableBody><NxTableEmpty :colspan="2">No refunds</NxTableEmpty></NxTableBody>
    </NxTable>
    <NxDescription label="Billing period" value="September 2026" />
    <NxDescription label="Credits left" :value="0" />
    <NxDescription label="Coupon" value="" />
    <NxListTile title="Ada Lovelace" subtitle="Owner" href="https://acme.example/team/ada" selected>
      <template #leading><NxAvatar><NxAvatarFallback>AL</NxAvatarFallback></NxAvatar></template>
      <template #trailing><NxChip variant="tonal" color="success">Active</NxChip></template>
    </NxListTile>
    <NxListTile title="Grace Hopper" subtitle="Invited" size="sm" disabled />
    <NxTypography>
      <NxChip label="Outlined" />
      <NxChip label="Active" active />
      <NxChip variant="ghost" color="error">Ghost</NxChip>
    </NxTypography>
    <NxAvatarGroup :max="2" size="lg">
      <NxAvatar><NxAvatarImage src="https://acme.example/ada.png" alt="Ada" /></NxAvatar>
      <NxAvatar><NxAvatarFallback>GH</NxAvatarFallback></NxAvatar>
      <NxAvatar><NxAvatarFallback>AT</NxAvatarFallback></NxAvatar>
      <NxAvatar><NxAvatarFallback>KJ</NxAvatarFallback></NxAvatar>
    </NxAvatarGroup>
    <NxAvatar :size="48"><NxAvatarImage src="https://acme.example/ada.png" alt="Ada" /></NxAvatar>
  </NxLayout>
</template>
