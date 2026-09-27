<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs } from 'vue';
import { dirOf } from './ui';

/**
 * material-vue's SummaryData: labels and their values, a row each, or on
 * one line with `inline`. A row without a value is left out — `0` is a
 * value — unless `showEmpty`.
 */
interface SummaryDatum {
	label: string;
	value?: string | number | null;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		data?: SummaryDatum[];
		inline?: boolean;
		showEmpty?: boolean;
	}>(),
	{ data: () => [], inline: false, showEmpty: false },
);

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
const attrs = useAttrs();
const rows = computed(() =>
	props.showEmpty
		? props.data
		: props.data.filter(({ value }) => value === 0 || Boolean(value)),
);
const classes = computed(() => twMerge('mb-4 w-full', attrs.class as string));
</script>

<template>
  <p v-if="inline" v-bind="{ ...attrs, class: undefined }" :class="twMerge('m-0 mb-4 text-sm', attrs.class as string)">
    <template v-for="(row, index) in rows" :key="index"><span class="whitespace-nowrap"><span class="font-medium text-muted-foreground">{{ row.label }}:</span> {{ row.value }}</span><template v-if="index < rows.length - 1">&ensp; </template></template>
  </p>
  <table v-else v-bind="{ ...attrs, class: undefined }" :class="classes" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
    <tr v-for="(row, index) in rows" :key="index">
      <td :class="`border-b [border-bottom-style:solid] border-primary-40 py-2 text-sm text-muted-foreground ${dir === 'rtl' ? 'pl-2' : 'pr-2'}`">{{ row.label }}</td>
      <td :class="`border-b [border-bottom-style:solid] border-primary-40 py-2 text-sm text-foreground nx-dark-text-foreground ${dir === 'rtl' ? 'text-left' : 'text-right'}`">{{ row.value }}</td>
    </tr>
  </table>
</template>
