<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs } from 'vue';
import { type Color, sharedMessage } from './ui';

/**
 * material-vue's RatingField, read only: `max` stars, the first
 * `modelValue` in `color`, the others muted, with its `label` over them and
 * its `helperText` under them. A star is a character — an e-mail has no icon
 * font — and a muted star is the foreground at 25%, where material-vue draws
 * a duotone icon, lighter than its muted text. Its row reads "4 of 5" to a screen reader and in the plain-text
 * version.
 *
 * With `href`, each star is a link to `href(star)`: a review request, where
 * the reader rates by following one. The rating is drawn when the e-mail is
 * built: a `modelValue` or `max` that is not a number — a placeholder,
 * filled only when it is sent — **throws**.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		modelValue?: number;
		max?: number;
		color?: Color;
		label?: string;
		helperText?: string;
		href?: (star: number) => string;
	}>(),
	{ modelValue: 0, max: 5, color: 'warning' },
);

for (const [name, value] of [
	['modelValue', props.modelValue],
	['max', props.max],
] as const) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new Error(
			`NxRating: ${name} must be a number known when the e-mail is built — a placeholder is filled only when it is sent`,
		);
	}
}

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
/** material-vue's `clampRating`: a whole number from 0 to max, max at least 1. */
const max = computed(() => Math.max(1, Math.round(props.max)));
const current = computed(() =>
	Math.min(Math.max(Math.round(props.modelValue), 0), max.value),
);
const of = (value: number) =>
	sharedMessage(globals, 'common.rating.star', `${value} of ${max.value}`, {
		value,
		max: max.value,
	});
const stars = computed(() =>
	Array.from({ length: max.value }, (_, index) => {
		const star = index + 1;
		return {
			star,
			label: of(star),
			href: props.href?.(star),
			colour:
				star <= current.value
					? props.color === 'default'
						? 'text-foreground nx-dark-text-foreground'
						: `text-${props.color}`
					: 'text-foreground-25 nx-dark-text-foreground-25',
		};
	}),
);
const attrs = useAttrs();
const classes = computed(() => twMerge('mb-4', attrs.class as string));
</script>

<template>
  <div v-bind="{ ...attrs, class: undefined }" :class="classes">
    <p v-if="label" class="m-0 mb-1.5 text-sm font-medium text-foreground nx-dark-text-foreground">{{ label }}</p>
    <p v-if="href" class="m-0 text-xl leading-7"><template v-for="item in stars" :key="item.star"><a :href="item.href" :class="`${item.colour} mr-1 no-underline`" :title="item.label" :aria-label="item.label"><span data-maizzle-html-only>&#9733;</span><span data-maizzle-plaintext-only>{{ item.label }}</span></a> </template></p>
    <p v-else class="m-0 text-xl leading-7" role="img" :aria-label="of(current)"><span data-maizzle-html-only><span v-for="item in stars" :key="item.star" :class="`${item.colour} mr-1`" aria-hidden="true">&#9733;</span></span><span data-maizzle-plaintext-only>{{ of(current) }}</span></p>
    <p v-if="helperText" class="m-0 mt-1.5 text-xs text-muted-foreground nx-dark-text-muted-foreground">{{ helperText }}</p>
  </div>
</template>
