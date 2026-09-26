<template>
  <Html :lang="locale">
    <Body>
      <Container>
        <Heading>{{ t('verifyEmail.title') }}</Heading>
        <Text>{{ t('verifyEmail.greeting', { name: placeholder('name') }) }}</Text>
        <Text>{{ t('verifyEmail.expires', { minutes: 15 }) }}</Text>
        <Text>{{ t('verifyEmail.sentOn', { at: new Date(Date.UTC(2026, 0, 2, 12)) }) }}</Text>
        <Button :href="placeholder('link')">{{ t('verifyEmail.action') }}</Button>
      </Container>
    </Body>
  </Html>
</template>
