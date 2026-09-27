<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/** material-vue's CardTitle. */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		'm-0 text-base font-semibold leading-none text-card-foreground nx-dark-text-card-foreground',
		attrs.class as string,
	),
);
</script>

<template>
  <!-- biome-ignore lint/a11y/useHeadingContent: the heading's text is the slot, which Biome cannot see. -->
  <h3 v-bind="{ ...attrs, class: undefined }" :class="classes"><slot /></h3>
</template>
