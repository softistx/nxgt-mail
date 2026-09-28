<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs, useSlots } from 'vue';
import { dirOf } from './ui';

/**
 * material-vue's ListTile: a title, a subtitle under it, and `leading` and
 * `trailing` slots on its sides. With `href`, the title is a link. A ring is
 * a border here: a mail client draws no box-shadow.
 */
type Size = 'sm' | 'md';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		title: string;
		subtitle?: string;
		href?: string;
		selected?: boolean;
		disabled?: boolean;
		size?: Size;
	}>(),
	{ selected: false, disabled: false, size: 'md' },
);

const SIZE: Record<Size, { idle: string; selected: string; title: string }> = {
	md: {
		idle: 'rounded bg-primary-5 px-4 py-2',
		selected: 'rounded border border-solid border-primary-40 bg-primary-15 px-4 py-2',
		title: 'text-sm font-semibold',
	},
	sm: {
		idle: 'rounded px-2 py-1.5',
		selected: 'rounded border border-solid border-primary-40 bg-primary-10 px-2 py-1.5',
		title: 'text-[13px] font-medium',
	},
};

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
const attrs = useAttrs();
const slots = useSlots();
const size = computed(() => SIZE[props.size]);
const classes = computed(() =>
	twMerge(
		props.selected ? size.value.selected : size.value.idle,
		attrs.class as string,
	),
);
const titleClass = computed(() =>
	twMerge(
		'no-underline',
		size.value.title,
		// idle/selected (`bg-primary-5/10/15`, `border-primary-40`) are left
		// un-wired to `color-primary-dark` on purpose: a decorative,
		// self-contained ground like NxHero's and NxEventChip's, so a text
		// colour over it — the title here, disabled or not, and the subtitle
		// below — stays un-flipped too, since its own ground does not flip
		// either (dark-mode.md).
		props.disabled ? 'text-muted-foreground' : 'text-foreground',
	),
);
const gap = computed(() => {
	if (props.size === 'md') {
		return dir.value === 'rtl'
			? { leading: 'pl-4', trailing: 'pr-4' }
			: { leading: 'pr-4', trailing: 'pl-4' };
	}
	return dir.value === 'rtl'
		? { leading: 'pl-2', trailing: 'pr-2' }
		: { leading: 'pr-2', trailing: 'pl-2' };
});
</script>

<template>
  <table class="mb-2 w-full" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td v-bind="{ ...attrs, class: undefined }" :class="classes">
        <table class="w-full" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
          <tr>
            <td v-if="slots.leading" :class="`w-1 whitespace-nowrap align-middle ${gap.leading}`"><slot name="leading" /></td>
            <td class="align-middle">
              <a v-if="href && !disabled" :href="href" :class="titleClass">{{ title }}</a>
              <span v-else :class="titleClass">{{ title }}</span>
              <p v-if="subtitle" class="m-0 text-sm text-muted-foreground">{{ subtitle }}</p>
            </td>
            <td v-if="slots.trailing" :class="`w-1 whitespace-nowrap align-middle ${dir === 'rtl' ? 'text-left' : 'text-right'} ${gap.trailing}`"><slot name="trailing" /></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</template>
