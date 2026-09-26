<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/** A link in text, in material-vue's link colour. Underlined: a phone has no hover. */
defineOptions({ inheritAttrs: false });

defineProps<{ href: string }>();

const attrs = useAttrs();
const classes = computed(() =>
	twMerge('text-info underline', attrs.class as string),
);
</script>

<template>
  <a v-bind="{ ...attrs, class: undefined }" :href="href" :class="classes"><slot /></a>
</template>
