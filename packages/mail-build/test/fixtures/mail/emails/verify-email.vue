<script setup>
defineProps(['link', 'name', 'hours']);
</script>

<template>
  <Layout :lang="lang">
    <Container class="bg-white p-6">
      <Heading class="text-2xl text-indigo-600">{{ t('verifyEmail.title') }}</Heading>
      <Text>{{ t('verifyEmail.body', { name }) }}</Text>
      <Button :href="link" class="bg-indigo-600 text-white">{{ t('verifyEmail.action') }}</Button>
      <Text>{{ t('verifyEmail.expires', { hours }) }}</Text>
    </Container>
  </Layout>
</template>
