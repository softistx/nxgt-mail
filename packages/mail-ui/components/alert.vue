<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs, useSlots } from 'vue';
import { dirOf } from './ui';

/** material-vue's Alert: a tinted block with a thick bar on its left. */
type Variant =
	| 'primary'
	| 'secondary'
	| 'error'
	| 'success'
	| 'info'
	| 'warning'
	| 'foreground';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		variant?: Variant;
		title?: string;
		description?: string;
	}>(),
	{ variant: 'primary' },
);

const VARIANT: Record<Variant, string> = {
	primary: 'border-primary bg-primary-5',
	secondary: 'border-secondary bg-secondary-5',
	error: 'border-error bg-error-5',
	success: 'border-success bg-success-5',
	info: 'border-info bg-info-5',
	warning: 'border-warning bg-warning-5',
	foreground: 'border-foreground bg-muted',
};

/** material-vue colours the icon with the variant: `[&_svg]:text-<variant>`. */
const ICON: Record<Variant, string> = {
	primary: 'text-primary',
	secondary: 'text-secondary',
	error: 'text-error',
	success: 'text-success',
	info: 'text-info',
	warning: 'text-warning',
	// Every variant's ground is a light tint that keeps the same value in dark
	// mode (see theme.css): its text stays `text-foreground` too, un-flipped.
	foreground: 'text-foreground',
};

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const dir = computed(() => dirOf(globals));
const attrs = useAttrs();
const slots = useSlots();
const classes = computed(() =>
	twMerge(
		`border-0 border-solid p-4 ${dir.value === 'rtl' ? 'border-r-8' : 'border-l-8'}`,
		VARIANT[props.variant],
		attrs.class as string,
	),
);
</script>

<template>
  <table class="mb-4 w-full" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
    <tr>
      <td v-bind="{ ...attrs, class: undefined }" :class="classes">
        <table class="w-full" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
          <tr>
            <td v-if="slots.icon" :class="`w-6 align-top ${dir === 'rtl' ? 'pl-2' : 'pr-2'} ${ICON[props.variant]}`"><slot name="icon" /></td>
            <td class="align-top">
              <p v-if="title || slots.title" class="m-0 mb-1 text-base font-bold text-foreground"><slot name="title">{{ title }}</slot></p>
              <p v-if="description || slots.description" class="m-0 text-sm text-muted-foreground"><slot name="description">{{ description }}</slot></p>
              <slot />
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</template>
