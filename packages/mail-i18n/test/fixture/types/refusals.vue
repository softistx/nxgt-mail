<!--
  What the generated .maizzle/nxgt-mail-i18n.d.ts refuses in a template, at
  COMPILE time: checked by `bun run typecheck:templates` (vue-tsc), never
  built — it is outside emails/. Each @vue-expect-error stops holding the
  moment the directive goes unused. The calls that must keep compiling are
  here too, unmarked.

  Eight plausible mistakes, eight refused.
-->
<script setup lang="ts">
import type { TemplateKey } from '@nxgt/mail-i18n';

// A key that may be any message: checked by the build alone.
const key = 'verify-email.greeting' as TemplateKey;
</script>

<template>
  <!-- Must keep compiling. -->
  <p>{{ t('verify-email.title') }}</p>
  <p>{{ t('verify-email.greeting', { name: placeholder('name') }) }}</p>
  <p>{{ t('verify-email.expires', { minutes: 15 }) }}</p>
  <p>{{ t('verify-email.sent-on', { at: new Date(0) }) }} {{ locale }}</p>
  <p>{{ t(locale === 'fr' ? 'verify-email.title' : 'verify-email.action') }}</p>
  <p>{{ t(locale === 'fr' ? 'verify-email.greeting' : 'verify-email.subject', { name: placeholder('name') }) }}</p>
  <p>{{ t(key, { name: placeholder('name') }) }}</p>
  <!-- A catalogue split into folders: the prefix is a key too. -->
  <p>{{ t('mails.welcome.subject') }}</p>

  <!-- 1. A key the catalogues do not have. -->
  <!-- @vue-expect-error -->
  {{ t('verify-email.titel') }}

  <!-- 2. A message's argument left out. -->
  <!-- @vue-expect-error -->
  {{ t('verify-email.greeting') }}

  <!-- 3. An argument the message does not use. -->
  <!-- @vue-expect-error -->
  {{ t('verify-email.title', { name: 'Ada' }) }}

  <!-- 4. A plural's count given as text: a placeholder cannot choose. -->
  <!-- @vue-expect-error -->
  {{ t('verify-email.expires', { minutes: placeholder('minutes') }) }}

  <!-- 5. A key written in snake_case: every key is camelCase or kebab-case, never snake_case. -->
  <!-- @vue-expect-error -->
  {{ t('verify_email.title') }}

  <!-- 6. A key that may be a message without arguments or one with. -->
  <!-- @vue-expect-error -->
  {{ t(locale === 'fr' ? 'verify-email.title' : 'verify-email.expires') }}

  <!-- 7. The same, given the arguments of only one of them. -->
  <!-- @vue-expect-error -->
  {{ t(locale === 'fr' ? 'verify-email.greeting' : 'verify-email.expires', { minutes: 1 }) }}

  <!-- 8. A folder file's own key, called without its prefix. -->
  <!-- @vue-expect-error -->
  {{ t('welcome.subject') }}
</template>
