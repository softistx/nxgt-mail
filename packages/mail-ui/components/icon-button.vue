<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';
import type { Color, ColourVariant } from './ui';

/**
 * material-vue's IconButton, as a link: a round `NxButton` holding one icon,
 * 36 pixels across. An e-mail has no icon font: `icon` is an image by absolute
 * URL (`https://…`), drawn at 16 pixels, or a character such as `★`; the
 * default slot takes any other content. Its name for a reader is its
 * `aria-label`, else its `tooltip`, which is also its `title`; the plain-text
 * version writes that name before the link, or the character without one.
 */
defineOptions({ inheritAttrs: false });

const props = defineProps<{
	href: string;
	icon?: string;
	variant?: ColourVariant;
	color?: Color;
	tooltip?: string;
}>();

const attrs = useAttrs();
const label = computed(
	() => (attrs['aria-label'] as string | undefined) ?? props.tooltip,
);
const classes = computed(() =>
	twMerge('p-2.5 leading-4', attrs.class as string),
);
const isImage = computed(
	() => props.icon !== undefined && /^https?:\/\//.test(props.icon),
);
</script>

<template>
  <NxButton
    v-bind="{ ...attrs, class: undefined }"
    :href="href"
    :variant="variant"
    :color="color"
    size="sm"
    :title="tooltip"
    :aria-label="label"
    :class="classes"
  ><span data-maizzle-html-only><span class="inline-block w-4 text-center align-top"><slot><img v-if="isImage" :src="icon" width="16" height="16" :alt="label ?? ''" class="block"><template v-else>{{ icon }}</template></slot></span></span><span data-maizzle-plaintext-only>{{ label ?? (isImage ? '' : icon) }}</span></NxButton>
</template>
