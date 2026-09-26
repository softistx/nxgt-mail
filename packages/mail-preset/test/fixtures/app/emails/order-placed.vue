<script setup>
defineProps(['name', 'reference', 'orderLink']);
</script>

<template>
  <TransactionalLayout>
    <MailHeading>{{ t('orderPlaced.title', { name }) }}</MailHeading>
    <MailText>{{ t('orderPlaced.body') }} <MailLink :href="orderLink">{{ reference }}</MailLink></MailText>
  </TransactionalLayout>
</template>
