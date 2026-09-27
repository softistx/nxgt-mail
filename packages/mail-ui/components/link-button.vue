<script setup lang="ts">
import type { Color, ColourVariant } from './ui';

/**
 * material-vue's LinkButton: an `NxButton` to `to`, drawn as a link unless
 * its `variant` says otherwise. An e-mail has no router: `to` is the URL the
 * button opens, and material-vue's `replace` and `target` have nothing to do.
 */
type Size = 'xs' | 'sm' | 'default' | 'lg';

withDefaults(
	defineProps<{
		to: string;
		variant?: ColourVariant;
		color?: Color;
		size?: Size;
		align?: 'left' | 'center' | 'right';
	}>(),
	{ variant: 'link', color: 'primary', size: 'default' },
);
</script>

<template>
  <NxButton :href="to" :variant="variant" :color="color" :size="size" :align="align"><slot /></NxButton>
</template>
