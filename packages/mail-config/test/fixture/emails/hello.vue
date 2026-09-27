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
      </Container>
    </Body>
  </Html>
</template>
