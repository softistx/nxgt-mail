<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs } from 'vue';
import {
	type Attribute,
	type AttributeValue,
	sharedMessage,
} from './ui';

/**
 * material-vue's AttributesList, read: its label over one tile per attribute,
 * the attribute's label as the title and its value — from `values` by
 * `name`, else its `defaultValue` — with its `unit` under it. A list is
 * joined with commas. material-vue's list describes attributes to edit, with
 * their type under the label; an e-mail tells the reader what they hold, so
 * it shows the value, and takes `values` for it.
 *
 * A value is written as given, placeholder or not: nothing is parsed or
 * formatted at build time. An attribute without a value is left out — `0` is
 * one — and with none left, nothing is written: an e-mail has no "Add" button
 * for an empty list.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		data?: readonly Attribute[];
		values?: Readonly<Record<string, AttributeValue>>;
		label?: string;
	}>(),
	{ data: () => [], values: () => ({}) },
);

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const heading = computed(
	() =>
		props.label ?? sharedMessage(globals, 'common.attributes', 'Attributes'),
);

function written(value: AttributeValue): string | null {
	if (value === null || value === undefined) return null;
	const text = Array.isArray(value) ? value.join(', ') : String(value);
	return text === '' ? null : text;
}

const rows = computed(() =>
	props.data.flatMap((attribute) => {
		const value = written(
			props.values[attribute.name] ?? attribute.defaultValue,
		);
		if (value === null) return [];
		return [
			{
				key: attribute.name,
				title: attribute.label || attribute.name,
				value: attribute.unit ? `${value} ${attribute.unit}` : value,
			},
		];
	}),
);
const attrs = useAttrs();
const classes = computed(() => twMerge('mb-4', attrs.class as string));
</script>

<template>
  <div v-if="rows.length > 0" v-bind="{ ...attrs, class: undefined }" :class="classes">
    <NxExtendedLabel><slot name="label">{{ heading }}</slot></NxExtendedLabel>
    <NxListTile v-for="row in rows" :key="row.key" :title="row.title" :subtitle="row.value" />
  </div>
</template>
