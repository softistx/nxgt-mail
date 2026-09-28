<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue';
import { deltaOf, dirOf, EYEBROW, sharedMessage } from './ui';

/**
 * material-vue's CompareCard: this period's figure beside the last one's, in
 * two boxes, and the delta between them, toned.
 */
const props = defineProps<{
	label: string;
	current: { value: string; label?: string };
	previous: { value: string; label?: string };
	delta?: number;
}>();

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
const currentLabel = computed(
	() =>
		props.current.label ??
		sharedMessage(globals, 'common.metrics.this-period', 'This period'),
);
const previousLabel = computed(
	() =>
		props.previous.label ??
		sharedMessage(globals, 'common.metrics.last-period', 'Last period'),
);
/** The two boxes: this period's, then the last one's, muted. */
const points = computed(() => [
	{ label: currentLabel.value, value: props.current.value },
	{ label: previousLabel.value, value: props.previous.value },
]);
const delta = computed(() =>
	props.delta === undefined ? null : deltaOf(props.delta),
);
</script>

<template>
  <NxCard class="py-4">
    <NxCardContent class="px-4">
      <table class="w-full" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
        <tr>
          <td class="align-middle"><NxCardDescription class="mt-0">{{ label }}</NxCardDescription></td>
          <td v-if="delta" :class="`whitespace-nowrap align-middle text-xs font-medium ${dir === 'rtl' ? 'pr-2 text-left' : 'pl-2 text-right'} ${delta.colour}`"><span aria-hidden="true"><span data-maizzle-html-only>{{ delta.glyph }}</span></span> {{ delta.label }}</td>
        </tr>
      </table>
      <table class="mt-4 w-full" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
        <tr>
          <td v-for="(point, side) in points" :key="side" :class="['w-1/2 align-top', side === 0 ? (dir === 'rtl' ? 'pl-1.5' : 'pr-1.5') : (dir === 'rtl' ? 'pr-1.5' : 'pl-1.5')]">
            <table class="w-full" role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td class="rounded border border-solid border-border nx-dark-border-border bg-background nx-dark-bg-background p-3">
                  <p :class="EYEBROW">{{ point.label }}</p>
                  <p :class="['m-0 mt-0.5 text-2xl font-semibold tracking-tight', side === 0 ? 'text-foreground nx-dark-text-foreground' : 'text-muted-foreground nx-dark-text-muted-foreground']">{{ point.value }}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </NxCardContent>
  </NxCard>
</template>
