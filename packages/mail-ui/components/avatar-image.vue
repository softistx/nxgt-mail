<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, inject, useAttrs } from 'vue';
import { AVATAR_SIZE } from './ui';

/** material-vue's AvatarImage: the picture, by absolute URL, cut round. */
defineOptions({ inheritAttrs: false });

defineProps<{ src: string; alt?: string }>();

const attrs = useAttrs();
const px = inject(AVATAR_SIZE, 32);
const classes = computed(() =>
	twMerge('block rounded-full', attrs.class as string),
);
</script>

<template>
  <img v-bind="{ ...attrs, class: undefined }" :src="src" :alt="alt ?? ''" :width="px" :height="px" :class="classes">
</template>
