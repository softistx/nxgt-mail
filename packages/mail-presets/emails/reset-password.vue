<template>
  <NxLayout :preheader="t('reset-password.preheader')">
    <NxTypography variant="headline-small">{{ t('reset-password.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('reset-password.body', { brand: brand.name }) }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('reset-password.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small">{{ t('presets.link-expires', { expiresIn: placeholder('expiresIn') }) }}</NxTypography>
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
    <NxTypography variant="caption">{{ t('common.footer.ignore') }}</NxTypography>
  </NxLayout>
</template>
