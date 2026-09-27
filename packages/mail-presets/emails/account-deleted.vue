<template>
  <NxLayout :preheader="t('account-deleted.preheader')">
    <NxTypography variant="headline-small">{{ t('account-deleted.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('account-deleted.body', { brand: brand.name }) }}</NxTypography>
    <NxAlert variant="error" :description="t('presets.not-you')" />
    <NxButton :href="placeholder('link')">{{ t('account-deleted.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small">{{ t('account-deleted.expires', { expiresIn: placeholder('expiresIn') }) }}</NxTypography>
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
