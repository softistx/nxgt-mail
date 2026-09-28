<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/** material-vue's CardDescription, under the title. */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const classes = computed(() =>
	twMerge('m-0 mt-1.5 text-sm text-muted-foreground nx-dark-text-muted-foreground', attrs.class as string),
);
</script>

<template>
  <p v-bind="{ ...attrs, class: undefined }" :class="classes"><slot /></p>
</template>
