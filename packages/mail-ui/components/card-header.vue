<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs, useSlots } from 'vue';
import { dirOf } from './ui';

/**
 * material-vue's CardHeader: a title, a description under it, and an
 * `action` on the right.
 */
defineOptions({ inheritAttrs: false });

defineProps<{ title?: string; description?: string }>();

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
const attrs = useAttrs();
const slots = useSlots();
const classes = computed(() => twMerge('px-6 pb-6', attrs.class as string));
</script>

<template>
  <tr>
    <td v-bind="{ ...attrs, class: undefined }" :class="classes">
      <table class="w-full" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
        <tr>
          <td class="align-top">
            <NxCardTitle v-if="title">{{ title }}</NxCardTitle>
            <NxCardDescription v-if="description">{{ description }}</NxCardDescription>
            <slot />
          </td>
          <td v-if="slots.action" :class="`align-top ${dir === 'rtl' ? 'pr-4 text-left' : 'pl-4 text-right'}`"><slot name="action" /></td>
        </tr>
      </table>
    </td>
  </tr>
</template>
