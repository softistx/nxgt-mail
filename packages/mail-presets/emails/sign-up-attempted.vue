<template>
  <NxLayout :preheader="t('sign-up-attempted.preheader')">
    <NxTypography variant="headline-small">{{ t('sign-up-attempted.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxBanner tone="warning" :title="t('sign-up-attempted.banner')" />
    <NxSummaryData
      :data="[
        { label: t('sign-up-attempted.device'), value: placeholder('device') },
        { label: t('sign-up-attempted.time'), value: placeholder('time') },
      ]"
    />
    <NxTypography>{{ t('sign-up-attempted.body') }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('sign-up-attempted.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
    <NxTypography variant="body-small" class="text-muted-foreground">{{ t('sign-up-attempted.ignore') }}</NxTypography>
  </NxLayout>
</template>
