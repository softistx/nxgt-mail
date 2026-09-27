<template>
  <NxLayout preheader="Your setup, step by step">
    <NxTypography variant="headline-small">Setup</NxTypography>
    <NxProgress :model-value="2" :max="3" />
    <NxProgress :model-value="0" />
    <NxProgress :model-value="100" />
    <NxProgress :model-value="150" />
    <NxProgress :model-value="-5" />
    <NxProgress :model-value="5" :max="0" />
    <NxProgress :model-value="30" :height="4" />
    <NxSteps>
      <NxStepsItem title="Create your account">Done on 1 September.</NxStepsItem>
      <NxStepsItem title="Invite your team">Add the people who work with you.</NxStepsItem>
      <NxStepsItem title="Connect your bank" :index="7" />
      <NxStepsItem title="Celebrate"><template #index>&#9733;</template></NxStepsItem>
    </NxSteps>
    <NxTimeline
      :items="[
        { id: 'a', title: 'Signed in', description: 'Firefox on Linux', timestampLabel: placeholder('time'), tone: 'success' },
        { id: 'b', title: 'Password changed', tone: 'warning' },
        { id: 'c', title: 'Account created' },
      ]"
    />
    <NxTimeline :items="[]" empty="Nothing this week" />
    <NxTimeline :items="[]" />
  </NxLayout>
</template>
