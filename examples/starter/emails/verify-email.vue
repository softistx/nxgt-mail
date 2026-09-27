<template>
  <NxLayout :preheader="t('verifyEmail.preheader')">
    <NxTypography variant="headline-small">{{ t('verifyEmail.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('verifyEmail.body', { brand: brand.name }) }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('verifyEmail.action') }}</NxButton>
    <Spacer height="24px" />
    <NxAlert variant="warning" :title="t('verifyEmail.expires', { minutes: 15 })" />
    <Spacer height="24px" />
    <NxTypography variant="body-small">
      {{ t('verifyEmail.linkFallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
    <NxSeparator />
    <NxTypography variant="caption">{{ t('common.footer.ignore') }}</NxTypography>
  </NxLayout>
</template>
