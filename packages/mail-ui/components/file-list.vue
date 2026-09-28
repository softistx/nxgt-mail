<script setup lang="ts">
import { twMerge } from '@maizzle/framework';
import { computed, getCurrentInstance, useAttrs } from 'vue';
import { type FileListItem, localeOf, sharedMessage } from './ui';

/**
 * material-vue's FileList: one tile per file, its name as the title and its
 * size under it, with a "Download" link on the right for a file with an
 * `href`, where material-vue has its download button. A `disabled` file's
 * name is muted, and it has no link. An
 * e-mail runs no script, so there is no remove button and no loading state.
 *
 * Where material-vue draws an icon for the type, the tile shows the file's
 * extension (`PDF`), from its name, else from its MIME `type`. A size in bytes
 * is written as material-vue's `formatFileSize` does, in the template's
 * locale (`1.5 MB`, `1,5 Mo`); a string, as a placeholder, is written as
 * given.
 */
defineOptions({ inheritAttrs: false });

const props = defineProps<{
	items: readonly FileListItem[];
	empty?: string;
}>();

const UNITS = ['b', 'kb', 'mb', 'gb'] as const;
const FALLBACK_UNITS = { b: 'B', kb: 'KB', mb: 'MB', gb: 'GB' } as const;

const globals: Record<string, unknown> =
	getCurrentInstance()?.appContext.config.globalProperties ?? {};
const emptyText = computed(
	() => props.empty ?? sharedMessage(globals, 'common.file-list.empty', 'No files'),
);
const download = computed(() =>
	sharedMessage(globals, 'common.file-list.download', 'Download'),
);

/** material-vue's `formatFileSize`, in the template's locale. */
function sizeOf(size: number | string | undefined): string | undefined {
	if (typeof size === 'string') return size || undefined;
	if (size === undefined || size < 0 || !Number.isFinite(size)) return undefined;
	const exponent =
		size === 0
			? 0
			: Math.min(Math.floor(Math.log(size) / Math.log(1024)), UNITS.length - 1);
	const unit = UNITS[exponent] ?? 'b';
	const value = new Intl.NumberFormat(localeOf(globals), {
		minimumFractionDigits: exponent === 0 ? 0 : 1,
		maximumFractionDigits: exponent === 0 ? 0 : 1,
		useGrouping: false,
	}).format(size / 1024 ** exponent);
	return sharedMessage(
		globals,
		'common.file-list.size',
		`${value} ${FALLBACK_UNITS[unit]}`,
		{ size: value, unit },
	);
}

/** `PDF` from `report.pdf`, else from `application/pdf`; nothing past 4 letters. */
function extensionOf(item: FileListItem): string | undefined {
	const fromName = /\.([a-z0-9]{1,4})$/i.exec(item.name)?.[1];
	const fromType = /^[a-z]+\/([a-z0-9]{1,4})$/i.exec(item.type ?? '')?.[1];
	return (fromName ?? fromType)?.toUpperCase();
}

const rows = computed(() =>
	props.items.map((item) => ({
		item,
		size: sizeOf(item.size),
		extension: extensionOf(item),
		href: item.disabled ? undefined : item.href,
	})),
);
const attrs = useAttrs();
const classes = computed(() => twMerge('mb-4 w-full', attrs.class as string));
const emptyClasses = computed(() =>
	twMerge(
		'mb-4 py-6 text-center text-sm text-muted-foreground nx-dark-text-muted-foreground',
		attrs.class as string,
	),
);
</script>

<template>
  <div v-if="rows.length > 0" v-bind="{ ...attrs, class: undefined }" :class="classes">
    <template v-for="row in rows" :key="row.item.id">
      <NxListTile :title="row.item.name" :subtitle="row.size" :disabled="row.item.disabled">
        <template v-if="row.extension" #leading>
          <span data-maizzle-html-only><span class="block h-9 w-9 rounded-full bg-primary-15 nx-dark-bg-primary-15 text-center text-[10px] font-semibold leading-9 text-primary nx-dark-text-primary">{{ row.extension }}</span></span>
        </template>
        <template v-if="row.href" #trailing>
          <a :href="row.href" class="text-sm font-medium text-primary nx-dark-text-primary no-underline">{{ download }}</a>
        </template>
      </NxListTile>
    </template>
  </div>
  <p v-else v-bind="{ ...attrs, class: undefined }" :class="emptyClasses"><slot name="empty">{{ emptyText }}</slot></p>
</template>
