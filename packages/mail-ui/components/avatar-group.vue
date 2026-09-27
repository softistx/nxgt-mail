<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, Fragment, provide, useAttrs, useSlots, type VNode } from 'vue';
import { AVATAR_SIZE } from './ui';

/**
 * material-vue's AvatarGroup: its `NxAvatar`s in a row, each ringed with the
 * background, and past `max`, one more reading `+N`. They sit side by side
 * rather than overlapping: Gmail drops the negative margin that stacks them.
 */
type Size = 'sm' | 'md' | 'lg';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{ max?: number; size?: Size }>(), {
	size: 'md',
});

const SIZE: Record<Size, number> = { sm: 24, md: 32, lg: 40 };

const attrs = useAttrs();
const slots = useSlots();
provide(AVATAR_SIZE, SIZE[props.size]);
/** The slot's components, out of any `v-for` fragment, without its text or comments. */
function components(nodes: VNode[]): VNode[] {
	return nodes.flatMap((node) =>
		node.type === Fragment
			? components(node.children as VNode[])
			: typeof node.type === 'symbol'
				? []
				: [node],
	);
}
const avatars = computed(() => components(slots.default?.() ?? []));
const shown = computed(() =>
	props.max === undefined ? avatars.value : avatars.value.slice(0, props.max),
);
const rest = computed(() => avatars.value.length - shown.value.length);
const classes = computed(() => twMerge('mb-4', attrs.class as string));
</script>

<template>
  <div v-bind="{ ...attrs, class: undefined }" :class="classes"><span v-for="(avatar, index) in shown" :key="index" class="mr-1 inline-block rounded-full border-2 border-solid border-background align-middle"><component :is="avatar" /></span><span v-if="rest > 0" class="inline-block rounded-full border-2 border-solid border-background align-middle" :aria-label="`+${rest} more`"><NxAvatar><NxAvatarFallback>+{{ rest }}</NxAvatarFallback></NxAvatar></span></div>
</template>
