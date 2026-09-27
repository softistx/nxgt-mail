<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/**
 * material-vue's Progress, still: a bar of `modelValue` out of `max`, on a
 * track at 20% of the primary colour. The fill is a table cell of that width,
 * which every client draws; material-vue's transform and pulse are not.
 *
 * The share is computed when the e-mail is built: a value that is not a
 * number — a placeholder, filled only at send time — **throws**, rather than
 * drawing an empty bar.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{ modelValue?: number; max?: number; height?: number }>(),
	{ modelValue: 0, max: 100, height: 8 },
);

for (const [name, value] of [
	['modelValue', props.modelValue],
	['max', props.max],
	['height', props.height],
] as const) {
	if (
		typeof value !== 'number' ||
		!Number.isFinite(value) ||
		(name === 'height' && value <= 0)
	) {
		throw new Error(
			`NxProgress: ${name} must be a number known when the e-mail is built — a placeholder is filled only when it is sent`,
		);
	}
}

const attrs = useAttrs();
const percent = computed(() =>
	props.max > 0
		? Math.min(
				100,
				Math.max(0, Math.round((props.modelValue / props.max) * 100)),
			)
		: 0,
);
/** Outlook's shape for a thin cell, as `NxSeparator`'s: height, line and font alike. */
const cell = computed(
	() =>
		`height: ${props.height}px; line-height: ${props.height}px; font-size: ${props.height}px; mso-line-height-rule: exactly;`,
);
const classes = computed(() =>
	twMerge('mb-4 w-full rounded-full bg-primary-20', attrs.class as string),
);
</script>

<template>
  <!-- Left out of the plain-text version, where a bar says nothing: Maizzle keeps what is inside in the HTML. -->
  <div data-maizzle-html-only>
  <table v-bind="{ ...attrs, class: undefined }" :class="classes" role="progressbar" :aria-valuenow="modelValue" aria-valuemin="0" :aria-valuemax="max" cellpadding="0" cellspacing="0">
    <tr>
      <td v-if="percent > 0" class="rounded-full bg-primary" :height="height" :style="`width: ${percent}%; ${cell}`">&zwj;</td>
      <td v-if="percent < 100" :height="height" :style="cell">&zwj;</td>
    </tr>
  </table>
  </div>
</template>
