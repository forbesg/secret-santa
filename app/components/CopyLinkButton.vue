<script setup lang="ts">
const props = withDefaults(defineProps<{
  url: string
  label?: string
  size?: 'md' | 'lg' | 'xl'
}>(), { label: 'Copy link', size: 'lg' })

const copied = ref(false)
const toast = useToast()

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
  catch {
    toast.add({ title: 'Couldn\'t copy. Press and hold the link to copy it instead.', color: 'warning' })
  }
}
</script>

<template>
  <UButton
    :size="size"
    :color="copied ? 'secondary' : 'primary'"
    :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
    :label="copied ? 'Copied!' : label"
    @click="copy"
  />
</template>
