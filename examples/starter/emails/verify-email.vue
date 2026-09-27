<template>
  <NxLayout :preheader="t('verify-email.preheader')">
    <NxTypography variant="headline-small">{{ t('verify-email.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('verify-email.body', { brand: brand.name }) }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('verify-email.action') }}</NxButton>
    <Spacer height="24px" />
    <NxAlert variant="warning" :title="t('verify-email.expires', { expiresIn: placeholder('expiresIn') })" />
    <Spacer height="24px" />
    <NxTypography variant="body-small">
      {{ t('verify-email.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
    <NxSeparator />
    <NxTypography variant="caption">{{ t('common.footer.ignore') }}</NxTypography>
  </NxLayout>
</template>
