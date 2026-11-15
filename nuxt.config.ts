// https://nuxt.com/docs/api/configuration/nuxt-config
const privatePageHeaders = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer', // don't leak secret links to other sites
  'Cache-Control': 'no-store',
}

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Secret Santa',
      htmlAttrs: { lang: 'en' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [{ name: 'description', content: 'A simple, secret family Secret Santa.' }],
    },
  },
  css: ['~/assets/css/main.css'],

  routeRules: {
    // Admin and reveal pages only make sense in the browser (the secrets live in the URL),
    // and rendering them client-side means link-preview bots never trigger a "viewed".
    '/admin/**': { ssr: false, headers: privatePageHeaders },
    '/reveal/**': { ssr: false, headers: privatePageHeaders },
    '/api/**': { headers: { 'Cache-Control': 'no-store' } },
  },
  compatibilityDate: '2026-11-01',

  nitro: {
    preset: 'cloudflare-module',
    // Production: Cloudflare KV binding SANTA (see wrangler.jsonc)
    storage: {
      santa: { driver: 'cloudflare-kv-binding', binding: 'SANTA' },
    },
    // Local dev: plain files in .data/santa
    devStorage: {
      santa: { driver: 'fs', base: './.data/santa' },
    },
  },

  typescript: { strict: true },

  eslint: {
    config: { stylistic: true },
  },
})
