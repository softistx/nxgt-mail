<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/**
 * Vertical space in the theme's steps, on Maizzle's `<Spacer>`, which sets
 * the line height with the height so that Outlook keeps it. Named
 * `nx-spacer.vue`, not `spacer.vue`: there, Vue would read `<Spacer>` as this
 * file itself. A `class` such as `h-5` wins over `size`.
 */
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{ size?: Size }>(), { size: 'md' });

/** 8, 16, 24, 32 and 48 pixels. */
const SIZE: Record<Size, string> = {
	xs: 'h-2',
	sm: 'h-4',
	md: 'h-6',
	lg: 'h-8',
	xl: 'h-12',
};

const attrs = useAttrs();
const classes = computed(() =>
	twMerge(SIZE[props.size], attrs.class as string),
);
</script>

<template>
  <Spacer v-bind="{ ...attrs, class: undefined }" :class="classes" />
</template>
