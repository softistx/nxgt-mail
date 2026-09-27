<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs } from 'vue';
import { type OpeningHour, sharedMessage } from './ui';

/**
 * material-vue's OpeningHours, read: its label over one tile per day, from
 * Sunday (`0`) to Saturday (`6`), the day as the title and `09:00 – 18:00`
 * under it — `—` for a time not given — or the words for a closed day. The
 * times are written as given. Without any day, nothing is written.
 *
 * A `dayOfWeek` outside `0`–`6` **throws**: it names no day.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{ data?: readonly OpeningHour[] | null; label?: string }>(),
	{ data: () => [] },
);

const DAYS = [
	['sunday', 'Sunday'],
	['monday', 'Monday'],
	['tuesday', 'Tuesday'],
	['wednesday', 'Wednesday'],
	['thursday', 'Thursday'],
	['friday', 'Friday'],
	['saturday', 'Saturday'],
] as const;

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const heading = computed(
	() =>
		props.label ??
		sharedMessage(globals, 'common.opening-hours.label', 'Opening hours'),
);

function dayTitle(day: number): string {
	const entry = Number.isInteger(day) ? DAYS[day] : undefined;
	if (entry === undefined) {
		throw new Error(
			'NxOpeningHours: dayOfWeek must be a whole number from 0 (Sunday) to 6 (Saturday)',
		);
	}
	const [key, fallback] = entry;
	return sharedMessage(globals, `common.opening-hours.days.${key}`, fallback);
}

const rows = computed(() =>
	(props.data ?? [])
		.map((item, index) => ({ item, index }))
		.sort((a, b) => a.item.dayOfWeek - b.item.dayOfWeek)
		.map(({ item, index }) => ({
			key: `${item.dayOfWeek}-${index}`,
			title: dayTitle(item.dayOfWeek),
			subtitle: item.isClosed
				? sharedMessage(globals, 'common.opening-hours.closed', 'Closed all day')
				: `${item.openTime ?? '—'} – ${item.closeTime ?? '—'}`,
		})),
);
const attrs = useAttrs();
const classes = computed(() => twMerge('mb-4', attrs.class as string));
</script>

<template>
  <div v-if="rows.length > 0" v-bind="{ ...attrs, class: undefined }" :class="classes">
    <NxExtendedLabel><slot name="label">{{ heading }}</slot></NxExtendedLabel>
    <NxListTile v-for="row in rows" :key="row.key" :title="row.title" :subtitle="row.subtitle" />
  </div>
</template>
