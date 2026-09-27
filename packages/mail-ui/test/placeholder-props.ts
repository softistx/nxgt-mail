/**
 * Every prop of every `@nxgt/mail-ui` component, read from its own
 * `defineProps<{ … }>()` — so a new component, or a new prop on an existing
 * one, has no entry here and fails `build.spec.ts`'s generic placeholder
 * spec until it is given one.
 *
 * A prop takes `placeholder('name')` — `{{ name }}`, filled only when the
 * e-mail is sent — and the build must do one of two things with it:
 *
 * - `fails`: the prop is a value the build itself computes (a count, a
 *   colour it mixes, a size it lays out in pixels, a share it draws as a
 *   bar…) and a placeholder there throws `message`, naming the component.
 * - `passes`: the prop is plain text or a URL, written as given; the build
 *   succeeds and `{{ name }}` reaches the output unchanged.
 * - `skip`: the prop is not a single value a placeholder could hold — a
 *   flag or a token chosen when the e-mail is built, or a whole array,
 *   object or function — so it is out of this spec's scope, `reason` says
 *   why, and no case is generated for it.
 */

export type Expectation =
	| { readonly kind: 'fails'; readonly message: string }
	| { readonly kind: 'passes' }
	| { readonly kind: 'skip'; readonly reason: string };

export interface PropEntry {
	/**
	 * The attribute — its own literal, valid value — used whenever this prop
	 * is not the one under test, so the rest of the component renders
	 * normally. `''` when the prop is optional and leaving it out is safe.
	 */
	readonly baseline: string;
	readonly expect: Expectation;
}

const BUILT: (name: string) => Expectation = (name) => ({
	kind: 'fails',
	message: `${name} must be a number known when the e-mail is built — a placeholder is filled only when it is sent`,
});

const passes: Expectation = { kind: 'passes' };
const flag: Expectation = {
	kind: 'skip',
	reason:
		'a flag chosen when the e-mail is built, never a value known only at send time',
};
const token: Expectation = {
	kind: 'skip',
	reason: 'selects a style token, never a value known only at send time',
};
const array: Expectation = {
	kind: 'skip',
	reason: 'an array of its own objects — not a single placeholder value',
};
const object: Expectation = {
	kind: 'skip',
	reason: 'an object of its own fields — not a single placeholder value',
};
const fn: Expectation = {
	kind: 'skip',
	reason: 'a function — not a value a placeholder can hold',
};

const prop = (baseline: string, expect: Expectation): PropEntry => ({
	baseline,
	expect,
});
const pass = (baseline = ''): PropEntry => prop(baseline, passes);
const skip = (expect: Expectation, baseline = ''): PropEntry =>
	prop(baseline, expect);

/** Every component's props, by its tag (`NxRating`, `NxButton`…). */
export const TABLE: Readonly<
	Record<string, Readonly<Record<string, PropEntry>>>
