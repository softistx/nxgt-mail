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
		// `bg-muted` follows a project-set `color-muted-dark`, same as
		// `color-primary-dark` (see theme.css); its text is `text-foreground` in
		// light mode, matching material-vue, but flips to
		// `color-muted-foreground-dark` instead of staying pinned to the unflipped
		// foreground once its own ground has flipped: docs/guide/dark-mode.md.
		'block rounded-full bg-muted nx-dark-bg-muted text-center text-[12px] font-medium text-foreground nx-dark-text-muted-foreground',
		attrs.class as string,
	),
);
</script>

<template>
  <span v-bind="{ ...attrs, class: undefined }" :class="classes" :style="`width: ${px}px; height: ${px}px; line-height: ${px}px;`"><slot /></span>
</template>
