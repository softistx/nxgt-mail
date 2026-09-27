<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, inject, useAttrs } from 'vue';
import { TABLE_PART, type TablePart } from './ui';

/**
 * material-vue's TableCell. Unlike material-vue's, its text wraps: a value too
 * long for one line would widen the e-mail past a phone's screen.
 */
defineOptions({ inheritAttrs: false });

const part = inject<TablePart>(TABLE_PART, 'body');
const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		'border-0 border-b border-solid border-border p-2 align-middle',
		part === 'footer' && 'border-b-0 border-t bg-muted font-medium',
		attrs.class as string,
	),
);
</script>

<template>
  <td v-bind="{ ...attrs, class: undefined }" :class="classes"><slot /></td>
</template>
