<template>
  <NxLayout :preheader="t('email-changed.preheader')">
    <NxTypography variant="headline-small">{{ t('email-changed.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('email-changed.body', { brand: brand.name, newEmail: placeholder('newEmail') }) }}</NxTypography>
    <NxAlert variant="warning" :description="t('presets.not-you')" />
    <NxButton :href="placeholder('link')">{{ t('email-changed.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
