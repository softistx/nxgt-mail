<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/**
 * material-vue's Progress, still: a bar of `value` out of `max`, on a track
 * at 20% of the primary colour. The fill is a table cell of that width, which
 * every client draws; material-vue's transform and pulse are not.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{ value?: number; max?: number }>(), {
	value: 0,
	max: 100,
});

const attrs = useAttrs();
const percent = computed(() =>
	props.max > 0
		? Math.min(100, Math.max(0, Math.round((props.value / props.max) * 100)))
		: 0,
);
const classes = computed(() =>
	twMerge('mb-4 w-full rounded-full bg-primary-20', attrs.class as string),
);
</script>

<template>
  <table v-bind="{ ...attrs, class: undefined }" :class="classes" role="progressbar" :aria-valuenow="value" aria-valuemin="0" :aria-valuemax="max" cellpadding="0" cellspacing="0">
    <tr>
      <td v-if="percent > 0" class="h-2 rounded-full bg-primary text-[0px] leading-2" height="8" :style="`width: ${percent}%;`">&#8203;</td>
      <td v-if="percent < 100" class="h-2 text-[0px] leading-2" height="8">&#8203;</td>
    </tr>
  </table>
</template>
