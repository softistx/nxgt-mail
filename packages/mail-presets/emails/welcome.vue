<template>
  <NxLayout :preheader="t('welcome.preheader')">
    <NxTypography variant="headline-small">{{ t('welcome.title', { brand: brand.name }) }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('welcome.body') }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('welcome.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
