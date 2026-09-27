<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, inject, useAttrs } from 'vue';
import {
	BUTTON_GROUP,
	type Color,
	type ColourVariant,
	colourVariant,
} from './ui';

/**
 * material-vue's Button as a link: its variants, colours and sizes, on
 * Maizzle's `<Button>`, which pads it for Outlook. Named `nx-button.vue`,
 * not `button.vue`: there, Vue would read `<Button>` as this file itself.
 *
 * In an `NxButtonGroup`, as material-vue's group restyles its buttons, it is
 * `rounded` rather than a pill, and `tonal` unless it says its variant — or
 * `filled`, for the one marked `data-state="active"`.
 */
type Size = 'xs' | 'sm' | 'default' | 'lg';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		href: string;
		variant?: ColourVariant;
		color?: Color;
		size?: Size;
		align?: 'left' | 'center' | 'right';
	}>(),
	{ color: 'primary', size: 'default' },
);

/** The chip's colours, plus what a link must reset. */
const EXTRA: Record<ColourVariant, string> = {
	filled: '',
	tonal: '',
	outlined: 'bg-transparent',
	ghost: 'bg-transparent',
	link: 'no-underline',
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
const inGroup = inject(BUTTON_GROUP, false);
const resolved = computed<ColourVariant>(
	() =>
		props.variant ??
		(inGroup
			? attrs['data-state'] === 'active'
				? 'filled'
				: 'tonal'
			: 'filled'),
);
const size = computed(() => SIZE[props.size]);
const classes = computed(() =>
	twMerge(
		resolved.value === 'link'
			? 'font-medium font-sans'
			: `rounded-full font-medium font-sans ${size.value.class}`,
		inGroup && resolved.value !== 'link' ? 'rounded' : '',
		colourVariant(resolved.value, props.color),
		EXTRA[resolved.value],
		attrs.class as string,
	),
);
</script>

<template>
  <Button
    v-bind="{ ...attrs, class: undefined }"
    :href="href"
    :variant="resolved === 'link' ? 'link' : 'solid'"
    :align="align ?? null"
    :mso-pt="size.msoPt"
    :mso-pb="size.msoPb"
    :mso-px="size.msoPx"
    :class="classes"
  ><slot /></Button>
</template>
