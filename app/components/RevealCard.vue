<script setup lang="ts">
// The gift box. Tap it to open and see who you're buying for.
import type { RevealView } from '#shared/types'

defineProps<{ reveal: RevealView }>()

const opened = ref(false)
</script>

<template>
  <div class="flex flex-col items-center gap-6 text-center">
    <button
      v-if="!opened"
      type="button"
      class="gift group rounded-3xl p-4 focus-visible:outline-4 focus-visible:outline-primary"
      @click="opened = true"
    >
      <span
        class="block text-9xl transition-transform group-hover:scale-110 group-active:scale-95"
        aria-hidden="true"
      >🎁</span>
      <span class="mt-4 block rounded-full bg-primary px-8 py-4 text-xl font-bold text-inverted shadow-lg">
        Tap to find out who you're buying for
      </span>
    </button>

    <div
      v-else
      class="reveal w-full"
      role="status"
    >
      <UCard class="rounded-3xl">
        <p
          class="text-6xl"
          aria-hidden="true"
        >
          🎉
        </p>
        <p class="mt-2 text-xl">
          You're buying a present for…
        </p>
        <p class="my-4 break-words text-5xl font-extrabold text-primary font-display">
          {{ reveal.recipientName }}
        </p>
        <div class="flex flex-col items-center gap-2 text-lg">
          <p v-if="reveal.budget">
            💰 Spend about <strong>{{ reveal.budget }}</strong>
          </p>
          <p v-if="reveal.exchangeDate">
            📅 Swap presents on <strong>{{ formatDate(reveal.exchangeDate) }}</strong>
          </p>
        </div>
        <p
          v-if="reveal.recipientWishlist"
          class="mt-4 whitespace-pre-line rounded-xl bg-elevated p-3 text-left"
        >
          <strong>Their wishlist:</strong><br>{{ reveal.recipientWishlist }}
        </p>
        <p class="mt-6 text-muted">
          🤫 Shh! Keep it a secret!
        </p>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.gift span:first-child {
  animation: wiggle 2.5s ease-in-out infinite;
}

.reveal {
  animation: pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes wiggle {
  0%, 80%, 100% { transform: rotate(0); }
  85% { transform: rotate(-8deg); }
  90% { transform: rotate(8deg); }
  95% { transform: rotate(-4deg); }
}

@keyframes pop {
  from { opacity: 0; transform: scale(0.6) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .gift span:first-child, .reveal { animation: none; }
}
</style>
