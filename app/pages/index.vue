<script setup lang="ts">
import { LIMITS, type CreateGroupResponse } from '#shared/types'

const form = reactive({ name: '', budget: '', exchangeDate: '' })
const loading = ref(false)
const error = ref('')
const created = ref<CreateGroupResponse | null>(null)

const today = new Date().toISOString().slice(0, 10)

async function create() {
  loading.value = true
  error.value = ''
  try {
    created.value = await $fetch<CreateGroupResponse>('/api/groups', { method: 'POST', body: form })
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Step 2: show the secret admin link -->
    <UCard
      v-if="created"
      class="rounded-3xl text-center"
    >
      <p
        class="text-6xl"
        aria-hidden="true"
      >
        🔑
      </p>
      <h1 class="mt-2 text-3xl font-extrabold">
        "{{ created.group.name }}" is ready!
      </h1>
      <p class="mt-4 text-xl">
        This is your <strong>secret admin link</strong>. Save it!
      </p>
      <p class="mt-1 text-lg text-muted">
        Bookmark it or ask a grown-up to keep it. Don't share it. It's just for you.
      </p>
      <p class="my-6 break-all rounded-2xl border-2 border-dashed border-primary bg-elevated p-4 font-mono text-lg select-all">
        {{ created.adminUrl }}
      </p>
      <div class="flex flex-col justify-center gap-3 sm:flex-row">
        <CopyLinkButton
          :url="created.adminUrl"
          label="Copy my link"
          size="xl"
        />
        <UButton
          :to="created.adminUrl"
          size="xl"
          color="secondary"
          icon="i-lucide-arrow-right"
          trailing
          label="Open it"
          external
        />
      </div>
    </UCard>

    <!-- Step 1: the form -->
    <UCard
      v-else
      class="rounded-3xl"
    >
      <h1 class="text-center text-3xl font-extrabold">
        Start a new Secret Santa
      </h1>
      <p class="mt-2 text-center text-lg text-muted">
        Everyone gets a secret link that shows only who <em>they</em> are buying for.
      </p>

      <form
        class="mt-6 space-y-5"
        @submit.prevent="create"
      >
        <UFormField
          label="What's it called?"
          name="name"
          size="xl"
          required
        >
          <UInput
            v-model="form.name"
            placeholder="Smith Family Christmas"
            :maxlength="LIMITS.nameMax"
            class="w-full"
            size="xl"
            autofocus
          />
        </UFormField>
        <UFormField
          label="How much to spend?"
          hint="Optional"
          name="budget"
          size="xl"
        >
          <UInput
            v-model="form.budget"
            placeholder="£20"
            :maxlength="LIMITS.budgetMax"
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
            v-model="form.exchangeDate"
            type="date"
            :min="today"
            class="w-full"
            size="xl"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="error"
          role="alert"
        />

        <UButton
          type="submit"
          size="xl"
          block
          label="Let's go! 🎄"
          :loading="loading"
          :disabled="!form.name.trim()"
          class="py-4 text-xl"
        />
      </form>
    </UCard>
    <DesignedByEllen />
  </div>
</template>
