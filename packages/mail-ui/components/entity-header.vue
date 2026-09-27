<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs, useSlots } from 'vue';

/**
 * material-vue's EntityHeader: what an e-mail is about — an icon, a title
 * with its status, its details on one line, and actions on the right. Its
 * shadow is a border here.
 */
defineOptions({ inheritAttrs: false });

withDefaults(
	defineProps<{
		title: string;
		metadata?: { label: string; value?: string | number | null }[];
	}>(),
	{ metadata: () => [] },
);

const attrs = useAttrs();
const slots = useSlots();
const classes = computed(() =>
	twMerge(
		'rounded border border-solid border-border bg-background p-4',
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
            <td v-if="slots.icon" class="w-1 whitespace-nowrap pr-4 align-middle text-3xl leading-none"><slot name="icon" /></td>
            <td class="align-middle">
              <h2 class="m-0 text-lg font-semibold tracking-tight text-foreground">{{ title }} <span v-if="slots.status" class="pl-2 align-middle"><slot name="status" /></span></h2>
              <NxSummaryData v-if="metadata.length > 0" inline class="mb-0 mt-0.5" :data="metadata" />
            </td>
            <td v-if="slots.actions" class="w-1 whitespace-nowrap pl-4 text-right align-middle"><slot name="actions" /></td>
          </tr>
        </table>
        <div v-if="slots.default" class="mt-2"><slot /></div>
      </td>
    </tr>
  </table>
</template>
