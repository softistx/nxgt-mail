<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs, useSlots } from 'vue';
import { dirOf } from './ui';

/**
 * material-vue's StepsItem: a numbered circle, a title and the text under it,
 * with a line from the circle down to the next step. Placed in `NxSteps`,
 * which numbers it and says whether it is the `last`.
 *
 * Two rows: the circle and the title, then the text beside a cell whose right
 * border is the line — in the same row, so the line runs as far down as the
 * text goes, in every client.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{ title?: string; index?: number; last?: boolean }>(),
	{ last: true },
);

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
const attrs = useAttrs();
const slots = useSlots();
const classes = computed(() =>
	twMerge(
		dir.value === 'rtl' ? 'pr-3 align-top' : 'pl-3 align-top',
		props.last ? 'pb-0' : 'pb-8',
		attrs.class as string,
	),
);
</script>

<template>
  <tr>
    <td colspan="2" class="w-8 align-top">
      <!-- `border-primary-25` is not one of the tints `color-primary-dark`
           recomputes (dark-mode.md), so it keeps the same value either way;
           `text-primary` must still flip with it, since its ground
           (`bg-background`) does. -->
      <span class="block h-8 w-8 rounded-full border border-solid border-primary-25 bg-background nx-dark-bg-background text-center text-xs font-semibold leading-[30px] text-primary nx-dark-text-primary"><slot name="index">{{ index }}</slot></span>
    </td>
    <td :class="dir === 'rtl' ? 'pr-3 align-top' : 'pl-3 align-top'">
      <p v-if="title" class="m-0 pt-1 text-base font-semibold tracking-tight text-foreground nx-dark-text-foreground">{{ title }}</p>
    </td>
  </tr>
  <tr>
    <td :class="['w-4 text-[1px] leading-px', !last && (dir === 'rtl' ? 'border-l [border-left-style:solid] border-border nx-dark-border-border' : 'border-r [border-right-style:solid] border-border nx-dark-border-border')]"><span data-maizzle-html-only>&zwj;</span></td>
    <td class="w-4 text-[1px] leading-px"><span data-maizzle-html-only>&zwj;</span></td>
    <td v-bind="{ ...attrs, class: undefined }" :class="classes">
      <div v-if="slots.default" class="mt-2 text-sm leading-6 text-muted-foreground nx-dark-text-muted-foreground"><slot /></div>
    </td>
  </tr>
</template>
