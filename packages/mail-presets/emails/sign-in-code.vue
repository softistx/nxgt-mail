<template>
  <NxLayout :preheader="t('signInCode.preheader')">
    <NxTypography variant="headline-small">{{ t('signInCode.title') }}</NxTypography>
    <NxTypography>{{ t('signInCode.body', { brand: brand.name }) }}</NxTypography>
    <NxCode>{{ placeholder('code') }}</NxCode>
    <NxTypography variant="caption">{{ t('signInCode.ignore') }}</NxTypography>
  </NxLayout>
</template>
