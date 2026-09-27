<template>
  <NxLayout :preheader="t('new-sign-in.preheader')">
    <NxTypography variant="headline-small">{{ t('new-sign-in.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxBanner tone="warning" :title="t('new-sign-in.banner')" />
    <NxSummaryData
      :data="[
        { label: t('new-sign-in.device'), value: placeholder('device') },
        { label: t('new-sign-in.location'), value: placeholder('location') },
        { label: t('new-sign-in.time'), value: placeholder('time') },
      ]"
    />
    <NxTypography>{{ t('new-sign-in.body') }} {{ t('presets.not-you') }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('new-sign-in.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
