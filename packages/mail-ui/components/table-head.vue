<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, inject, useAttrs } from 'vue';
import { TABLE_PART, type TablePart } from './ui';

/** material-vue's TableHead: a column's name, left-aligned, in medium weight. */
defineOptions({ inheritAttrs: false });

const part = inject<TablePart>(TABLE_PART, 'body');
const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		'h-10 whitespace-nowrap border-0 border-b border-solid border-border px-2 text-left align-middle font-medium text-foreground',
		part === 'footer' && 'border-b-0 border-t bg-muted',
		attrs.class as string,
	),
);
</script>

<template>
  <th v-bind="{ ...attrs, class: undefined }" :class="classes"><slot /></th>
</template>
