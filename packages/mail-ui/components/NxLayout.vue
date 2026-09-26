<script setup lang="ts">
import { getCurrentInstance } from 'vue';
import { useUi } from './ui';

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

const { brand, css } = useUi('NxLayout');
// Read loosely: `t` and `locale` exist only when @nxgt/mail-i18n is listed.
const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const lang =
	props.lang ?? (typeof globals.locale === 'string' ? globals.locale : 'en');
const style = `@import "@maizzle/tailwindcss";\n${css}`;
// With @nxgt/mail-i18n, the footer says why the e-mail came.
const why =
	typeof globals.t === 'function'
		? (globals.t('common.footer.why', { brand: brand.name }) as string)
		: null;
</script>

<template>
  <Html :lang="lang">
    <Head>
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <style v-html="style"></style>
    </Head>
    <Body class="bg-paper">
      <Preheader v-if="preheader">{{ preheader }}</Preheader>
      <table class="w-full bg-paper font-sans" role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" class="px-4 py-8">
            <Container :width="width">
            <table class="w-full" role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td class="pb-6 text-center">
                  <a v-if="brand.url" :href="brand.url" class="text-lg font-semibold text-foreground no-underline">
                    <img v-if="brand.logo" :src="brand.logo.src" :width="brand.logo.width ?? 120" :alt="brand.logo.alt ?? brand.name" class="max-w-full align-middle">
                    <template v-else>{{ brand.name }}</template>
                  </a>
                  <template v-else>
                    <img v-if="brand.logo" :src="brand.logo.src" :width="brand.logo.width ?? 120" :alt="brand.logo.alt ?? brand.name" class="max-w-full align-middle">
                    <span v-else class="text-lg font-semibold text-foreground">{{ brand.name }}</span>
                  </template>
                </td>
              </tr>
              <tr>
                <td class="rounded-xl border border-solid border-border bg-card p-8 text-sm text-card-foreground shadow-sm">
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
