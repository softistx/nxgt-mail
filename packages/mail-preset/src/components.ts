/**
 * The components of `nxgtPreset`, as single-file component sources by file
 * name. Each wraps one of Maizzle's — which carry the Outlook fallbacks — and
 * styles it with the preset's tokens. Their names are their own: a preset may
 * not replace a component Maizzle ships.
 */

const escapeAttribute = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

export interface Brand {
	/** An `http:` or `https:` URL, shown at the top of every e-mail. */
	readonly logo: string | null;
	/** The logo's alternative text. */
	readonly name: string;
}

/**
 * The layout of a transactional e-mail: the logo, a card holding the
 * template, and a footer — `common.footer.why` unless the template fills the
 * `footer` slot. It imports Maizzle's Tailwind and the presets' `theme.css`
 * in one `<style>`, so the tokens reach the utilities.
 */
function transactionalLayout(brand: Brand): string {
	const logo =
		brand.logo === null
			? ''
			: `\n          <Img src="${escapeAttribute(brand.logo)}" alt="${escapeAttribute(brand.name)}" width="120" class="mb-6" />`;
	return `<script setup>
defineProps({ preheader: { type: String, default: null } });
</script>

<template>
  <Html :lang="lang">
    <Head>
      <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <style>
        @import "@maizzle/tailwindcss";
        @import "./theme.css";

        img {
          @apply max-w-full align-middle;
        }
      </style>
    </Head>
    <Body class="m-0 p-0 w-full bg-canvas [word-break:break-word]">
      <Preheader v-if="preheader">{{ preheader }}</Preheader>
      <div class="bg-canvas px-4 py-8 font-sans text-base text-foreground">
        <Container class="rounded-card bg-surface p-8">${logo}
          <slot />
        </Container>
        <Container class="px-8 pt-6">
          <Text class="m-0 text-center text-xs text-muted"><slot name="footer">{{ t('common.footer.why') }}</slot></Text>
        </Container>
      </div>
    </Body>
  </Html>
</template>
`;
}

const heading = `<script setup>
defineProps({ level: { type: [String, Number], default: 1 } });
</script>

<template>
  <Heading :level="level" class="mb-4 font-sans text-2xl font-bold leading-8 text-foreground"><slot /></Heading>
</template>
`;

const text = `<template>
  <Text class="mt-0 mb-4 text-base leading-6 text-foreground"><slot /></Text>
</template>
`;

const button = `<script setup>
defineProps({ href: { type: String, required: true } });
</script>

<template>
  <Button :href="href" class="rounded-button bg-primary font-semibold text-on-primary"><slot /></Button>
</template>
`;

const link = `<script setup>
defineProps({ href: { type: String, required: true } });
</script>

<template>
  <Link :href="href" class="text-primary underline"><slot /></Link>
</template>
`;

const divider = `<template>
  <Hr class="my-6 bg-border" />
</template>
`;

const spacer = `<template>
  <Spacer class="h-6" />
</template>
`;

// A table rather than a div: Outlook on Windows paints no background on a div.
const code = `<template>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="my-4">
    <tr>
      <td class="rounded-card bg-code px-6 py-4 text-center font-mono text-3xl font-bold tracking-[0.3em] text-foreground"><slot /></td>
    </tr>
  </table>
</template>
`;

export function components(brand: Brand): Record<string, string> {
	return {
		'TransactionalLayout.vue': transactionalLayout(brand),
		'MailHeading.vue': heading,
		'MailText.vue': text,
		'MailButton.vue': button,
		'MailLink.vue': link,
		'MailDivider.vue': divider,
		'MailSpacer.vue': spacer,
		'MailCode.vue': code,
	};
}
