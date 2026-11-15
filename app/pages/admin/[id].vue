<script setup lang="ts">
import { LIMITS, type AdminParticipantView, type AdminView, type RevealLink } from '#shared/types'

useHead({ title: 'Secret Santa admin', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const route = useRoute()
const toast = useToast()
const api = useAdminApi(String(route.params.id))

const group = ref<AdminView | null>(null)
const loading = ref(true)
const loadError = ref('')
const deleted = ref(false)

// Reveal links exist only right after the draw (or after making a new one)
const links = ref<Record<string, RevealLink>>({})
const busyId = ref<string | null>(null)
const addForm = useTemplateRef('addForm')

const confirmDraw = ref(false)
const confirmReset = ref(false)
const confirmDelete = ref(false)
const working = ref(false)

const editing = ref(false)
const details = reactive({ name: '', budget: '', exchangeDate: '' })

const count = computed(() => group.value?.participants.length ?? 0)
const isDrawn = computed(() => group.value?.status === 'drawn')
const canDraw = computed(() => count.value >= LIMITS.participantsMin)
const peopleNeeded = computed(() => Math.max(0, LIMITS.participantsMin - count.value))

onMounted(async () => {
  if (!api.captureKey()) {
    loadError.value = 'This link is missing its secret key. Open the full admin link you saved.'
    loading.value = false
    return
  }
  try {
    group.value = await api.getGroup()
  }
  catch (e) {
    loadError.value = errorMessage(e)
  }
  finally {
    loading.value = false
  }
})

/** Run an API call, show a friendly toast if it fails. */
async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
  try {
    return await action()
  }
  catch (e) {
    toast.add({ title: errorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return undefined
  }
}

async function addPerson(name: string) {
  working.value = true
  const updated = await run(() => api.addPerson({ name }))
  working.value = false
  if (updated) {
    group.value = updated
    addForm.value?.clear()
  }
}

async function removePerson(person: AdminParticipantView) {
  busyId.value = person.id
  const updated = await run(() => api.removePerson(person.id))
  busyId.value = null
  if (updated) group.value = updated
}

async function doDraw() {
  working.value = true
  const updated = await run(() => api.doDraw())
  working.value = false
  confirmDraw.value = false
  if (updated) {
    links.value = Object.fromEntries((updated.revealLinks ?? []).map(link => [link.participantId, link]))
    group.value = updated
  }
}

async function newLink(person: AdminParticipantView) {
  busyId.value = person.id
  const link = await run(() => api.newLink(person.id))
  busyId.value = null
  if (link) links.value = { ...links.value, [link.participantId]: link }
}

async function reset() {
  working.value = true
  const updated = await run(() => api.reset())
  working.value = false
  confirmReset.value = false
  if (updated) {
    links.value = {}
    group.value = updated
  }
}

async function deleteGroup() {
  working.value = true
  const ok = await run(() => api.deleteGroup())
  working.value = false
  confirmDelete.value = false
  if (ok) deleted.value = true
}

function startEditing() {
  if (!group.value) return
  details.name = group.value.name
  details.budget = group.value.budget ?? ''
  details.exchangeDate = group.value.exchangeDate ?? ''
  editing.value = true
}

async function saveDetails() {
  working.value = true
  const updated = await run(() => api.updateGroup({ ...details }))
  working.value = false
  if (updated) {
    group.value = updated
    editing.value = false
  }
}
</script>

<template>
  <div>
    <div
      v-if="loading"
      class="py-20 text-center text-2xl"
      role="status"
    >
      🎅 Loading…
    </div>

    <UCard
      v-else-if="deleted"
      class="rounded-3xl text-center"
    >
      <p
        class="text-6xl"
        aria-hidden="true"
      >
        👋
      </p>
      <p class="mt-4 text-2xl font-bold">
        All gone! That Secret Santa has been deleted.
      </p>
      <UButton
        to="/"
        size="xl"
        class="mt-6"
        label="Start a new one"
      />
    </UCard>

    <UCard
      v-else-if="loadError || !group"
      class="rounded-3xl text-center"
    >
      <p
        class="text-6xl"
        aria-hidden="true"
      >
        🤔
      </p>
      <p
        class="mt-4 text-xl"
        role="alert"
      >
        {{ loadError }}
      </p>
    </UCard>

    <div
      v-else
      class="space-y-6"
    >
      <!-- Group details -->
      <UCard class="rounded-3xl">
        <div
          v-if="!editing"
          class="text-center"
        >
          <h1 class="text-3xl font-extrabold break-words">
            {{ group.name }}
          </h1>
          <p class="mt-2 flex flex-wrap justify-center gap-x-4 text-lg text-muted">
            <span v-if="group.budget">💰 {{ group.budget }}</span>
            <span v-if="group.exchangeDate">📅 {{ formatDate(group.exchangeDate) }}</span>
          </p>
          <div class="mt-3 flex flex-wrap justify-center gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-lucide-pencil"
              label="Change details"
              @click="startEditing"
            />
            <CopyLinkButton
              :url="api.adminUrl()"
              label="Copy my admin link"
              size="md"
            />
          </div>
        </div>

        <form
          v-else
          class="space-y-4"
          @submit.prevent="saveDetails"
        >
          <UFormField
            label="What's it called?"
            name="name"
            size="xl"
          >
            <UInput
              v-model="details.name"
              :maxlength="LIMITS.nameMax"
              class="w-full"
              size="xl"
            />
          </UFormField>
          <UFormField
            label="How much to spend?"
            hint="Optional"
            name="budget"
            size="xl"
          >
            <UInput
              v-model="details.budget"
              :maxlength="LIMITS.budgetMax"
              placeholder="£20"
              class="w-full"
              size="xl"
            />
          </UFormField>
          <UFormField
            label="When do you swap presents?"
            hint="Optional"
            name="exchangeDate"
            size="xl"
          >
            <UInput
              v-model="details.exchangeDate"
              type="date"
              class="w-full"
              size="xl"
            />
          </UFormField>
          <div class="flex gap-3">
            <UButton
              type="submit"
              size="xl"
              label="Save"
              :loading="working"
            />
            <UButton
              size="xl"
              color="neutral"
              variant="soft"
              label="Cancel"
              @click="editing = false"
            />
          </div>
        </form>
      </UCard>

      <!-- Before the draw -->
      <template v-if="!isDrawn">
        <UCard class="rounded-3xl">
          <h2 class="text-2xl font-extrabold">
            Who's taking part? <span class="text-muted">({{ count }} {{ count === 1 ? 'person' : 'people' }})</span>
          </h2>
          <p
            v-if="count === 0"
            class="mt-2 text-lg text-muted"
          >
            Nobody yet! Add everyone below, and remember to add yourself too if you're joining in.
          </p>
          <ParticipantList
            v-else
            class="mt-4"
            :people="group.participants"
            :group-name="group.name"
            :drawn="false"
            :links="links"
            :busy-id="busyId"
            @remove="removePerson"
          />
        </UCard>

        <UCard class="rounded-3xl">
          <h2 class="mb-4 text-2xl font-extrabold">
            Add a person
          </h2>
          <AddPersonForm
            ref="addForm"
            :disabled="working || count >= LIMITS.participantsMax"
            @add="addPerson"
          />
        </UCard>

        <div class="text-center">
          <UButton
            size="xl"
            block
            label="Do the draw! 🎁"
            class="py-5 text-2xl"
            :disabled="!canDraw"
            @click="confirmDraw = true"
          />
          <p
            v-if="!canDraw"
            class="mt-2 text-lg text-muted"
          >
            Add {{ peopleNeeded }} more {{ peopleNeeded === 1 ? 'person' : 'people' }} to do the draw.
          </p>
        </div>
      </template>

      <!-- After the draw -->
      <template v-else>
        <UAlert
          color="secondary"
          variant="subtle"
          icon="i-lucide-party-popper"
          title="The names are drawn! 🎉"
          :ui="{ title: 'text-xl font-extrabold', description: 'text-base' }"
        >
          <template #description>
            <p v-if="Object.keys(links).length">
              Send each person <strong>their own</strong> link. Send them now: when you leave this page, you'll need to make new ones.
            </p>
            <p v-else>
              Lost someone's link? Press "New link" to make another. Their old link will stop working, and they'll still get the same person.
            </p>
            <p class="mt-1">
              🤫 Don't open anyone else's link. That would spoil the surprise!
            </p>
          </template>
        </UAlert>

        <UCard class="rounded-3xl">
          <ParticipantList
            :people="group.participants"
            :group-name="group.name"
            :drawn="true"
            :links="links"
            :busy-id="busyId"
            @new-link="newLink"
          />
        </UCard>

        <div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <UButton
            size="xl"
            color="neutral"
            variant="soft"
            icon="i-lucide-rotate-ccw"
            label="Start again"
            @click="confirmReset = true"
          />
        </div>
      </template>

      <div class="pt-6 text-center">
        <UButton
          color="error"
          variant="ghost"
          icon="i-lucide-trash-2"
          label="Delete this group"
          @click="confirmDelete = true"
        />
      </div>
    </div>

    <ConfirmDialog
      v-model:open="confirmDraw"
      title="Ready to draw? 🎁"
      :description="`Is everyone in? There are ${count} people. You can always start again later if you need to.`"
      confirm-label="Yes, do the draw!"
      :loading="working"
      @confirm="doDraw"
    />
    <ConfirmDialog
      v-model:open="confirmReset"
      title="Start again?"
      description="Everyone's links will stop working, and you'll need to do the draw again and send new links."
      confirm-label="Yes, start again"
      color="error"
      :loading="working"
      @confirm="reset"
    />
    <ConfirmDialog
      v-model:open="confirmDelete"
      title="Delete this group?"
      description="This deletes everything, including everyone's links. You can't undo it."
      confirm-label="Yes, delete it"
      color="error"
      :loading="working"
      @confirm="deleteGroup"
    />
  </div>
</template>
