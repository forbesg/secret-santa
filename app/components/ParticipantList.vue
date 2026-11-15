<script setup lang="ts">
import type { AdminParticipantView, RevealLink } from '#shared/types'

defineProps<{
  people: AdminParticipantView[]
  drawn: boolean
  links: Record<string, RevealLink> // participantId → link (only known right after the draw)
  busyId?: string | null
  groupName: string
}>()

const emit = defineEmits<{
  remove: [person: AdminParticipantView]
  newLink: [person: AdminParticipantView]
}>()

// A stable, friendly emoji for each person
const avatars = ['🦌', '⛄', '🐧', '🧝', '🍪', '🌟', '🎄', '🧸', '🦊', '🐻‍❄️', '🍭', '🔔']
function avatarFor(id: string) {
  let sum = 0
  for (const char of id) sum += char.charCodeAt(0)
  return avatars[sum % avatars.length]
}
</script>

<template>
  <ul class="space-y-3">
    <li
      v-for="person in people"
      :key="person.id"
      class="flex flex-wrap items-center gap-3 rounded-2xl border border-default bg-default p-3 shadow-sm"
    >
      <span
        class="text-3xl"
        aria-hidden="true"
      >{{ avatarFor(person.id) }}</span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-lg font-bold">
          {{ person.name }}
        </p>
      </div>

      <template v-if="!drawn">
        <UButton
          color="neutral"
          variant="ghost"
          size="xl"
          icon="i-lucide-x"
          :aria-label="`Remove ${person.name}`"
          :loading="busyId === person.id"
          @click="emit('remove', person)"
        />
      </template>

      <template v-else>
        <UBadge
          :color="person.hasViewed ? 'secondary' : 'neutral'"
          variant="subtle"
          size="lg"
        >
          {{ person.hasViewed ? '✅ Seen it' : '⏳ Not yet' }}
        </UBadge>
        <div class="flex w-full justify-end sm:w-auto">
          <ShareLinkButton
            v-if="links[person.id]"
            :url="links[person.id]!.url"
            :name="person.name"
            :group-name="groupName"
          />
          <UButton
            v-else
            size="lg"
            variant="soft"
            icon="i-lucide-refresh-cw"
            :label="`New link for ${person.name}`"
            :loading="busyId === person.id"
            @click="emit('newLink', person)"
          />
        </div>
      </template>
    </li>
  </ul>
</template>
