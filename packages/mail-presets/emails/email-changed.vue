<template>
  <NxLayout :preheader="t('emailChanged.preheader')">
    <NxTypography variant="headline-small">{{ t('emailChanged.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('emailChanged.body', { brand: brand.name, newEmail: placeholder('newEmail') }) }}</NxTypography>
    <NxAlert variant="warning" :description="t('presets.notYou')" />
    <NxButton :href="placeholder('link')">{{ t('emailChanged.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.linkFallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
