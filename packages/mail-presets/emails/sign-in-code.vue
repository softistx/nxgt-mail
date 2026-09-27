<template>
  <NxLayout :preheader="t('sign-in-code.preheader')">
    <NxTypography variant="headline-small">{{ t('sign-in-code.title') }}</NxTypography>
    <NxTypography>{{ t('sign-in-code.body', { brand: brand.name }) }}</NxTypography>
    <NxCode>{{ placeholder('code') }}</NxCode>
    <NxTypography variant="body-small">{{ t('presets.code-expires', { expiresIn: placeholder('expiresIn') }) }}</NxTypography>
    <NxTypography variant="caption">{{ t('sign-in-code.ignore') }}</NxTypography>
  </NxLayout>
</template>
