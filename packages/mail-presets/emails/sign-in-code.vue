<template>
  <NxLayout :preheader="t('signInCode.preheader')">
    <NxTypography variant="headline-small">{{ t('signInCode.title') }}</NxTypography>
    <NxTypography>{{ t('signInCode.body', { brand: brand.name }) }}</NxTypography>
    <NxCode>{{ placeholder('code') }}</NxCode>
    <NxTypography variant="body-small">{{ t('presets.codeExpires', { expiresIn: placeholder('expiresIn') }) }}</NxTypography>
    <NxTypography variant="caption">{{ t('signInCode.ignore') }}</NxTypography>
  </NxLayout>
</template>
