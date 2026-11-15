# 🎅 Secret Santa

A small family Secret Santa web app. The admin creates a group, adds people, presses **Do the draw!**, and sends each person their own secret link. Each link shows only who *that* person is buying for. Nobody, not even the admin, can see the full list.

See `CLAUDE.md` for the full design and rules, and `NOTES.md` for decisions made along the way.

## Running it locally

Needs Node 24.11+ (or 22.21+) and pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:3000, data saved in .data/santa
pnpm test         # unit tests + an end-to-end API test (~30s)
pnpm typecheck
pnpm lint
```

## Deploying to Cloudflare Workers

One-time setup:

```bash
pnpm wrangler login
pnpm wrangler kv namespace create SANTA
```

That prints an `id`. Paste it into `wrangler.jsonc` in place of `<KV_NAMESPACE_ID>`.

Then deploy each time with:

```bash
pnpm build
pnpm deploy
```

Wrangler prints the `*.workers.dev` URL. To use your own domain, add a custom domain to the Worker in the Cloudflare dashboard.

Groups delete themselves automatically about 60 days after the exchange date (or 120 days after they were made if there's no date).

### Trying the production build locally

```bash
pnpm build
pnpm wrangler dev   # uses a local, simulated KV
```

