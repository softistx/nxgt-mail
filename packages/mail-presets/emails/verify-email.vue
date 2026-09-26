<template>
  <NxLayout :preheader="t('verifyEmail.preheader')">
    <NxTypography variant="headline-small">{{ t('verifyEmail.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('verifyEmail.body', { brand: brand.name }) }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('verifyEmail.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.linkFallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
    <NxTypography variant="caption">{{ t('common.footer.ignore') }}</NxTypography>
  </NxLayout>
</template>
