<template>
  <NxLayout :preheader="t('two-factor-disabled.preheader')">
    <NxTypography variant="headline-small">{{ t('two-factor-disabled.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('two-factor-disabled.body', { brand: brand.name }) }}</NxTypography>
    <NxAlert variant="error" :description="t('presets.not-you')" />
    <NxButton :href="placeholder('link')">{{ t('two-factor-disabled.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
