<script setup lang="ts">
import { provide } from 'vue';
import { TABLE_PART } from './ui';

/** material-vue's TableHeader: its cells are `NxTableHead`s, with a line under them. */
provide(TABLE_PART, 'header');
</script>

<template>
  <thead><slot /></thead>
</template>
