<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/** material-vue's CardFooter: the card's last row, as its actions. */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const classes = computed(() => twMerge('px-6 pt-6', attrs.class as string));
</script>

<template>
  <tr>
    <td v-bind="{ ...attrs, class: undefined }" :class="classes"><slot /></td>
  </tr>
</template>
