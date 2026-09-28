<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/** material-vue's Typography, on the tag an e-mail reads it as. */
type Variant =
	| 'normal'
	| 'headline-large'
	| 'headline-medium'
	| 'headline-small'
	| 'title-large'
	| 'title-medium'
	| 'title-small'
	| 'body-medium'
	| 'body-small'
	| 'caption';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		variant?: Variant;
		/** Default `h1` for a headline, `h2`–`h4` for a title, else `p`. */
		as?: string;
	}>(),
	{ variant: 'normal' },
);

const VARIANT: Record<Variant, string> = {
	normal: 'text-sm',
	'headline-large': 'text-4xl font-semibold',
	'headline-medium': 'text-3xl font-semibold',
	'headline-small': 'text-2xl font-semibold',
	'title-large': 'text-xl font-semibold',
	'title-medium': 'text-lg font-semibold',
	'title-small': 'text-base font-semibold',
	'body-medium': 'text-sm',
	'body-small': 'text-xs',
	// `text-muted-foreground` alone: the base class below already carries
	// `nx-dark-text-foreground` unconditionally, and a second `nx-dark-*`
	// text class on the same element is not something `twMerge` reconciles
	// (it does not know our custom classes conflict) — adding one here would
	// change the default dark-mode colour, not just let a project override it.
	caption: 'text-[10px] text-muted-foreground',
};

const TAG: Partial<Record<Variant, string>> = {
	'headline-large': 'h1',
	'headline-medium': 'h1',
	'headline-small': 'h1',
	'title-large': 'h2',
	'title-medium': 'h3',
	'title-small': 'h4',
};

const attrs = useAttrs();
const tag = computed(() => props.as ?? TAG[props.variant] ?? 'p');
const classes = computed(() =>
	twMerge(
		'm-0 mb-4 text-foreground nx-dark-text-foreground',
		VARIANT[props.variant],
		attrs.class as string,
	),
);
</script>

<template>
  <component :is="tag" v-bind="{ ...attrs, class: undefined }" :class="classes"><slot /></component>
</template>
