<template>
  <NxLayout :preheader="t('welcome.body')">
    <NxTypography variant="headline-small">{{ t('welcome.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('welcome.body') }}</NxTypography>
    <NxCode>{{ placeholder('code') }}</NxCode>
    <NxButton :href="placeholder('link')">{{ t('welcome.action') }}</NxButton>
    <NxButton :href="placeholder('link')" variant="tonal" size="sm">Tonal</NxButton>
    <NxButton :href="placeholder('link')" variant="outlined" color="error">Outlined</NxButton>
    <NxButton :href="placeholder('link')" variant="link">Link</NxButton>
    <NxSeparator />
    <NxCard>
      <NxCardHeader title="Plan" description="Billed monthly">
        <template #action><NxBadge variant="success">Active</NxBadge></template>
      </NxCardHeader>
      <NxCardContent>
        <NxSummaryData :data="[{ label: 'Seats', value: 3 }, { label: 'Trial', value: 0 }, { label: 'Coupon', value: '' }]" />
      </NxCardContent>
      <NxCardFooter><NxStatusIndicator tone="success">Paid</NxStatusIndicator></NxCardFooter>
    </NxCard>
    <NxAlert variant="warning" title="Heads up" description="The code expires in 15 minutes." />
    <NxBanner tone="info" title="New sign-in" description="From a new device." />
    <NxTypography variant="caption">{{ t('common.footer.ignore') }}</NxTypography>
    <NxLink href="https://acme.example/help">Help</NxLink>
  </NxLayout>
</template>
