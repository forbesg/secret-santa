<script setup lang="ts">
// "Are you sure?" pop-up with big buttons.
withDefaults(defineProps<{
  title: string
  description?: string
  confirmLabel: string
  color?: 'primary' | 'secondary' | 'error'
  loading?: boolean
}>(), { color: 'primary' })

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :ui="{ title: 'text-2xl font-extrabold', description: 'text-lg' }"
  >
    <template #footer>
      <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <UButton
          size="xl"
          color="neutral"
          variant="soft"
          label="No, go back"
          @click="open = false"
        />
        <UButton
          size="xl"
          :color="color"
          :label="confirmLabel"
          :loading="loading"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
