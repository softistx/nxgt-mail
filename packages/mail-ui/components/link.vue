<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/**
 * A link in text, in material-vue's link colour. Underlined: a phone has no
 * hover. Its ground (the card or the page background) always flips in dark
 * mode, so its text flips with `color-info-dark` too: see
 * docs/guide/dark-mode.md.
 */
defineOptions({ inheritAttrs: false });

defineProps<{ href: string }>();

const attrs = useAttrs();
const classes = computed(() =>
	twMerge('text-info nx-dark-text-info underline', attrs.class as string),
);
</script>

<template>
  <!-- biome-ignore lint/a11y/useAnchorContent: the link's text is the slot, which Biome cannot see. -->
  <a v-bind="{ ...attrs, class: undefined }" :href="href" :class="classes"><slot /></a>
</template>
