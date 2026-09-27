<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, inject, useAttrs } from 'vue';
import { AVATAR_SIZE } from './ui';

/** material-vue's AvatarFallback: initials, centred on a muted ground. */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const px = inject(AVATAR_SIZE, 32);
const classes = computed(() =>
	twMerge(
		// `bg-muted` keeps the same value in dark mode (see theme.css): its text
		// stays `text-foreground`, un-flipped, too.
		'block rounded-full bg-muted text-center text-[12px] font-medium text-foreground',
		attrs.class as string,
	),
);
</script>

<template>
  <span v-bind="{ ...attrs, class: undefined }" :class="classes" :style="`width: ${px}px; height: ${px}px; line-height: ${px}px;`"><slot /></span>
</template>
