<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, provide, useAttrs, useSlots } from 'vue';
import { AVATAR_SIZE, slotComponents } from './ui';

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
const avatars = computed(() => slotComponents(slots.default?.()));
// As material-vue's: no `max`, or one under 1, shows them all.
const shown = computed(() =>
	props.max === undefined || props.max < 1
		? avatars.value
		: avatars.value.slice(0, props.max),
);
const rest = computed(() => avatars.value.length - shown.value.length);
// Read loosely: `t` exists only when @nxgt/mail-i18n is listed.
const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const moreLabel = computed(() =>
	typeof globals.t === 'function'
		? (globals.t('common.avatarGroup.more', { count: rest.value }) as string)
		: `${rest.value} more`,
);
const classes = computed(() => twMerge('mb-4', attrs.class as string));
</script>

<template>
  <div v-bind="{ ...attrs, class: undefined }" :class="classes"><span v-for="(avatar, index) in shown" :key="index" class="mr-1 inline-block rounded-full border-2 border-solid border-background align-middle"><component :is="avatar" /></span><span v-if="rest > 0" class="inline-block rounded-full border-2 border-solid border-background align-middle" :title="moreLabel" role="img" :aria-label="moreLabel"><NxAvatar><NxAvatarFallback>+{{ rest }}</NxAvatarFallback></NxAvatar></span></div>
</template>
