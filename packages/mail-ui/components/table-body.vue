<script setup lang="ts">
import { provide } from 'vue';
import { TABLE_PART } from './ui';

/** material-vue's TableBody: the rows, each with a line under it. */
provide(TABLE_PART, 'body');
</script>

<template>
  <tbody><slot /></tbody>
</template>