> = {
	NxActionCard: {
		active: skip(flag),
		variant: skip(token),
		// href's anchor sits inside `NxCardTitle v-if="title"`.
		title: pass('title="Card"'),
		description: pass(),
		withIndicator: skip(flag),
		href: pass(),
	},
	NxAlert: {
		variant: skip(token),
		title: pass(),
		description: pass(),
	},
	NxAttributes: {
		// A row must exist for `label`'s heading to render at all.
		data: skip(
			array,
			`:data="[{ name: 'room', label: 'Room', defaultValue: 'Lovelace' }]"`,
		),
		values: skip(object),
		label: pass(),
	},
	NxAvatarGroup: {
		max: prop('', BUILT('NxAvatarGroup: max')),
		size: skip(token),
	},
	NxAvatarImage: {
		src: pass('src="https://acme.example/a.png"'),
		alt: pass(),
	},
	NxAvatar: {
		size: prop('', BUILT('NxAvatar: size')),
	},
	NxBadge: {
		variant: skip(token),
	},
	NxBanner: {
		tone: skip(token),
		title: pass(),
		description: pass(),
	},
	NxBreakdownCard: {
		label: pass('label="Breakdown"'),
		items: skip(array, `:items="[{ label: 'A', percent: 50 }]"`),
	},
	NxCardHeader: {
		title: pass(),
		description: pass(),
	},
	NxChip: {
		label: pass(),
		variant: skip(token),
		color: skip(token),
		active: skip(flag),
	},
	NxCompareCard: {
		label: pass('label="Metric"'),
		current: skip(object, `:current="{ value: '1' }"`),
		previous: skip(object, `:previous="{ value: '2' }"`),
		delta: pass(),
	},
	NxContacts: {
		// A row must exist for `label`'s heading to render at all.
		data: skip(
			array,
			`:data="[{ type: 'EMAIL', value: 'hello@acme.example' }]"`,
		),
		label: pass(),
	},
	NxCountBadge: {
		count: prop(':count="3"', BUILT('NxCountBadge: count')),
		max: prop('', BUILT('NxCountBadge: max')),
		variant: skip(token),
	},
	NxDescription: {
		label: pass('label="Label"'),
		// A value must be given — `0` included — for anything to render.
		value: pass('value="Sample"'),
	},
	NxEntityHeader: {
		title: pass('title="Status"'),
		metadata: skip(array),
	},
	NxEventChip: {
		title: pass('title="Call"'),
		time: pass(),
		color: prop('', {
			kind: 'fails',
			message:
				'NxEventChip: color must be a colour of the theme, as success, or a hex colour, as #0f766e — the build mixes its tint',
		}),
		allDay: skip(flag),
		compact: skip(flag),
		selected: skip(flag),
		continuesBefore: skip(flag),
		continuesAfter: skip(flag),
	},
	NxExtendedLabel: {
		variant: skip(token),
		indicatorClass: skip({
			kind: 'skip',
			reason:
				'a CSS class override chosen when the e-mail is built, never a value known only at send time',
		}),
	},
	NxFigure: {
		// alt's <Img> only renders `v-if="src"`.
		src: pass('src="https://acme.example/photo.png"'),
		alt: pass(),
		caption: pass(),
	},
	NxFileList: {
		// `empty` only shows with no files.
		items: skip(array, ':items="[]"'),
		empty: pass(),
	},
	NxGoalCard: {
		label: pass('label="Goal"'),
		value: prop(':value="5"', BUILT('NxProgress: modelValue')),
		target: prop(':target="10"', BUILT('NxProgress: max')),
		unit: pass(),
	},
	NxHero: {
		eyebrow: pass(),
		title: pass('title="Welcome"'),
		description: pass(),
	},
	NxHighlightText: {
		text: pass('text="Acme invoices"'),
		query: prop('', {
			kind: 'fails',
			message:
				'NxHighlightText: query must be text known when the e-mail is built — a placeholder is filled only when it is sent',
		}),
	},
	NxIconButton: {
		href: pass('href="https://acme.example"'),
		icon: prop('', {
			kind: 'fails',
			message:
				'NxIconButton: icon must be known when the e-mail is built — a placeholder is filled only when it is sent',
		}),
		variant: skip(token),
		color: skip(token),
		tooltip: pass(),
	},
	NxLayout: {
		lang: pass(),
		preheader: pass(),
		width: prop('', BUILT('NxLayout: width')),
	},
	NxLinkButton: {
		to: pass('to="https://acme.example"'),
		variant: skip(token),
		color: skip(token),
		size: skip(token),
		align: skip(token),
	},
	NxLink: {
		href: pass('href="https://acme.example"'),
	},
	NxListTile: {
		title: pass('title="Title"'),
		subtitle: pass(),
		href: pass(),
		selected: skip(flag),
		disabled: skip(flag),
		size: skip(token),
	},
	NxButton: {
		href: pass('href="https://acme.example"'),
		variant: skip(token),
		color: skip(token),
		size: skip(token),
		align: skip(token),
	},
	NxSpacer: {
		size: skip(token),
	},
	NxOpeningHours: {
		// A row must exist for `label`'s heading to render at all.
		data: skip(
			array,
			`:data="[{ dayOfWeek: 1, openTime: '09:00', closeTime: '18:00' }]"`,
		),
		label: pass(),
	},
	NxPostalAddress: {
		// A field must exist for `label`'s heading to render at all.
		data: skip(object, `:data="{ street: '12 rue de la Paix' }"`),
		label: pass(),
	},
	NxProgress: {
		modelValue: prop('', BUILT('NxProgress: modelValue')),
		max: prop('', BUILT('NxProgress: max')),
		height: prop('', BUILT('NxProgress: height')),
	},
	NxRating: {
		modelValue: prop('', BUILT('NxRating: modelValue')),
		max: prop('', BUILT('NxRating: max')),
		color: skip(token),
		label: pass(),
		helperText: pass(),
		href: skip(fn),
	},
	NxRatioCard: {
		label: pass('label="Ratio"'),
		left: skip(object, `:left="{ label: 'A', value: '1' }"`),
		right: skip(object, `:right="{ label: 'B', value: '2' }"`),
		percent: prop(':percent="50"', BUILT('NxProgress: modelValue')),
	},
	NxSeeAlso: {
		items: skip(
			array,
			`:items="[{ title: 'Team', href: 'https://acme.example/team' }]"`,
		),
		label: pass(),
	},
	NxStatCard: {
		label: pass('label="Metric"'),
		value: pass(),
		hint: pass(),
		delta: pass(),
		deltaTone: skip(token),
	},
	NxStatusIndicator: {
		tone: skip(token),
	},
	NxStepsItem: {
		title: pass(),
		index: pass(),
		last: skip(flag),
	},
	NxSummaryData: {
		data: skip(array),
		inline: skip(flag),
		showEmpty: skip(flag),
	},
	NxTableEmpty: {
		colspan: pass(),
	},
	NxTimeline: {
		// `empty` only shows with no events.
		items: skip(array, ':items="[]"'),
		empty: pass(),
	},
	NxTypography: {
		variant: skip(token),
		as: skip({
			kind: 'skip',
			reason: 'selects the HTML tag, never a value known only at send time',
		}),
	},
};

