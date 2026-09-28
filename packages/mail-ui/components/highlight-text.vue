<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';
import { hasPlaceholder, splitMatch } from './ui';

/**
 * material-vue's HighlightText: `text` with each case-insensitive match of
 * `query` marked on 20% of the primary colour. The matches are found when the
 * e-mail is built: a placeholder in `text` is written whole and never marked,
 * and a `query` holding one **throws**, since it is filled only when the
 * e-mail is sent.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{ text: string; query?: string }>(), {
	query: '',
});

if (hasPlaceholder(props.query)) {
	throw new Error(
		'NxHighlightText: query must be text known when the e-mail is built — a placeholder is filled only when it is sent',
	);
}

const attrs = useAttrs();
const parts = computed(() => splitMatch(props.text, props.query));
const classes = computed(() => twMerge('', attrs.class as string));
</script>

<template>
  <!-- `text-inherit`: whatever colour surrounds it, flipped or not by its own
       rule. `bg-primary-20` is mixed toward the mode's own background (see
       theme.css), so it stays close in luminance to it either way — a text
       colour already readable against that background reads the same over
       this tint too. -->
  <span v-bind="{ ...attrs, class: undefined }" :class="classes || undefined"><template v-for="(part, index) in parts" :key="index"><mark v-if="part.match" class="rounded bg-primary-20 nx-dark-bg-primary-20 text-inherit">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></span>
</template>
