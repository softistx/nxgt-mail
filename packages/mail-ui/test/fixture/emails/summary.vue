<template>
  <NxLayout preheader="Your month at Acme">
    <NxHero eyebrow="September" title="Your month at Acme" description="What your team did, and what is next.">
      <template #actions><NxButton href="https://acme.example/report">Open the report</NxButton></template>
    </NxHero>
    <NxEntityHeader title="Acme Labs" :metadata="[{ label: 'Plan', value: 'Pro' }, { label: 'Seats', value: 12 }]">
      <template #icon>&#127970;</template>
      <template #status><NxBadge variant="success">Active</NxBadge></template>
      <template #actions><NxLink href="https://acme.example/settings">Settings</NxLink></template>
    </NxEntityHeader>
    <NxStatCard label="Revenue" value="$12,400" :delta="12" hint="vs last month" />
    <NxStatCard label="Refunds" value="3" :delta="-2" delta-tone="up" />
    <NxStatCard label="Churn" value="0.4%" delta="flat" />
    <NxStatCard label="Tickets" value="9" :delta="-5" />
    <NxStatCard label="Incidents" value="0" :delta="0" />
    <NxGoalCard label="Signed contracts" :value="18" :target="24" />
    <NxRatioCard label="Plans" :left="{ label: 'Pro', value: '72%' }" :right="{ label: 'Free', value: '28%' }" :percent="72" />
    <NxCompareCard label="Sign-ups" :current="{ value: '340' }" :previous="{ value: '298' }" :delta="42" />
    <NxBreakdownCard label="Traffic" :items="[{ label: 'Search', percent: 54.4 }, { label: 'Direct', value: '1,204', percent: 30 }, { label: 'Social', percent: 15.6 }]" />
    <NxSeeAlso :items="[{ title: 'Billing', href: 'https://acme.example/billing' }, { id: 'team', title: 'Your team', href: 'https://acme.example/team' }]" />
    <NxSeeAlso :items="[]" />
  </NxLayout>
</template>
