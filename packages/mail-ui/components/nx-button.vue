<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';
import type { Color } from './ui';

/**
 * material-vue's Button as a link: its variants, colours and sizes, on
 * Maizzle's `<Button>`, which pads it for Outlook.
 */
type Variant = 'filled' | 'tonal' | 'outlined' | 'ghost' | 'link';
type Size = 'xs' | 'sm' | 'default' | 'lg';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		href: string;
		variant?: Variant;
		color?: Color;
		size?: Size;
		align?: 'left' | 'center' | 'right';
	}>(),
	{ variant: 'filled', color: 'primary', size: 'default' },
);

/** The token of a colour: `default` is the foreground. */
const token = (color: Color) => (color === 'default' ? 'foreground' : color);

const VARIANT: Record<Variant, (color: Color) => string> = {
	filled: (c) =>
		c === 'default'
			? 'bg-foreground text-background'
			: `bg-${c} text-${c}-foreground`,
	tonal: (c) => `bg-${token(c)}-15 text-${token(c)}`,
	outlined: (c) =>
		`bg-transparent border border-solid border-${token(c)}-50 text-${token(c)}`,
	ghost: () => 'bg-transparent text-foreground',
	link: (c) => `text-${token(c)} no-underline`,
};

/** Padding, and the Outlook values Maizzle's Button derives the same padding from. */
const SIZE: Record<
	Size,
	{ class: string; msoPt: string; msoPb: string; msoPx: number }
> = {
	xs: {
		class: 'px-2 py-1 text-xs leading-4',
		msoPt: '4px',
		msoPb: '7px',
		msoPx: 67,
	},
	sm: {
		class: 'px-3 py-2 text-sm leading-4',
		msoPt: '8px',
		msoPb: '15px',
		msoPx: 86,
	},
	default: {
		class: 'px-4 py-2.5 text-sm leading-4',
		msoPt: '10px',
		msoPb: '19px',
		msoPx: 114,
	},
	lg: {
		class: 'px-6 py-3 text-sm leading-4',
		msoPt: '12px',
		msoPb: '23px',
		msoPx: 171,
	},
};

const attrs = useAttrs();
const size = computed(() => SIZE[props.size]);
const classes = computed(() =>
	twMerge(
		props.variant === 'link'
			? 'font-medium font-sans'
			: `rounded-full font-medium font-sans ${size.value.class}`,
		VARIANT[props.variant](props.color),
		attrs.class as string,
	),
);
</script>

<template>
  <Button
    v-bind="{ ...attrs, class: undefined }"
    :href="href"
    :variant="variant === 'link' ? 'link' : 'solid'"
    :align="align ?? null"
    :mso-pt="size.msoPt"
    :mso-pb="size.msoPb"
    :mso-px="size.msoPx"
    :class="classes"
  ><slot /></Button>
</template>
