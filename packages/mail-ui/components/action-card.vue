<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs, useSlots } from 'vue';
import { dirOf } from './ui';

/**
 * material-vue's ActionCard, still: a card with an `icon` in a box, a title,
 * a description and a round indicator, ticked and in the primary colour when
 * `active`. `sm` sets them on one row, `md` the icon and indicator above the
 * text. An e-mail runs no script, so it is not selected by a click: with
 * `href`, its title is a link. Its ring is a border here: a mail client draws
 * no box-shadow. The indicator is a character, left out of the plain-text
 * version.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		active?: boolean;
		variant?: 'sm' | 'md';
		title?: string;
		description?: string;
		withIndicator?: boolean;
		href?: string;
	}>(),
	{ active: false, variant: 'sm', withIndicator: true },
);

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
const attrs = useAttrs();
const slots = useSlots();
const classes = computed(() =>
	twMerge(
		'rounded-md py-4',
		props.active && 'border-primary-50 nx-dark-border-primary-50',
		attrs.class as string,
	),
);
const iconBox = computed(() =>
	props.active
		? 'rounded-md border border-solid border-primary nx-dark-border-primary bg-primary nx-dark-bg-primary px-4 py-1.5 text-center text-primary-foreground nx-dark-text-primary-foreground'
		: 'rounded-md border border-solid border-muted nx-dark-border-muted px-4 py-1.5 text-center text-muted-foreground nx-dark-text-muted-foreground',
);
const indicator = computed(() =>
	props.active
		? 'inline-block h-4 w-4 rounded-full border border-solid border-primary nx-dark-border-primary bg-primary nx-dark-bg-primary text-center text-[10px] font-semibold leading-4 text-primary-foreground nx-dark-text-primary-foreground'
		: 'inline-block h-4 w-4 rounded-full border border-solid border-muted-foreground nx-dark-border-muted-foreground text-center text-[10px] leading-4',
);
</script>

<template>
  <NxCard v-bind="{ ...attrs, class: undefined }" :class="classes">
    <NxCardContent class="px-4">
      <table v-if="variant === 'sm' || slots.icon || withIndicator" class="w-full" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
        <tr>
          <td v-if="slots.icon" :class="variant === 'sm' ? `w-1 align-middle ${dir === 'rtl' ? 'pl-4' : 'pr-4'}` : 'align-top'">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td :class="iconBox"><slot name="icon" /></td></tr></table>
          </td>
          <td v-if="variant === 'sm'" class="align-middle">
            <NxCardTitle v-if="title"><a v-if="href" :href="href" class="text-card-foreground nx-dark-text-card-foreground no-underline">{{ title }}</a><template v-else>{{ title }}</template></NxCardTitle>
            <NxCardDescription v-if="description">{{ description }}</NxCardDescription>
          </td>
          <td v-else-if="!slots.icon">&zwj;</td>
          <td v-if="withIndicator" :class="variant === 'sm' ? `w-1 align-middle ${dir === 'rtl' ? 'pr-4 text-left' : 'pl-4 text-right'}` : `w-1 align-top ${dir === 'rtl' ? 'text-left' : 'text-right'}`"><span aria-hidden="true"><span data-maizzle-html-only><span :class="indicator">{{ active ? '\u2713' : '\u200B' }}</span></span></span></td>
        </tr>
      </table>
      <table v-if="variant === 'md'" :class="slots.icon || withIndicator ? 'mt-4 w-full' : 'w-full'" role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <NxCardTitle v-if="title"><a v-if="href" :href="href" class="text-card-foreground nx-dark-text-card-foreground no-underline">{{ title }}</a><template v-else>{{ title }}</template></NxCardTitle>
            <NxCardDescription v-if="description">{{ description }}</NxCardDescription>
          </td>
        </tr>
      </table>
    </NxCardContent>
  </NxCard>
</template>
