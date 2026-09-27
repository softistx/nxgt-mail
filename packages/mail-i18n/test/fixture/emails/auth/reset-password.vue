<template>
  <Html :lang="locale">
    <Body>
      <Container>
        <Text>{{ t('auth.reset-password.body', { email: placeholder('email') }) }}</Text>
        <Button :href="placeholder('resetLink')">↻</Button>
      </Container>
    </Body>
  </Html>
</template>
