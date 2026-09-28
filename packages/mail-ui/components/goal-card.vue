<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue';
import { sharedMessage } from './ui';

/**
 * material-vue's GoalCard: a figure against its target, `of {target}`, and a
 * thin `NxProgress` of the share reached.
 */
const props = defineProps<{
	label: string;
	value: number;
	target: number;
	unit?: string;
}>();

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const ofTarget = computed(() =>
	sharedMessage(globals, 'common.metrics.of-target', `of ${props.target}`, {
		target: String(props.target),
	}),
);
</script>

<template>
  <NxCard class="py-4">
    <NxCardContent class="px-4">
      <NxCardDescription class="mt-0">{{ label }}</NxCardDescription>
      <p class="m-0 mt-3"><span class="text-2xl font-semibold tracking-tight text-foreground nx-dark-text-foreground">{{ value }}{{ unit }}</span> <span class="text-sm text-muted-foreground nx-dark-text-muted-foreground">{{ ofTarget }}</span></p>
      <NxProgress class="mb-0 mt-3" :model-value="value" :max="target" :height="6" />
    </NxCardContent>
  </NxCard>
</template>
