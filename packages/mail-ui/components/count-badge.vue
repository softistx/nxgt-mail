<script setup lang="ts">
import { computed, getCurrentInstance, useAttrs } from 'vue';
import { formatCount, sharedMessage } from './ui';

/**
 * material-vue's CountBadge: what it counts, then a small `NxBadge` with the
 * count, `99+` past `max`, and nothing at 0. The badge follows the content
 * on its line: a mail client does not position it over a corner. A reader
 * hears the shared `common.countBadge.label` in its place, and the plain-text
 * version reads the count in brackets: `Unread (3)`.
 *
 * The count is written when the e-mail is built: a value that is not a
 * number — a placeholder, filled only when it is sent — **throws**.
 */
type Variant =
	| 'default'
	| 'secondary'
	| 'destructive'
	| 'error'
	| 'success'
	| 'info'
	| 'warning'
	| 'outline'
	| 'outlined';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{ count: number; max?: number; variant?: Variant }>(),
	{ max: 99, variant: 'error' },
);

for (const [name, value] of [
	['count', props.count],
	['max', props.max],
] as const) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new Error(
			`NxCountBadge: ${name} must be a number known when the e-mail is built — a placeholder is filled only when it is sent`,
		);
	}
}

const attrs = useAttrs();
const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const shown = computed(() => formatCount(props.count, props.max));
const label = computed(() =>
	sharedMessage(
		globals,
		'common.countBadge.label',
		`${props.count} notification${props.count === 1 ? '' : 's'}`,
		{ count: props.count },
	),
);
</script>

<template>
  <span v-bind="attrs"><slot /><template v-if="count > 0"><span data-maizzle-html-only><NxBadge :variant="variant" class="ml-1 min-w-4 px-1 py-0 text-center align-top text-[10px] leading-4" role="img" :title="label" :aria-label="label">{{ shown }}</NxBadge></span><span data-maizzle-plaintext-only> ({{ shown }})</span></template></span>
</template>
