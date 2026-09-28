<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs, useSlots } from 'vue';

/**
 * material-vue's Hero: an eyebrow, a large title, a description and actions,
 * in a rounded, bordered box. Its gradient and blurred shapes are a plain
 * `primary-5` ground here: a mail client draws neither reliably.
 */
defineOptions({ inheritAttrs: false });

defineProps<{ eyebrow?: string; title: string; description?: string }>();

const attrs = useAttrs();
const slots = useSlots();
const classes = computed(() =>
	twMerge(
		'rounded-2xl border border-solid border-border nx-dark-border-border bg-primary-5 px-8 py-10',
		attrs.class as string,
	),
);
</script>

<template>
  <table class="mb-4 w-full" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td v-bind="{ ...attrs, class: undefined }" :class="classes">
        <!-- `bg-primary-5` keeps the same value in dark mode (see theme.css),
             on purpose, even once `color-primary-dark` is set: the eyebrow's
             `text-primary`, the title's `text-foreground` and the
             description's `text-muted-foreground` below all stay un-flipped
             too, since a text colour flips only if its own ground does — so
             this box reads the same, self-contained, regardless of the page
             around it (dark-mode.md). -->
        <p v-if="eyebrow" class="m-0 text-xs font-semibold uppercase tracking-wider text-primary">{{ eyebrow }}</p>
        <h1 :class="['m-0 text-3xl font-semibold tracking-tight text-foreground', eyebrow && 'mt-3']">{{ title }}</h1>
        <p v-if="description" class="m-0 mt-4 text-base text-muted-foreground">{{ description }}</p>
        <div v-if="slots.actions" class="mt-6"><slot name="actions" /></div>
        <div v-if="slots.default" class="mt-8"><slot /></div>
      </td>
    </tr>
  </table>
</template>
