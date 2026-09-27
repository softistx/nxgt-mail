<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/**
 * material-vue's Separator, horizontal: a 1px line in the border colour.
 * Its space above and below is padding, which Outlook keeps and a margin not.
 */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const classes = computed(() => twMerge('py-6', attrs.class as string));
</script>

<template>
  <table class="w-full" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td v-bind="{ ...attrs, class: undefined }" :class="classes">
        <table class="w-full" role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td class="bg-border" style="height: 1px; line-height: 1px; font-size: 1px;">&zwj;</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</template>
