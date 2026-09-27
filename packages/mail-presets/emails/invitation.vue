<template>
  <NxLayout :preheader="t('invitation.preheader', { organization: placeholder('organization'), brand: brand.name })">
    <NxTypography variant="headline-small">{{ t('invitation.title', { organization: placeholder('organization') }) }}</NxTypography>
    <NxTypography>{{ t('invitation.body', { inviter: placeholder('inviter'), organization: placeholder('organization'), brand: brand.name }) }}</NxTypography>
    <NxButton :href="placeholder('link')">{{ t('invitation.action') }}</NxButton>
    <Spacer class="h-6" />
    <NxTypography variant="body-small">{{ t('invitation.expires', { expiresIn: placeholder('expiresIn') }) }}</NxTypography>
    <NxTypography variant="body-small" class="text-muted-foreground">
      {{ t('presets.linkFallback') }}
      <NxLink :href="placeholder('link')">{{ placeholder('link') }}</NxLink>
    </NxTypography>
  </NxLayout>
</template>
