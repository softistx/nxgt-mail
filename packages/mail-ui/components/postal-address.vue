<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs } from 'vue';
import {
	localeOf,
	type PostalAddress,
	sharedMessage,
} from './ui';

/**
 * material-vue's PostalAddress, read: its label over one tile, the street as
 * the title and `postalCode locality · country` under it — or, without a
 * street, the first of the city and the country as the title and
 * `region · country` under it. Where material-vue falls back on the heading
 * as a title, and repeats a part that is already the title, an e-mail takes
 * the region and writes each part once: the heading is already over the tile.
 *
 * A two-letter `country` code is named in the template's locale (`FR` is
 * `France`, `Allemagne` in French); anything else, a placeholder included, is
 * written as given. Without any field, nothing is written.
 */
defineOptions({ inheritAttrs: false });

const props = defineProps<{ data?: PostalAddress | null; label?: string }>();

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const heading = computed(
	() =>
		props.label ?? sharedMessage(globals, 'common.postal-address', 'Address'),
);

/** `FR` in the template's locale; anything else as given. */
function countryName(country: string): string {
	if (!/^[A-Z]{2}$/.test(country)) return country;
	return (
		new Intl.DisplayNames([localeOf(globals)], { type: 'region' }).of(
			country,
		) ?? country
	);
}

const text = (value?: string | null) => value?.trim() ?? '';
const address = computed(() => {
	const data = props.data;
	const street = text(data?.street);
	const city = [text(data?.postalCode), text(data?.locality)]
		.filter(Boolean)
		.join(' ');
	const country = text(data?.country) && countryName(text(data?.country));
	const region = text(data?.region);
	const title = street || city || country || region;
	if (!title) return null;
	const subtitle = street
		? [city, country].filter(Boolean).join(' · ')
		: [region, country].filter((part) => part && part !== title).join(' · ');
	return { title, subtitle: subtitle || undefined };
});
const attrs = useAttrs();
const classes = computed(() => twMerge('mb-4', attrs.class as string));
</script>

<template>
  <div v-if="address" v-bind="{ ...attrs, class: undefined }" :class="classes">
    <NxExtendedLabel><slot name="label">{{ heading }}</slot></NxExtendedLabel>
    <NxListTile :title="address.title" :subtitle="address.subtitle" />
  </div>
</template>
