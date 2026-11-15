<script setup lang="ts">
// Gentle falling snow. Purely decorative; hidden for people who prefer reduced motion.
const flakes = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  size: `${0.6 + ((i * 7) % 10) / 10}rem`,
  duration: `${8 + ((i * 13) % 10)}s`,
  delay: `-${(i * 11) % 15}s`,
}))
</script>

<template>
  <div
    class="snow pointer-events-none fixed inset-0 z-0"
    aria-hidden="true"
  >
    <span
      v-for="(flake, i) in flakes"
      :key="i"
      class="flake"
      :style="{ left: flake.left, fontSize: flake.size, animationDuration: flake.duration, animationDelay: flake.delay }"
    >❄</span>
  </div>
</template>

<style scoped>
.flake {
  position: absolute;
  top: -2rem;
  color: rgb(148 163 184 / 0.5);
  animation-name: fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes fall {
  to { transform: translateY(110vh) rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .snow { display: none; }
}
</style>
