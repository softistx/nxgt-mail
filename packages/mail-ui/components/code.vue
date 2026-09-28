<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/**
 * A code the reader types in, such as a one-time code: large, spaced and in
 * monospace, on material-vue's muted background.
 */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		// `bg-muted` follows a project-set `color-muted-dark`, same as
		// `color-primary-dark` (see theme.css); its text stays `text-foreground`,
		// never flipped — pick a `color-muted-dark` light enough to keep it
		// legible, or leave it unset: docs/guide/dark-mode.md.
		'rounded-lg bg-muted nx-dark-bg-muted px-6 py-4 text-center font-mono text-3xl font-semibold tracking-[0.3em] text-foreground',
		attrs.class as string,
	),
);
</script>

<template>
  <table class="mb-4 w-full" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td v-bind="{ ...attrs, class: undefined }" :class="classes"><slot /></td>
    </tr>
  </table>
</template>
