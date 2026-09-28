<template>
  <NxLayout :preheader="t('recovery-code-used.preheader')">
    <NxTypography variant="headline-small">{{ t('recovery-code-used.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxBanner tone="warning" :title="t('recovery-code-used.banner', { when: placeholder('when') })" />
    <NxTypography>{{ placeholder('recoveryCodesLeft') }}</NxTypography>
    <NxTypography>{{ t('recovery-code-used.body', { brand: brand.name }) }} {{ t('presets.not-you') }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('recovery-code-used.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
