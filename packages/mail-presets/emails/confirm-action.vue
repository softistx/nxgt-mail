<template>
  <NxLayout :preheader="t('confirm-action.preheader')">
    <NxTypography variant="headline-small">{{ t('confirm-action.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxTypography>{{ t('confirm-action.body', { brand: brand.name }) }}</NxTypography>
    <NxCode>{{ placeholder('code') }}</NxCode>
    <NxTypography variant="body-small">{{ t('presets.code-expires', { expiresIn: placeholder('expiresIn') }) }}</NxTypography>
    <NxTypography>{{ t('confirm-action.warning') }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('confirm-action.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
