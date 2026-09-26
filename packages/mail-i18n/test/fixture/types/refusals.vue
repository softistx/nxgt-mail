<!--
  What the generated .maizzle/nxgt-mail-i18n.d.ts refuses in a template, at
  COMPILE time: checked by `bun run typecheck:templates` (vue-tsc), never
  built — it is outside emails/. Each @vue-expect-error stops holding the
  moment the directive goes unused. The calls that must keep compiling are
  here too, unmarked.

  Five plausible mistakes, five refused.
-->
<template>
  <!-- Must keep compiling. -->
  <p>{{ t('verifyEmail.title') }}</p>
  <p>{{ t('verifyEmail.greeting', { name: placeholder('name') }) }}</p>
  <p>{{ t('verifyEmail.expires', { minutes: 15 }) }}</p>
  <p>{{ t('verifyEmail.sentOn', { at: new Date(0) }) }} {{ locale }}</p>

  <!-- 1. A key the catalogues do not have. -->
  <!-- @vue-expect-error -->
  {{ t('verifyEmail.titel') }}

  <!-- 2. A message's argument left out. -->
  <!-- @vue-expect-error -->
  {{ t('verifyEmail.greeting') }}

  <!-- 3. An argument the message does not use. -->
  <!-- @vue-expect-error -->
  {{ t('verifyEmail.title', { name: 'Ada' }) }}

  <!-- 4. A plural's count given as text: a placeholder cannot choose. -->
  <!-- @vue-expect-error -->
  {{ t('verifyEmail.expires', { minutes: placeholder('minutes') }) }}

  <!-- 5. A key written in snake_case: every key is camelCase. -->
  <!-- @vue-expect-error -->
  {{ t('verify_email.title') }}
</template>
