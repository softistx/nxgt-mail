<template>
  <NxLayout :preheader="t('newSignIn.preheader')">
    <NxTypography variant="headline-small">{{ t('newSignIn.title') }}</NxTypography>
    <NxTypography>{{ t('common.greeting', { name: placeholder('name') }) }}</NxTypography>
    <NxBanner tone="warning" :title="t('newSignIn.banner')" />
    <NxSummaryData
      :data="[
        { label: t('newSignIn.device'), value: placeholder('device') },
        { label: t('newSignIn.location'), value: placeholder('location') },
        { label: t('newSignIn.time'), value: placeholder('time') },
      ]"
    />
    <NxTypography>{{ t('newSignIn.body') }} {{ t('presets.notYou') }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('newSignIn.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.linkFallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
