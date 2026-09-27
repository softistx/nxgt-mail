<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs } from 'vue';
import { dirOf, EYEBROW, type SeeAlsoItem, sharedMessage } from './ui';

/**
 * material-vue's SeeAlso: a line, a small uppercase label, and links one per
 * row. Every link of an e-mail opens a browser, so each carries the arrow
 * material-vue gives an external one, as a character. The line is a cell's
 * top border, and the space above it padding, which Outlook keeps and a
 * margin not.
 */
defineOptions({ inheritAttrs: false });

const props = defineProps<{ items: readonly SeeAlsoItem[]; label?: string }>();

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
const heading = computed(
	() => props.label ?? sharedMessage(globals, 'common.see-also', 'See also'),
);
// An external link's arrow, mirrored so it still points away from the text.
const arrow = computed(() => (dir.value === 'rtl' ? '↖' : '↗'));
const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		'mb-4 w-full',
		attrs.class as string,
	),
);
</script>

<template>
  <table v-if="items.length > 0" v-bind="{ ...attrs, class: undefined }" :class="classes" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
    <tr>
      <td class="pt-10">
        <table class="w-full" role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td class="border-t [border-top-style:solid] border-border nx-dark-border-border pt-8">
              <p :class="`${EYEBROW} mb-3`">{{ heading }}</p>
              <table class="w-full" role="presentation" cellpadding="0" cellspacing="0">
                <tr v-for="item in items" :key="item.id ?? item.href">
                  <td class="px-2 py-2.5">
                    <a :href="item.href" class="text-sm text-muted-foreground no-underline">{{ item.title }}</a>
                  </td>
                  <td :class="`w-1 px-2 align-middle text-xs text-muted-foreground ${dir === 'rtl' ? 'text-left' : 'text-right'}`"><span aria-hidden="true"><span data-maizzle-html-only>{{ arrow }}</span></span></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</template>
