<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/**
 * material-vue's Card: a bordered, rounded box. Its parts —
 * `NxCardHeader`, `NxCardContent`, `NxCardFooter` — are its rows.
 */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		'rounded-xl border border-solid border-border nx-dark-border-border bg-card nx-dark-bg-card py-6 text-card-foreground nx-dark-text-card-foreground shadow-sm',
		attrs.class as string,
	),
);
</script>

<template>
  <table class="mb-4 w-full" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td v-bind="{ ...attrs, class: undefined }" :class="classes">
        <table class="w-full" role="presentation" cellpadding="0" cellspacing="0">
          <slot />
        </table>
      </td>
    </tr>
  </table>
</template>
