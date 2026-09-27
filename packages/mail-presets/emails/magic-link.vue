<template>
  <NxLayout :preheader="t('magicLink.preheader')">
    <NxTypography variant="headline-small">{{ t('magicLink.title', { brand: brand.name }) }}</NxTypography>
    <NxTypography>{{ t('magicLink.body') }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('magicLink.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small">{{ t('presets.linkExpires', { expiresIn: placeholder('expiresIn') }) }}</NxTypography>
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.linkFallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
    <NxTypography variant="caption">{{ t('common.footer.ignore') }}</NxTypography>
  </NxLayout>
</template>
