<template>
  <NxLayout :preheader="t('magic-link.preheader')">
    <NxTypography variant="headline-small">{{ t('magic-link.title', { brand: brand.name }) }}</NxTypography>
    <NxTypography>{{ t('magic-link.body') }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('magic-link.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small">{{ t('presets.link-expires', { expiresIn: placeholder('expiresIn') }) }}</NxTypography>
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
    <NxTypography variant="caption">{{ t('common.footer.ignore') }}</NxTypography>
  </NxLayout>
</template>
