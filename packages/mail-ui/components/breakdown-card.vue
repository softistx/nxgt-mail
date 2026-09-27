<script setup lang="ts">
/**
 * material-vue's BreakdownCard: parts of a whole, each a label, its value
 * (its share when none is given) and a thin `NxProgress` of its share.
 */
defineProps<{
	label: string;
	items: readonly { label: string; value?: string; percent: number }[];
}>();
</script>

<template>
  <NxCard class="py-4">
    <NxCardContent class="px-4">
      <NxCardDescription class="mt-0">{{ label }}</NxCardDescription>
      <template v-for="(item, position) in items" :key="item.label">
        <table :class="['w-full', position === 0 ? 'mt-4' : 'mt-3']" role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td class="align-bottom text-sm font-medium text-foreground">{{ item.label }}</td>
            <td class="whitespace-nowrap pl-3 text-right align-bottom text-sm text-muted-foreground">{{ item.value ?? `${Math.round(item.percent)}%` }}</td>
          </tr>
        </table>
        <NxProgress class="mb-0 mt-1.5" :model-value="item.percent" :height="6" />
      </template>
    </NxCardContent>
  </NxCard>
</template>
