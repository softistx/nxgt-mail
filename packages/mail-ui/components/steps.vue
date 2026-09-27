<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { cloneVNode, computed, getCurrentInstance, useAttrs, useSlots } from 'vue';
import { dirOf, slotComponents } from './ui';

/**
 * material-vue's Steps: its `NxStepsItem`s one under the other, numbered in
 * order unless an item says its `index`, and joined by a line.
 */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const slots = useSlots();
/** Each item, told its number and whether a line runs on under it. */
const items = computed(() => {
	const nodes = slotComponents(slots.default?.());
	return nodes.map((node, position) =>
		cloneVNode(node, {
			index: node.props?.index ?? position + 1,
			last: position === nodes.length - 1,
		}),
	);
});
const classes = computed(() => twMerge('mb-4 w-full', attrs.class as string));
const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
</script>

<template>
  <table v-bind="{ ...attrs, class: undefined }" :class="classes" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
    <component :is="item" v-for="(item, position) in items" :key="position" />
  </table>
</template>
