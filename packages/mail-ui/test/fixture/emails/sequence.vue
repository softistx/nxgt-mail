<template>
  <NxLayout preheader="Your setup, step by step">
    <NxTypography variant="headline-small">Setup</NxTypography>
    <NxProgress :value="2" :max="3" />
    <NxProgress :value="0" />
    <NxProgress :value="100" />
    <NxSteps>
      <NxStepsItem title="Create your account">Done on 1 September.</NxStepsItem>
      <NxStepsItem title="Invite your team">Add the people who work with you.</NxStepsItem>
      <NxStepsItem title="Connect your bank" :index="7" />
    </NxSteps>
    <NxTimeline
      :items="[
        { id: 'a', title: 'Signed in', description: 'Firefox on Linux', timestampLabel: placeholder('time'), tone: 'success' },
        { id: 'b', title: 'Password changed', tone: 'warning' },
        { id: 'c', title: 'Account created' },
      ]"
    />
    <NxTimeline :items="[]" empty="No activity yet" />
    <NxTimeline :items="[]" />
  </NxLayout>
</template>
