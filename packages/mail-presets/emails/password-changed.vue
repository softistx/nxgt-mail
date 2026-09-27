<template>
  <NxLayout :preheader="t('password-changed.preheader')">
    <NxTypography variant="headline-small">{{ t('password-changed.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('password-changed.body', { brand: brand.name }) }}</NxTypography>
    <NxAlert variant="warning" :description="t('presets.not-you')" />
    <NxButton :href="placeholder('link')">{{ t('password-changed.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
