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
		'h-10 whitespace-nowrap px-2 text-left align-middle font-medium',
		// One side's style only: `border-0 border-solid` would end as `border: 0`.
		// The footer's `bg-muted` keeps the same value in dark mode (see
		// theme.css): its text stays `text-foreground`, un-flipped, too.
		part === 'footer'
			? 'border-t [border-top-style:solid] border-border nx-dark-border-border bg-muted text-foreground'
			: 'border-b [border-bottom-style:solid] border-border nx-dark-border-border text-foreground nx-dark-text-foreground',
		attrs.class as string,
	),
);
</script>

<template>
  <th v-bind="{ ...attrs, class: undefined }" :class="classes"><slot /></th>
</template>
