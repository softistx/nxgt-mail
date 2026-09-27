<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs, useSlots } from 'vue';

/**
 * material-vue's ExtendedLabel: a title in a `NxTypography` variant, a short
 * bar under it in the primary colour, and a `trailing` slot on the right, at
 * the bottom. The bar is a cell of fixed height, as `NxProgress`'s, left out
 * of the plain-text version; material-vue's growing animation is not.
 */
type Variant =
	| 'normal'
	| 'headline-large'
	| 'headline-medium'
	| 'headline-small'
	| 'title-large'
	| 'title-medium'
	| 'title-small'
	| 'body-medium'
	| 'body-small'
	| 'caption';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{ variant?: Variant; indicatorClass?: string }>(),
	{ variant: 'title-medium' },
);

/** Outlook's shape for a thin cell, as `NxProgress`'s: height, line and font alike. */
const CELL =
	'height: 4px; line-height: 4px; font-size: 4px; mso-line-height-rule: exactly;';

const attrs = useAttrs();
const slots = useSlots();
const classes = computed(() =>
	twMerge('mt-2 mb-1.5 w-full', attrs.class as string),
);
const indicator = computed(() =>
	twMerge('w-14 rounded bg-primary', props.indicatorClass),
);
</script>

<template>
  <table v-bind="{ ...attrs, class: undefined }" :class="classes" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td class="align-bottom">
        <NxTypography :variant="variant" class="mb-0 font-semibold"><slot /></NxTypography>
        <div data-maizzle-html-only>
        <table class="mt-0.5" role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td :class="indicator" height="4" :style="CELL">&zwj;</td>
          </tr>
        </table>
        </div>
      </td>
      <td v-if="slots.trailing" class="pl-4 text-right align-bottom"><slot name="trailing" /></td>
    </tr>
  </table>
</template>
