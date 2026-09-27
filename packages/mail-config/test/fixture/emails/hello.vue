<template>
  <Html>
    <Body>
      <Container>
        <Text>[[mark]]</Text>
        <Text>{{ greeting }} / {{ origin }}</Text>
        <AlphaBadge />
        <BetaBadge />
        <Signature />
        <Spacer height="24px" />
        <Text>Or paste <a href="https://example.test/go">https://example.test/go</a></Text>
        <Text>line one<br>line two</Text>
        <Text>If you did not ask for this, you can
ignore this e-mail: no changes were made to your account, and nothing else is
required of you.</Text>
      </Container>
    </Body>
  </Html>
</template>
