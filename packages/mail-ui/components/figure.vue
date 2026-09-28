<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, useAttrs } from 'vue';

/**
 * material-vue's Figure: an image in a rounded, bordered frame, and its
 * caption centred under it. Given `src`, the image is Maizzle's `<Img>`, at
 * the width of the frame; the default slot takes any other content in its
 * place, as material-vue's does. The frame's border and corners are the
 * image's own: a mail client does not clip an image to a rounded box, and
 * material-vue's faint ground behind it shows nowhere once the image fills it.
 */
defineOptions({ inheritAttrs: false });

defineProps<{
	src?: string;
	/**
	 * Shown instead of `src` under `prefers-color-scheme: dark` and for
	 * Outlook.com/Outlook's own dark mode — a dark image on a dark background
	 * otherwise disappears. Absent, `src` shows in both modes.
	 */
	darkSrc?: string;
	alt?: string;
	caption?: string;
}>();

const attrs = useAttrs();
const classes = computed(() => twMerge('mb-4 w-full', attrs.class as string));
</script>

<template>
  <table v-bind="{ ...attrs, class: undefined }" :class="classes" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <slot>
          <template v-if="src">
            <Img v-if="darkSrc" :src="src" :alt="alt ?? ''" class="block h-auto w-full rounded-xl border border-solid border-border nx-dark-border-border nx-light-only" />
            <Img v-else :src="src" :alt="alt ?? ''" class="block h-auto w-full rounded-xl border border-solid border-border nx-dark-border-border" />
            <Img v-if="darkSrc" :src="darkSrc" :alt="alt ?? ''" class="block h-auto w-full rounded-xl border border-solid border-border nx-dark-border-border nx-dark-only" />
          </template>
        </slot>
      </td>
    </tr>
    <tr v-if="caption">
      <td class="px-1 pt-3 text-center text-sm text-muted-foreground nx-dark-text-muted-foreground">{{ caption }}</td>
    </tr>
  </table>
</template>
