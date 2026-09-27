<template>
  <NxLayout :preheader="t('invitation-accepted.preheader', { invitee: placeholder('invitee'), organization: placeholder('organization') })">
    <NxTypography variant="headline-small">{{ t('invitation-accepted.title', { invitee: placeholder('invitee'), organization: placeholder('organization') }) }}</NxTypography>
    <NxTypography>{{ t('invitation-accepted.body', { invitee: placeholder('invitee'), organization: placeholder('organization'), brand: brand.name }) }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('invitation-accepted.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.link-fallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
