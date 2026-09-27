<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/**
 * material-vue's Description: a label over its value. Nothing is rendered
 * without a value — `0` is one.
 */
defineOptions({ inheritAttrs: false });

const props = defineProps<{ label: string; value?: string | number | null }>();

const attrs = useAttrs();
const shown = computed(() => props.value === 0 || Boolean(props.value));
const classes = computed(() => twMerge('mb-4', attrs.class as string));
</script>

<template>
  <div v-if="shown" v-bind="{ ...attrs, class: undefined }" :class="classes">
    <p class="m-0 text-base font-semibold text-foreground nx-dark-text-foreground">{{ label }}</p>
    <p class="m-0 text-sm text-muted-foreground">{{ value }}</p>
    <slot />
  </div>
</template>
