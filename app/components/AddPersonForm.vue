<script setup lang="ts">
import { LIMITS } from '#shared/types'

const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ add: [name: string] }>()

const name = ref('')
const nameInput = useTemplateRef('nameInput')

function submit() {
  if (!name.value.trim() || props.disabled) return
  emit('add', name.value.trim())
}

/** Called by the parent once the person has been added. */
function clear() {
  name.value = ''
  nameInput.value?.inputRef?.focus()
}
defineExpose({ clear })
</script>

<template>
  <form
    class="space-y-4"
    @submit.prevent="submit"
  >
    <UFormField
      label="Their name"
      name="name"
      size="xl"
    >
      <UInput
        ref="nameInput"
        v-model="name"
        placeholder="e.g. Grandma"
        :maxlength="LIMITS.nameMax"
        autocomplete="off"
        class="w-full"
        size="xl"
      />
    </UFormField>
    <UButton
      type="submit"
      size="xl"
      color="secondary"
      icon="i-lucide-user-plus"
      label="Add a person"
      block
      :disabled="!name.trim() || disabled"
    />
  </form>
</template>
