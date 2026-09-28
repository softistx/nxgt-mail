<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/** material-vue's TableCaption: a muted line under the table. */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const classes = computed(() =>
	twMerge('mt-4 text-sm text-muted-foreground nx-dark-text-muted-foreground', attrs.class as string),
);
</script>

<template>
  <caption v-bind="{ ...attrs, class: undefined }" align="bottom" :class="classes" style="caption-side: bottom"><slot /></caption>
</template>
