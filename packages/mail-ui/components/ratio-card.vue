<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue';
import { dirOf, EYEBROW } from './ui';

/**
 * material-vue's RatioCard: two figures side by side, and a bar of the left
 * one's share, on a track at 15% of the primary. The fill is NxProgress's,
 * rounded at both ends where material-vue's ends square.
 */
defineProps<{
	label: string;
	left: { label: string; value: string };
	right: { label: string; value: string };
	percent: number;
}>();

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
</script>

<template>
  <NxCard class="py-4">
    <NxCardContent class="px-4">
      <NxCardDescription class="mt-0">{{ label }}</NxCardDescription>
      <table class="mt-3 w-full" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
        <tr>
          <td class="align-top">
            <p :class="EYEBROW">{{ left.label }}</p>
            <p class="m-0 mt-0.5 text-lg font-semibold tracking-tight text-foreground nx-dark-text-foreground">{{ left.value }}</p>
          </td>
          <td :class="`align-top ${dir === 'rtl' ? 'pr-3 text-left' : 'pl-3 text-right'}`">
            <p :class="EYEBROW">{{ right.label }}</p>
            <p class="m-0 mt-0.5 text-lg font-semibold tracking-tight text-muted-foreground">{{ right.value }}</p>
          </td>
        </tr>
      </table>
      <NxProgress class="mb-0 mt-3 rounded bg-primary-15" :model-value="percent" />
    </NxCardContent>
  </NxCard>
</template>
