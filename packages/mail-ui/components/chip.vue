<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, provide, useAttrs, useSlots } from 'vue';
import { AVATAR_SIZE, type Color, type ColourVariant, colourVariant } from './ui';

/**
 * material-vue's Chip, static: a rounded label with `avatar`, `leading` and
 * `trailing` slots — `avatar` in place of `leading`, as in material-vue. An
 * e-mail runs no script, so it has no dismiss button; `active` makes it
 * `filled`, as in material-vue. Unlike material-vue's, the avatar is not
 * pulled into the padding: Gmail drops a negative margin.
 */

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		label?: string;
		variant?: ColourVariant;
		color?: Color;
		active?: boolean;
	}>(),
	{ variant: 'outlined', color: 'primary', active: false },
);

// An avatar in a chip is 20px, as material-vue's `size-5`.
provide(AVATAR_SIZE, 20);
const attrs = useAttrs();
const slots = useSlots();
const classes = computed(() =>
	twMerge(
		'inline-block whitespace-nowrap rounded-full px-2.5 py-1 align-middle text-sm font-medium',
		colourVariant(props.active ? 'filled' : props.variant, props.color),
		attrs.class as string,
	),
);
</script>

<template>
  <span v-bind="{ ...attrs, class: undefined }" :class="classes"><span v-if="slots.avatar" class="mr-1.5 inline-block align-middle"><slot name="avatar" /></span><span v-else-if="slots.leading" class="mr-1.5 inline-block align-middle"><slot name="leading" /></span><slot>{{ label }}</slot><span v-if="slots.trailing" class="ml-1.5 inline-block align-middle"><slot name="trailing" /></span></span>
</template>
