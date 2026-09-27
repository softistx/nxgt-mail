<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, inject, provide, useAttrs } from 'vue';
import { AVATAR_SIZE } from './ui';

/**
 * material-vue's Avatar: a round box of `size` pixels (32 by default, or its
 * `NxAvatarGroup`'s) holding an `NxAvatarImage` or an `NxAvatarFallback`.
 * An e-mail cannot fall back when an image fails: give one or the other.
 */
defineOptions({ inheritAttrs: false });

const props = defineProps<{ size?: number }>();

const attrs = useAttrs();
const inherited = inject(AVATAR_SIZE, 32);
const px = computed(() => props.size ?? inherited);
provide(AVATAR_SIZE, px.value);
const classes = computed(() =>
	twMerge(
		'inline-block overflow-hidden rounded-full align-middle',
		attrs.class as string,
	),
);
</script>

<template>
  <span v-bind="{ ...attrs, class: undefined }" :class="classes" :style="`width: ${px}px; height: ${px}px;`"><slot /></span>
</template>
