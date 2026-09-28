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
		'p-2 align-middle',
		// One side's style only: `border-0 border-solid` would end as `border: 0`.
		// The footer's `bg-muted` follows a project-set `color-muted-dark`
		// (see theme.css); its text is set here, un-flipped, rather than left
		// to inherit the body's flipped colour from `NxTable` — pick a
		// `color-muted-dark` light enough to keep it legible, or leave it
		// unset: docs/guide/dark-mode.md.
		part === 'footer'
			? 'border-t [border-top-style:solid] border-border nx-dark-border-border bg-muted nx-dark-bg-muted font-medium text-foreground'
			: 'border-b [border-bottom-style:solid] border-border nx-dark-border-border',
		attrs.class as string,
	),
);
</script>

<template>
  <td v-bind="{ ...attrs, class: undefined }" :class="classes"><slot /></td>
</template>
