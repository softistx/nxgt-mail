<script setup>
defineProps(['name', 'reference', 'placedAt', 'total', 'logo', 'orderLink']);
</script>

<template>
  <Layout :lang="lang">
    <Container class="bg-white p-6">
      <img :src="logo" :alt="t('orderPlaced.logoAlt')" width="120">
      <Heading class="text-2xl">{{ t('orderPlaced.title', { name }) }}</Heading>
      <Text>{{ reference }}</Text>
      <Text>{{ t('orderPlaced.placedAt', { at: placedAt }) }}</Text>
      <Text>{{ t('orderPlaced.total', { total }) }}</Text>
      <a :href="orderLink">{{ reference }}</a>
    </Container>
  </Layout>
</template>
