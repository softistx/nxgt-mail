<script setup>
defineProps(['link', 'name', 'hours', 'code']);
</script>

<template>
  <TransactionalLayout :preheader="t('verifyEmail.preheader')">
    <MailHeading>{{ t('verifyEmail.title') }}</MailHeading>
    <MailText>{{ t('common.greeting', { name }) }}</MailText>
    <MailText>{{ t('verifyEmail.body') }}</MailText>
    <MailButton :href="link">{{ t('verifyEmail.action') }}</MailButton>
    <MailSpacer />
    <MailText>{{ t('verifyEmail.orCode') }}</MailText>
    <MailCode>{{ code }}</MailCode>
    <MailDivider />
    <MailText>{{ t('verifyEmail.expires', { hours }) }}</MailText>
    <template #footer>{{ t('common.footer.ignore') }}</template>
  </TransactionalLayout>
</template>
