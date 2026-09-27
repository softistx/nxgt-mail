<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs } from 'vue';
import {
	type Contact,
	type ContactType,
	sharedMessage,
} from './ui';

/**
 * material-vue's Contacts, read: its label over one tile per contact, its
 * `label` — else the words for its type — as the title and its value under
 * it. The title links to the contact where a mail client can follow it: an
 * e-mail address with `mailto:`, a phone or mobile number with `tel:`, and a
 * website to its value, which is then an absolute URL. A fax is not linked.
 *
 * The value is written as given, placeholder or not. Without any contact,
 * nothing is written.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{ data?: readonly Contact[] | null; label?: string }>(),
	{ data: () => [] },
);

/** The words for a type, and where a mail client can follow its value. */
function typeOf(type: ContactType): {
	key: string;
	fallback: string;
	href?: (value: string) => string;
} {
	switch (type) {
		case 'EMAIL':
			return { key: 'email', fallback: 'E-mail', href: (value) => `mailto:${value}` };
		case 'FAX':
			return { key: 'fax', fallback: 'Fax' };
		case 'MOBILE':
			return { key: 'mobile', fallback: 'Mobile', href: (value) => `tel:${value}` };
		case 'PHONE':
			return { key: 'phone', fallback: 'Phone', href: (value) => `tel:${value}` };
		case 'WEBSITE':
			return { key: 'website', fallback: 'Website', href: (value) => value };
		default:
			throw new Error(
				'NxContacts: type must be EMAIL, FAX, MOBILE, PHONE or WEBSITE',
			);
	}
}

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const heading = computed(
	() =>
		props.label ?? sharedMessage(globals, 'common.contacts.label', 'Contacts'),
);

const rows = computed(() =>
	(props.data ?? []).map((contact, index) => {
		const type = typeOf(contact.type);
		return {
			key: `${contact.type}-${index}`,
			title:
				contact.label ||
				sharedMessage(globals, `common.contacts.types.${type.key}`, type.fallback),
			value: contact.value,
			href: type.href?.(contact.value),
		};
	}),
);
const attrs = useAttrs();
const classes = computed(() => twMerge('mb-4', attrs.class as string));
</script>

<template>
  <div v-if="rows.length > 0" v-bind="{ ...attrs, class: undefined }" :class="classes">
    <NxExtendedLabel><slot name="label">{{ heading }}</slot></NxExtendedLabel>
    <NxListTile v-for="row in rows" :key="row.key" :title="row.title" :subtitle="row.value" :href="row.href" />
  </div>
</template>
