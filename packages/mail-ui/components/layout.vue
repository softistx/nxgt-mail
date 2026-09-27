<script setup lang="ts">
import { getCurrentInstance } from 'vue';
import { dirOf, useUi } from './ui';

/**
 * The page of an e-mail: the brand's header, the content on a card, and a
 * footer. The theme's tokens are in its `<style>`, so every component inside
 * uses them.
 */
const props = withDefaults(
	defineProps<{
		/** Default the template's locale from `@nxgt/mail-i18n`, else `en`. */
		lang?: string;
		/** The text a client shows beside the subject, before the e-mail is opened. */
		preheader?: string;
		/** The width of the card, in pixels. */
		width?: number;
	}>(),
	{ width: 600 },
);

if (typeof props.width !== 'number' || !Number.isFinite(props.width)) {
	throw new Error(
		'NxLayout: width must be a number known when the e-mail is built — a placeholder is filled only when it is sent',
	);
}

const { brand, css } = useUi('NxLayout');
// Read loosely: `t` and `locale` exist only when @nxgt/mail-i18n is listed.
const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const lang =
	props.lang ?? (typeof globals.locale === 'string' ? globals.locale : 'en');
const dir = dirOf(globals);
const style = `@import "@maizzle/tailwindcss";\n${css}`;
// With @nxgt/mail-i18n, the footer says why the e-mail came.
const why =
	typeof globals.t === 'function'
		? (globals.t('common.footer.why', { brand: brand.name }) as string)
		: null;
</script>

<template>
  <Html :lang="lang" :dir="dir">
    <Head>
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <style v-html="style"></style>
    </Head>
    <Body class="bg-paper nx-dark-bg-paper" :dir="dir">
      <Preheader v-if="preheader">{{ preheader }}</Preheader>
      <table class="w-full bg-paper nx-dark-bg-paper font-sans" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
        <tr>
          <td align="center" class="px-4 py-8">
            <Container :width="width">
            <table class="w-full" role="presentation" cellpadding="0" cellspacing="0" :dir="dir">
              <tr>
                <td class="pb-6 text-center">
                  <a v-if="brand.url" :href="brand.url" class="text-lg font-semibold text-foreground nx-dark-text-foreground no-underline">
                    <template v-if="brand.logo">
                      <img v-if="brand.logo.darkSrc" :src="brand.logo.src" :width="brand.logo.width ?? 120" :alt="brand.logo.alt ?? brand.name" class="max-w-full align-middle nx-light-only">
                      <img v-else :src="brand.logo.src" :width="brand.logo.width ?? 120" :alt="brand.logo.alt ?? brand.name" class="max-w-full align-middle">
                      <img v-if="brand.logo.darkSrc" :src="brand.logo.darkSrc" :width="brand.logo.width ?? 120" :alt="brand.logo.alt ?? brand.name" class="max-w-full align-middle nx-dark-only">
                    </template>
                    <template v-else>{{ brand.name }}</template>
                  </a>
                  <template v-else>
                    <template v-if="brand.logo">
                      <img v-if="brand.logo.darkSrc" :src="brand.logo.src" :width="brand.logo.width ?? 120" :alt="brand.logo.alt ?? brand.name" class="max-w-full align-middle nx-light-only">
                      <img v-else :src="brand.logo.src" :width="brand.logo.width ?? 120" :alt="brand.logo.alt ?? brand.name" class="max-w-full align-middle">
                      <img v-if="brand.logo.darkSrc" :src="brand.logo.darkSrc" :width="brand.logo.width ?? 120" :alt="brand.logo.alt ?? brand.name" class="max-w-full align-middle nx-dark-only">
                    </template>
                    <span v-else class="text-lg font-semibold text-foreground nx-dark-text-foreground">{{ brand.name }}</span>
                  </template>
                </td>
              </tr>
              <tr>
                <td class="rounded-xl border border-solid border-border nx-dark-border-border bg-card nx-dark-bg-card p-8 text-sm text-card-foreground nx-dark-text-card-foreground shadow-sm">
                  <slot />
                </td>
              </tr>
              <tr>
                <td class="px-6 pt-6 text-center text-xs text-muted-foreground">
                  <slot name="footer">
                    <p v-if="why" class="m-0 mb-2">{{ why }}</p>
                  </slot>
                  <p class="m-0">
                    <a v-if="brand.url" :href="brand.url" class="text-muted-foreground underline">{{ brand.name }}</a>
                    <template v-else>{{ brand.name }}</template>
                  </p>
                </td>
              </tr>
            </table>
            </Container>
          </td>
        </tr>
      </table>
    </Body>
  </Html>
</template>
