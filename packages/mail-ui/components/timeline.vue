<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs } from 'vue';
import {
	dirOf,
	sharedMessage,
	type TimelineItem,
	type TimelineTone,
} from './ui';

/**
 * material-vue's Timeline: events one under the other, each a toned marker
 * on a line, its title, a time on the right, and a description.
 *
 * An e-mail is built before it is sent, so a time is a label you write —
 * a placeholder, as `{{ placeholder('signedInAt') }}` — never a relative time
 * computed at build time. There is no loading state: an e-mail does not load.
 */
defineOptions({ inheritAttrs: false });

const props = defineProps<{ items: readonly TimelineItem[]; empty?: string }>();

const MARKER: Record<TimelineTone, string> = {
	default: 'border-border nx-dark-border-border bg-muted text-muted-foreground',
	primary:
		'border-primary-40 nx-dark-border-primary-40 bg-primary-15 nx-dark-bg-primary-15 text-primary nx-dark-text-primary',
	success: 'border-success-40 bg-success-15 text-success',
	info: 'border-info-40 bg-info-15 text-info',
	warning: 'border-warning-40 bg-warning-15 text-warning',
	error: 'border-error-40 bg-error-15 text-error',
};

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
const emptyText = computed(
	() =>
		props.empty ??
		sharedMessage(globals, 'common.timeline.empty', 'No activity yet'),
);
const attrs = useAttrs();
const classes = computed(() => twMerge('mb-4 w-full', attrs.class as string));
const emptyClasses = computed(() =>
	twMerge(
		'mb-4 py-6 text-center text-sm text-muted-foreground',
		attrs.class as string,
	),
);
</script>

<template>
  <table v-if="props.items.length > 0" v-bind="{ ...attrs, class: undefined }" :class="classes" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
    <template v-for="(item, position) in props.items" :key="item.id">
      <tr>
        <td colspan="2" class="w-8 align-top">
          <span :class="`block h-8 w-8 rounded-full border border-solid text-center text-[12px] leading-[30px] ${MARKER[item.tone ?? 'default']}`" aria-hidden="true"><span data-maizzle-html-only>&#9679;</span></span>
        </td>
        <td :class="dir === 'rtl' ? 'pr-3 align-top' : 'pl-3 align-top'">
          <table class="w-full" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
            <tr>
              <td class="pt-1 align-top text-sm font-medium leading-6 text-foreground nx-dark-text-foreground">{{ item.title }}</td>
              <td v-if="item.timestampLabel" :class="`whitespace-nowrap pt-1 align-top text-xs leading-6 text-muted-foreground ${dir === 'rtl' ? 'pr-3 text-left' : 'pl-3 text-right'}`">{{ item.timestampLabel }}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td :class="['w-4 text-[1px] leading-px', position < props.items.length - 1 && (dir === 'rtl' ? 'border-l [border-left-style:solid] border-border nx-dark-border-border' : 'border-r [border-right-style:solid] border-border nx-dark-border-border')]"><span data-maizzle-html-only>&zwj;</span></td>
        <td class="w-4 text-[1px] leading-px"><span data-maizzle-html-only>&zwj;</span></td>
        <td :class="[dir === 'rtl' ? 'pr-3 align-top' : 'pl-3 align-top', position < props.items.length - 1 && 'pb-6']">
          <p v-if="item.description" class="m-0 text-sm text-muted-foreground">{{ item.description }}</p>
        </td>
      </tr>
    </template>
  </table>
  <p v-else v-bind="{ ...attrs, class: undefined }" :class="emptyClasses">{{ emptyText }}</p>
</template>
