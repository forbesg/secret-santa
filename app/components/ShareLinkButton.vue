<script setup lang="ts">
// Sends one person their reveal link using the device's own share sheet
// (Messages, WhatsApp, email…). If the browser can't share, shows a Copy button instead.
// The message never mentions who they're buying for.

const props = defineProps<{
  url: string
  name: string // the person the link is for
  groupName: string
}>()

const toast = useToast()
const canShare = ref(false)
const shared = ref(false)

const shareData = computed(() => ({
  title: `${props.groupName}: Secret Santa`,
  text: `🎅 Hi ${props.name}! Here's your secret link for ${props.groupName}. Tap it to find out who you're buying for. Shh, keep it a secret!`,
  url: props.url,
}))

onMounted(() => {
  canShare.value = typeof navigator.share === 'function'
    && (typeof navigator.canShare !== 'function' || navigator.canShare(shareData.value))
})

async function share() {
  try {
    await navigator.share(shareData.value)
    shared.value = true
  }
  catch (error) {
    // AbortError just means they closed the share sheet; that's fine.
    if ((error as Error)?.name === 'AbortError') return
    // Sharing failed for another reason, so show the Copy button from now on.
    canShare.value = false
    toast.add({ title: 'Sharing didn\'t work here, so use the Copy button instead.', color: 'warning' })
  }
}
</script>

<template>
  <UButton
    v-if="canShare"
    size="lg"
    :color="shared ? 'secondary' : 'primary'"
    :icon="shared ? 'i-lucide-check' : 'i-lucide-share-2'"
    :label="shared ? `Sent to ${name}` : `Send ${name}'s link`"
    @click="share"
  />
  <CopyLinkButton
    v-else
    :url="url"
    :label="`Copy ${name}'s link`"
  />
</template>
