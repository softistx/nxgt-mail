<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/** material-vue's Badge: a small pill of text. */
type Variant =
	| 'default'
	| 'secondary'
	| 'destructive'
	| 'error'
	| 'success'
	| 'info'
	| 'warning'
	| 'outline'
	| 'outlined';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{ variant?: Variant }>(), {
	variant: 'default',
});

const VARIANT: Record<Variant, string> = {
	default:
		'border-primary nx-dark-border-primary bg-primary nx-dark-bg-primary text-primary-foreground nx-dark-text-primary-foreground',
	secondary: 'border-secondary bg-secondary text-secondary-foreground',
	destructive: 'border-error bg-error text-white',
	error: 'border-error bg-error text-error-foreground',
	success: 'border-success bg-success text-success-foreground',
	info: 'border-info bg-info text-info-foreground',
	warning: 'border-warning bg-warning text-warning-foreground',
	outline: 'border-border nx-dark-border-border text-foreground nx-dark-text-foreground',
	outlined: 'border-border nx-dark-border-border text-foreground nx-dark-text-foreground',
};

const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		'inline-block whitespace-nowrap rounded-full border border-solid px-2 py-0.5 text-xs font-medium',
		VARIANT[props.variant],
		attrs.class as string,
	),
);
</script>

<template>
  <span v-bind="{ ...attrs, class: undefined }" :class="classes"><slot /></span>
</template>
