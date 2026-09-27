<template>
  <Html :lang="locale" :dir="dir">
    <Body>
      <Container>
        <Heading>{{ t('verify-email.title') }}</Heading>
        <Text>{{ t('verify-email.greeting', { name: placeholder('name') }) }}</Text>
        <Text>{{ t('verify-email.expires', { minutes: 15 }) }}</Text>
        <Text>{{ t('verify-email.sent-on', { at: new Date(Date.UTC(2026, 0, 2, 12)) }) }}</Text>
        <Button :href="placeholder('link')">{{ t('verify-email.action') }}</Button>
      </Container>
    </Body>
  </Html>
</template>
