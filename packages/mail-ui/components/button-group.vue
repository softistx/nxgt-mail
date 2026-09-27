<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, provide, useAttrs, useSlots } from 'vue';
import { BUTTON_GROUP, slotComponents } from './ui';

/**
 * material-vue's ButtonGroup: its buttons side by side, 4 pixels apart, on
 * the background with 8 pixels around. Each is a cell of one row, which
 * every client keeps on a line. As in material-vue, the buttons inside are
 * `rounded` and `tonal`, and the one marked `data-state="active"` is
 * `filled`; a button that says its `variant` keeps it.
 */
defineOptions({ inheritAttrs: false });

provide(BUTTON_GROUP, true);
const attrs = useAttrs();
const slots = useSlots();
const buttons = computed(() => slotComponents(slots.default?.()));
const classes = computed(() =>
	twMerge('bg-background p-2', attrs.class as string),
);
</script>

<template>
  <table class="mb-4 w-full" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td v-bind="{ ...attrs, class: undefined }" :class="classes">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td v-for="(button, index) in buttons" :key="index" :class="index < buttons.length - 1 ? 'pr-1 align-middle' : 'align-middle'"><component :is="button" /></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</template>
