<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/**
 * material-vue's Kbd: a key, in monospace, on the muted background. Its
 * height is a line height here, which a client keeps on an inline box.
 */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		'inline-block min-w-5 rounded border border-solid border-border bg-muted px-1 text-center align-middle font-mono text-[10px] font-medium leading-[18px] text-muted-foreground',
		attrs.class as string,
	),
);
</script>

<template>
  <kbd v-bind="{ ...attrs, class: undefined }" :class="classes"><slot /></kbd>
</template>
