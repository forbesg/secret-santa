<template>
  <div class="relative min-h-screen overflow-x-hidden">
    <SnowFall />
    <header class="relative z-10 py-6 text-center">
      <NuxtLink
        to="/"
        class="inline-block rounded-xl px-2 text-4xl font-bold text-primary font-display focus-visible:outline-4 focus-visible:outline-primary sm:text-5xl"
      >
        🎅 Secret Santa 🎄
      </NuxtLink>
    </header>
    <main class="relative z-10 mx-auto w-full max-w-2xl px-4 pb-16">
      <slot />
    </main>
  </div>
</template>
