<template>
  <NxLayout :preheader="t('passwordChanged.preheader')">
    <NxTypography variant="headline-small">{{ t('passwordChanged.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('passwordChanged.body', { brand: brand.name }) }}</NxTypography>
    <NxAlert variant="warning" :description="t('presets.notYou')" />
    <NxButton :href="placeholder('link')">{{ t('passwordChanged.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.linkFallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
