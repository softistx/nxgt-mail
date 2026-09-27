<template>
  <NxLayout :preheader="t('resetPassword.preheader')">
    <NxTypography variant="headline-small">{{ t('resetPassword.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('resetPassword.body', { brand: brand.name }) }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('resetPassword.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small">{{ t('presets.linkExpires', { expiresIn: placeholder('expiresIn') }) }}</NxTypography>
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.linkFallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
    <NxTypography variant="caption">{{ t('common.footer.ignore') }}</NxTypography>
  </NxLayout>
</template>
