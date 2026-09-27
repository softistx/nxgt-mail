<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs, useSlots } from 'vue';
import type { Tone } from './ui';

/**
 * material-vue's Banner: a status in a tinted, bordered box, with an
 * `action` on the right. Its icon is a slot: an e-mail has no icon font.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		tone?: Tone;
		title?: string;
		description?: string;
	}>(),
	{ tone: 'info' },
);

const TONE: Record<Tone, string> = {
	info: 'border-info-40 bg-info-10',
	success: 'border-success-40 bg-success-10',
	warning: 'border-warning-40 bg-warning-10',
	error: 'border-error-40 bg-error-10',
};

const attrs = useAttrs();
const slots = useSlots();
const classes = computed(() =>
	twMerge(
		'rounded-md border border-solid px-4 py-3',
		TONE[props.tone],
		attrs.class as string,
	),
);
</script>

<template>
  <table class="mb-4 w-full" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td v-bind="{ ...attrs, class: undefined }" :class="classes">
        <table class="w-full" role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td v-if="slots.icon" :class="`w-4 pr-3 align-top text-${tone}`"><slot name="icon" /></td>
            <td class="align-top text-foreground">
              <p v-if="title" class="m-0 text-sm font-semibold">{{ title }}</p>
              <p v-if="description" class="m-0 text-sm text-muted-foreground">{{ description }}</p>
              <slot />
            </td>
            <td v-if="slots.action" class="pl-3 text-right align-middle"><slot name="action" /></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</template>
