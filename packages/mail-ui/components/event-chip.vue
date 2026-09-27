<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';
import type { Color } from './ui';

/**
 * material-vue's EventChip, static: an event's time over its title, on a
 * ground of its colour with a bar of the colour on the left — the date and
 * time of an invitation. An e-mail runs no script, so it has no click and no
 * `disabled`; `selected` draws a border where material-vue draws a ring.
 *
 * material-vue mixes the colour at 18% over nothing, which a mail client
 * would not draw: the ground here is a plain colour, mixed when the e-mail is
 * built. A colour of the theme (`primary`, `success`, …) takes its 20% tint
 * and follows the theme; a hex colour is mixed at 18% over white. Anything
 * else **throws**: the build cannot mix it.
 *
 * A `compact` title is material-vue's `caption`, muted.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		title: string;
		/** As written: a placeholder, or a time you format. */
		time?: string;
		color?: Color | `#${string}`;
		allDay?: boolean;
		compact?: boolean;
		selected?: boolean;
		continuesBefore?: boolean;
		continuesAfter?: boolean;
	}>(),
	{
		color: 'primary',
		allDay: false,
		compact: false,
		selected: false,
		continuesBefore: false,
		continuesAfter: false,
	},
);

const THEME: readonly string[] = [
	'primary',
	'secondary',
	'info',
	'success',
	'warning',
	'error',
	'default',
];
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `#abc` or `#aabbcc` mixed at 18% over white, as a browser shows the alpha. */
function tint(hex: string): string {
	const digits =
		hex.length === 4
			? hex
					.slice(1)
					.split('')
					.map((digit) => digit + digit)
					.join('')
			: hex.slice(1);
	const channels = [0, 2, 4].map((at) =>
		Math.round(Number.parseInt(digits.slice(at, at + 2), 16) * 0.18 + 255 * 0.82)
			.toString(16)
			.padStart(2, '0'),
	);
	return `#${channels.join('')}`;
}

const look = computed(() => {
	if (THEME.includes(props.color)) {
		const token = props.color === 'default' ? 'foreground' : props.color;
		return {
			bar: { class: `bg-${token}`, style: undefined },
			ground: { class: `bg-${token}-20`, style: undefined },
		};
	}
	if (HEX.test(props.color)) {
		return {
			bar: { class: '', style: `background-color: ${props.color};` },
			ground: { class: '', style: `background-color: ${tint(props.color)};` },
		};
	}
	throw new Error(
		'NxEventChip: color must be a colour of the theme, as success, or a hex colour, as #0f766e — the build mixes its tint',
	);
});

const attrs = useAttrs();
const classes = computed(() =>
	twMerge(
		'mb-2 w-full',
		props.selected && 'border border-solid border-primary',
		attrs.class as string,
	),
);
const barClasses = computed(() =>
	[
		'w-1 text-[1px] leading-px',
		!props.continuesBefore && 'rounded-l',
		look.value.bar.class,
	]
		.filter(Boolean)
		.join(' '),
);
const groundClasses = computed(() =>
	[
		'px-1.5 align-middle',
		props.compact ? 'py-0.5' : 'py-1',
		!props.continuesAfter && 'rounded-r',
		look.value.ground.class,
	]
		.filter(Boolean)
		.join(' '),
);
</script>

<template>
  <table v-bind="{ ...attrs, class: undefined }" :class="classes" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td width="4" :class="barClasses" :style="look.bar.style"><span data-maizzle-html-only>&zwj;</span></td>
      <td :class="groundClasses" :style="look.ground.style">
        <!-- The ground (`bg-${token}-20`) keeps the same value in dark mode
             (see theme.css): the text stays un-flipped too. -->
        <p v-if="time && !allDay" class="m-0 text-[10px] font-medium leading-tight text-foreground">{{ time }}</p>
        <p :class="['m-0 font-medium leading-tight', compact ? 'text-[10px] text-muted-foreground' : 'text-xs text-foreground']">{{ title }}</p>
      </td>
    </tr>
  </table>
</template>
