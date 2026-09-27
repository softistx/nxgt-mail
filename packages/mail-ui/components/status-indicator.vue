<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/**
 * material-vue's StatusIndicator: a coloured dot before a label. The dot is
 * a character, which every client sizes, where an empty span is dropped.
 */
type Tone = 'neutral' | 'primary' | 'success' | 'info' | 'warning' | 'error';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{ tone?: Tone }>(), { tone: 'neutral' });

const DOT: Record<Tone, string> = {
	neutral: 'text-muted-foreground',
	primary: 'text-primary',
	success: 'text-success',
	info: 'text-info',
	warning: 'text-warning',
	error: 'text-error',
};

const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		'whitespace-nowrap text-sm font-medium text-foreground nx-dark-text-foreground',
		attrs.class as string,
	),
);
</script>

<template>
  <span v-bind="{ ...attrs, class: undefined }" :class="classes"><span aria-hidden="true" :class="`${DOT[props.tone]} pr-1.5 text-[10px]`">&#9679;</span><slot /></span>
</template>
