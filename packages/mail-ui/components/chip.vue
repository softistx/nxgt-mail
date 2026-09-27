<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs, useSlots } from 'vue';
import type { Color } from './ui';

/**
 * material-vue's Chip, static: a rounded label with `avatar`, `leading` and
 * `trailing` slots. An e-mail runs no script, so it has no dismiss button;
 * `active` makes it `filled`, as in material-vue.
 */
type Variant = 'filled' | 'tonal' | 'outlined' | 'ghost' | 'link';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		label?: string;
		variant?: Variant;
		color?: Color;
		active?: boolean;
	}>(),
	{ variant: 'outlined', color: 'primary', active: false },
);

/** The token of a colour: `default` is the foreground. */
const token = (color: Color) => (color === 'default' ? 'foreground' : color);

/** NxButton's colours, which material-vue's Chip takes from its Button. */
const VARIANT: Record<Variant, (color: Color) => string> = {
	filled: (c) =>
		c === 'default'
			? 'bg-foreground text-background'
			: `bg-${c} text-${c}-foreground`,
	tonal: (c) => `bg-${token(c)}-15 text-${token(c)}`,
	outlined: (c) =>
		`border border-solid border-${token(c)}-50 text-${token(c)}`,
	ghost: () => 'text-foreground',
	link: (c) => `text-${token(c)}`,
};

const attrs = useAttrs();
const slots = useSlots();
const classes = computed(() =>
	twMerge(
		'inline-block whitespace-nowrap rounded-full px-2.5 py-1 align-middle text-sm font-medium',
		VARIANT[props.active ? 'filled' : props.variant](props.color),
		attrs.class as string,
	),
);
</script>

<template>
  <span v-bind="{ ...attrs, class: undefined }" :class="classes"><span v-if="slots.avatar" class="-ml-1 mr-1.5 inline-block align-middle"><slot name="avatar" /></span><span v-if="slots.leading" class="mr-1.5 inline-block align-middle"><slot name="leading" /></span><slot>{{ label }}</slot><span v-if="slots.trailing" class="ml-1.5 inline-block align-middle"><slot name="trailing" /></span></span>
</template>
