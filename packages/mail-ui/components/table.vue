<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/**
 * material-vue's Table: a full-width table of `text-sm` rows. Its parts are
 * `NxTableHeader`, `NxTableBody`, `NxTableFooter`, `NxTableRow`,
 * `NxTableHead`, `NxTableCell`, `NxTableCaption` and `NxTableEmpty`.
 */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const classes = computed(() =>
	twMerge('mb-4 w-full text-sm text-foreground', attrs.class as string),
);
</script>

<template>
  <!-- biome-ignore lint/a11y/noRedundantRoles: Maizzle marks a table without a role as role="none", a layout -->
  <table v-bind="{ ...attrs, class: undefined }" :class="classes" role="table" cellpadding="0" cellspacing="0"><slot /></table>
</template>
