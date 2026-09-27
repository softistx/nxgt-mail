<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/** material-vue's TableEmpty: one row across `colspan` columns, its text centred. */
defineOptions({ inheritAttrs: false });

withDefaults(defineProps<{ colspan?: number }>(), { colspan: 1 });

const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		'px-4 py-10 text-center align-middle text-sm text-foreground',
		attrs.class as string,
	),
);
</script>

<template>
  <tr>
    <td v-bind="{ ...attrs, class: undefined }" :colspan="colspan" :class="classes"><slot /></td>
  </tr>
</template>
