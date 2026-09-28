<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue';
import { dirOf } from './ui';

/**
 * material-vue's BreakdownCard: parts of a whole, each a label, its value
 * (its share when none is given) and a thin `NxProgress` of its share.
 */
defineProps<{
	label: string;
	items: readonly { label: string; value?: string; percent: number }[];
}>();

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
</script>

<template>
  <NxCard class="py-4">
    <NxCardContent class="px-4">
      <NxCardDescription class="mt-0">{{ label }}</NxCardDescription>
      <template v-for="(item, position) in items" :key="item.label">
        <table :class="['w-full', position === 0 ? 'mt-4' : 'mt-3']" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
          <tr>
            <td class="align-bottom text-sm font-medium text-foreground nx-dark-text-foreground">{{ item.label }}</td>
            <td :class="`whitespace-nowrap align-bottom text-sm text-muted-foreground nx-dark-text-muted-foreground ${dir === 'rtl' ? 'pr-3 text-left' : 'pl-3 text-right'}`">{{ item.value ?? `${Math.round(item.percent)}%` }}</td>
          </tr>
        </table>
        <NxProgress class="mb-0 mt-1.5" :model-value="item.percent" :height="6" />
      </template>
    </NxCardContent>
  </NxCard>
</template>