/** `action-card.vue` → `NxActionCard`; `nx-button.vue` stays `NxButton`. */
export function tagOf(file: string): string {
	const base = file.replace(/\.vue$/, '').replace(/^nx-/, '');
	const pascal = base
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
	return `Nx${pascal}`;
}

/**
 * The top-level prop names of a component's `defineProps<{ … }>()`, read
 * from its source with brace-depth tracking, so a nested object type's own
 * fields (`current: { value: string }`) are not read as props of their own.
 */
export function propsOf(source: string): readonly string[] {
	const opens = /defineProps<\{/.exec(source);
	if (!opens) return [];
	const start = opens.index + opens[0].length - 1;
	let depth = 0;
	let end = -1;
	for (let i = start; i < source.length; i += 1) {
		if (source[i] === '{') depth += 1;
		else if (source[i] === '}') {
			depth -= 1;
			if (depth === 0) {
				end = i;
				break;
			}
		}
	}
	if (end < 0) return [];
	const body = source.slice(start + 1, end);
	const names: string[] = [];
	let brace = 0;
	let current = '';
	const flush = () => {
		const trimmed = current.trim();
		current = '';
		if (!trimmed) return;
		const match = /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\??\s*:/.exec(trimmed);
		const name = match?.[1];
		if (name) names.push(name);
	};
	for (const char of body) {
		if (char === '{') brace += 1;
		if (char === '}') brace -= 1;
		if ((char === ';' || char === '\n') && brace === 0) {
			flush();
			continue;
		}
		current += char;
	}
	flush();
	return names;
}

/** `modelValue` → `model-value`, as the fixtures bind it. */
export const kebab = (name: string): string =>
	name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** A `placeholder()` name unique to this component and prop: `avatarGroupMax`. */
export function placeholderName(tag: string, name: string): string {
	const base = tag.slice(2); // drop `Nx`
	return (
		base.charAt(0).toLowerCase() +
		base.slice(1) +
		name.charAt(0).toUpperCase() +
		name.slice(1)
	);
}

/** Every other prop of `tag`'s own baseline, `prop` left out. */
function attrsExcept(tag: string, prop: string): string {
	return Object.entries(TABLE[tag] ?? {})
		.filter(([name, entry]) => name !== prop && entry.baseline !== '')
		.map(([, entry]) => entry.baseline)
		.join(' ');
}

/** One self-closing instance of `tag` with `propName` bound to its `placeholder()`. */
export function instanceOf(
	tag: string,
	propName: string,
): { readonly markup: string; readonly name: string } {
	const name = placeholderName(tag, propName);
	const attr = `:${kebab(propName)}="placeholder('${name}')"`;
	return { markup: `<${tag} ${attrsExcept(tag, propName)} ${attr} />`, name };
}
