<template>
  <NxLayout preheader="Your booking at Acme Labs">
    <NxTypography variant="headline-small">Your booking</NxTypography>
    <NxEventChip title="Onboarding call" :time="placeholder('time')" />
    <NxEventChip title="Team offsite" color="#0f766e" all-day time="All day" compact continues-after />
    <NxEventChip title="Review" color="success" time="14:00" selected />
    <NxEventChip title="Standup" color="#0f7" time="09:30" compact />
    <NxAttributes
      :data="[
        { name: 'room', label: 'Room', type: 'STRING' },
        { name: 'seats', label: 'Seats', type: 'NUMBER' },
        { name: 'area', label: 'Area', type: 'NUMBER', unit: 'm²' },
        { name: 'equipment', label: 'Equipment', type: 'MULTI_SELECT' },
        { name: 'floor', label: 'Floor', type: 'STRING', defaultValue: 'Ground' },
        { name: 'parking', label: 'Parking', type: 'STRING' },
      ]"
      :values="{ room: 'Lovelace', seats: 0, area: 42, equipment: ['Screen', 'Whiteboard'], parking: null }"
    />
    <NxAttributes :data="[{ name: 'note', label: 'Note' }]" />
    <NxPostalAddress :data="{ street: '12 rue de la Paix', postalCode: '75002', locality: 'Paris', country: 'FR' }" />
    <NxPostalAddress label="Warehouse" :data="{ locality: 'Potsdam', region: 'Brandenburg', country: 'DE' }" />
    <NxPostalAddress label="Depot" :data="{ region: 'Brandenburg' }" />
    <NxPostalAddress :data="null" />
    <NxOpeningHours
      :data="[
        { dayOfWeek: 6, isClosed: true },
        { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00' },
        { dayOfWeek: 2, openTime: '09:00' },
      ]"
    />
    <NxContacts
      :data="[
        { type: 'EMAIL', value: 'hello@acme.example' },
        { type: 'PHONE', value: '+33 1 23 45 67 89', label: 'Front desk' },
        { type: 'FAX', value: '+33 1 23 45 67 90' },
        { type: 'WEBSITE', value: 'https://acme.example' },
        { type: 'EMAIL', value: placeholder('email'), label: 'Support' },
        { type: 'MOBILE', value: placeholder('mobile') },
        { type: 'WEBSITE', value: placeholder('site'), label: 'Portal' },
      ]"
    >
      <template #label>Reach us</template>
    </NxContacts>
    <NxFileList
      :items="[
        { id: 'agenda', name: 'agenda.pdf', size: 1572864, href: 'https://acme.example/files/agenda.pdf', type: 'application/pdf' },
        { id: 'map', name: 'map', size: 512, type: 'image/png' },
        { id: 'notes', name: 'notes.txt', size: 86016 },
        { id: 'photos', name: 'photos.zip', size: 3221225472 },
        { id: 'badge', name: 'badge.pkpass', size: placeholder('badgeSize'), href: 'https://acme.example/files/badge', disabled: true },
      ]"
    />
    <NxFileList :items="[]" />
    <NxFileList :items="[]" empty="Nothing attached" />
    <NxRating :model-value="4" label="Your last visit" helper-text="Rated on 2 September." />
    <NxRating label="How was it?" :href="(star) => `https://acme.example/review?rating=${star}`" />
  </NxLayout>
</template>
