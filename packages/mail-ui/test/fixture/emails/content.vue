<template>
  <NxLayout preheader="Your inbox at Acme">
    <NxExtendedLabel>
      Your inbox
      <template #trailing><NxCountBadge :count="3"><NxLink href="https://acme.example/inbox">Unread</NxLink></NxCountBadge></template>
    </NxExtendedLabel>
    <NxTypography>Results for <NxHighlightText text="Acme invoices for {{ name }}, and acme receipts" query="acme" /></NxTypography>
    <NxTypography>Press <NxKbd>Ctrl</NxKbd> + <NxKbd>K</NxKbd> to search.</NxTypography>
    <NxTypography>Mentions <NxCountBadge :count="120" variant="info">in threads</NxCountBadge> and <NxCountBadge :count="0">none</NxCountBadge></NxTypography>
    <NxSpacer size="lg" />
    <NxActionCard title="Weekly digest" description="One e-mail each Monday." active href="https://acme.example/digest">
      <template #icon>&#128240;</template>
    </NxActionCard>
    <NxActionCard title="Instant alerts" description="An e-mail for every mention." :with-indicator="false" />
    <NxActionCard variant="md" title="Mobile" description="Push to your phone.">
      <template #icon>&#128241;</template>
    </NxActionCard>
    <NxFigure src="https://acme.example/chart.png" alt="Messages per day" caption="Your messages this week" />
    <NxButtonGroup>
      <NxButton href="https://acme.example/inbox" data-state="active">Inbox</NxButton>
      <NxButton href="https://acme.example/archive">Archive</NxButton>
      <NxIconButton href="https://acme.example/starred" icon="&#9733;" tooltip="Starred" />
      <NxIconButton href="https://acme.example/settings" icon="https://acme.example/gear.png" aria-label="Settings" variant="outlined" color="default" />
    </NxButtonGroup>
    <NxIconButton href="https://acme.example/help" icon="?" tooltip="Help" variant="tonal" />
    <NxSpacer />
    <NxLinkButton to="https://acme.example/preferences">Manage your preferences</NxLinkButton>
    <NxLinkButton to="https://acme.example/unsubscribe" variant="outlined" color="error" size="sm">Unsubscribe</NxLinkButton>
  </NxLayout>
</template>
