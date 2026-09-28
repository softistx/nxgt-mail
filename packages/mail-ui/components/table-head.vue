<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, inject, useAttrs } from 'vue';
import { dirOf, TABLE_PART, type TablePart } from './ui';

/**
 * material-vue's TableHead: a column's name, aligned to the start of the
 * direction it builds in (left in `ltr`, right in `rtl`), in medium weight.
 */
defineOptions({ inheritAttrs: false });

const part = inject<TablePart>(TABLE_PART, 'body');
const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		`h-10 whitespace-nowrap px-2 align-middle font-medium ${dir.value === 'rtl' ? 'text-right' : 'text-left'}`,
		// One side's style only: `border-0 border-solid` would end as `border: 0`.
		// The footer's `bg-muted` follows a project-set `color-muted-dark`
		// (see theme.css); its text flips to `color-muted-foreground-dark`
		// with it, rather than staying pinned to the unflipped
		// `color-foreground` the body's cells (below) use — pick a
		// `color-muted-dark` light enough to keep it legible, or leave both
		// unset: docs/guide/dark-mode.md.
		part === 'footer'
			? 'border-t [border-top-style:solid] border-border nx-dark-border-border bg-muted nx-dark-bg-muted text-foreground nx-dark-text-muted-foreground'
			: 'border-b [border-bottom-style:solid] border-border nx-dark-border-border text-foreground nx-dark-text-foreground',
		attrs.class as string,
	),
);
</script>

<template>
  <th v-bind="{ ...attrs, class: undefined }" :class="classes"><slot /></th>
</template>
