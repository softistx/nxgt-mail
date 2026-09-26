<!--
  What the generated .maizzle/nxgt-mail-ui.d.ts refuses in a template, at
  COMPILE time: checked by `bun run typecheck:templates` (vue-tsc), never
  built — it is outside emails/. Each @vue-expect-error stops holding the
  moment the directive goes unused. The uses that must keep compiling are
  here too, unmarked.

  Two plausible mistakes, two refused.
-->
<template>
  <!-- Must keep compiling. -->
  <p>{{ brand.name }} {{ brand.url }} {{ brand.logo?.src }}</p>

  <!-- 1. A field the brand does not have. -->
  <!-- @vue-expect-error -->
  {{ brand.nmae }}

  <!-- 2. The logo read as if it were always given: it is optional. -->
  <!-- @vue-expect-error -->
  {{ brand.logo.src }}
</template>
