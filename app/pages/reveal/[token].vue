<script setup lang="ts">
import type { RevealView } from '#shared/types'

useHead({ title: 'Your Secret Santa', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const route = useRoute()
const reveal = ref<RevealView | null>(null)
const error = ref('')
const loading = ref(true)

// Fetched in the browser only (this page has ssr: false), so link previews in
// chat apps don't count as "seen it".
onMounted(async () => {
  try {
    reveal.value = await $fetch<RevealView>(`/api/reveal/${route.params.token}`)
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div
      v-if="loading"
      class="py-20 text-center text-2xl"
      role="status"
    >
      🎅 Checking Santa's list…
    </div>

    <UCard
      v-else-if="error"
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
        {{ error }}
      </p>
    </UCard>

    <div
      v-else-if="reveal"
      class="space-y-6"
    >
      <div class="text-center">
        <h1 class="text-4xl font-extrabold">
          Hi {{ reveal.giverName }}! 🎅
        </h1>
        <p class="mt-2 text-xl text-muted">
          Welcome to <strong>{{ reveal.groupName }}</strong>
        </p>
      </div>
      <RevealCard :reveal="reveal" />
    </div>
    <DesignedByEllen />
  </div>
</template>
