<script setup lang="ts">
import { useAttrs } from 'vue';

/**
 * material-vue's TableRow. Its line is drawn by its cells: most mail clients
 * draw no border on a row.
 */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
</script>

<template>
  <tr v-bind="attrs"><slot /></tr>
</template>
