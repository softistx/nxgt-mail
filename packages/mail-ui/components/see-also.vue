<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs } from 'vue';
import { EYEBROW, type SeeAlsoItem, sharedMessage } from './ui';

/**
 * material-vue's SeeAlso: a line, a small uppercase label, and links one per
 * row. Every link of an e-mail opens a browser, so each carries the arrow
 * material-vue gives an external one, as a character.
 */
defineOptions({ inheritAttrs: false });

const props = defineProps<{ items: readonly SeeAlsoItem[]; label?: string }>();

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const heading = computed(
	() => props.label ?? sharedMessage(globals, 'common.seeAlso', 'See also'),
);
const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		'mb-4 mt-10 border-t [border-top-style:solid] border-border pt-8',
		attrs.class as string,
	),
);
</script>

<template>
  <div v-if="items.length > 0" v-bind="{ ...attrs, class: undefined }" :class="classes">
    <p :class="`${EYEBROW} mb-3`">{{ heading }}</p>
    <table class="w-full" role="presentation" cellpadding="0" cellspacing="0">
      <tr v-for="item in items" :key="item.id ?? item.href">
        <td class="px-2 py-2.5">
          <a :href="item.href" class="text-sm text-muted-foreground no-underline">{{ item.title }}</a>
        </td>
        <td class="w-1 px-2 text-right align-middle text-xs text-muted-foreground"><span aria-hidden="true"><span data-maizzle-html-only>&#8599;</span></span></td>
      </tr>
    </table>
  </div>
</template>
