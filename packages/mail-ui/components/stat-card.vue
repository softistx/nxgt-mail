<script setup lang="ts">
import { computed, getCurrentInstance, useSlots } from 'vue';
import { type DeltaTone, deltaOf, dirOf } from './ui';

/**
 * material-vue's StatCard: a label, a figure, and under it a delta and a
 * hint, in an `NxCard`. The delta's arrow is a character (an e-mail has no
 * icon font). There is no loading state: an e-mail does not load. A reader
 * hears the delta as written, without material-vue's spoken "Up" or "Down".
 */
const props = defineProps<{
	label: string;
	value?: string | number;
	hint?: string;
	delta?: number | string;
	deltaTone?: DeltaTone;
}>();

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
const slots = useSlots();
const delta = computed(() =>
	props.delta === undefined || props.delta === ''
		? null
		: deltaOf(props.delta, props.deltaTone),
);
</script>

<template>
  <NxCard class="py-4">
    <NxCardContent class="px-4">
      <table class="w-full" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
        <tr>
          <td class="align-top text-sm text-muted-foreground nx-dark-text-muted-foreground">{{ label }}</td>
          <td v-if="slots.icon" :class="`w-1 whitespace-nowrap align-top text-muted-foreground nx-dark-text-muted-foreground ${dir === 'rtl' ? 'pr-3 text-left' : 'pl-3 text-right'}`"><slot name="icon" /></td>
        </tr>
      </table>
      <p class="m-0 mt-2 text-2xl font-semibold text-foreground nx-dark-text-foreground">{{ value }}</p>
      <p v-if="hint || delta" class="m-0 mt-2 text-xs">
        <span v-if="delta" :class="`font-medium ${dir === 'rtl' ? 'pl-2' : 'pr-2'} ${delta.colour}`"><span aria-hidden="true"><span data-maizzle-html-only>{{ delta.glyph }}</span></span> {{ delta.label }}</span>
        <span v-if="hint" class="text-muted-foreground nx-dark-text-muted-foreground">{{ hint }}</span>
      </p>
    </NxCardContent>
  </NxCard>
</template>
