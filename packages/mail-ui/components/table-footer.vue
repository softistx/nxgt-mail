<script setup lang="ts">
import { provide } from 'vue';
import { TABLE_PART } from './ui';

/** material-vue's TableFooter: rows on a muted ground, in medium weight, with a line above. */
provide(TABLE_PART, 'footer');
</script>

<template>
  <tfoot><slot /></tfoot>
</template>
