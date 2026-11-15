# Secret Santa Web App

A small web app for running a family Secret Santa. **Ellen (age 9) is the admin.** She creates a group, adds people (by name), and presses **Draw**. Each person then gets a private link that shows only who *they* are buying for.

Built by Forbes (comfortable with Vue / Nuxt) and Ellen. Keep the code simple and readable. Forbes will maintain it, and Ellen will use it.

---

## Golden rules (never break these)

1. **No one can see the full list of matches, not even the admin.** Ellen usually takes part too. The admin API and UI must never return or render `assignments`. The only way to learn a match is your own reveal link, which shows only your own recipient.
2. **No accounts or passwords.** Access is by secret link only:
   - Admin link: `/admin/<groupId>?key=<adminKey>`
   - Reveal link: `/reveal/<participantToken>`
3. **Store only hashes of secrets.** Generate tokens with `crypto.getRandomValues` (32 bytes, base64url). Store the `SHA-256` hash and compare with a constant-time check. The raw token exists only in the URL handed to the user.
4. **The draw must always be valid.** Nobody draws themselves, and everyone gives exactly once and receives exactly once. This is covered by unit tests, which must pass.
5. **The UI is kid-friendly.** Use big buttons, plain words ("Add a person", "Do the draw!"), friendly error messages and no jargon. Assume a 9-year-old on a tablet.
6. **Collect as little data as possible.** Store names and optional wishlists only. Nothing else (no email addresses or phone numbers).

---

## Stack

- **Nuxt 4** (latest 4.x) + **TypeScript** (strict). Use the `app/` directory structure (Nuxt 4 default).
- **Nuxt UI** for components (it includes Tailwind). Theme: festive red and green, rounded, playful.
- **Server:** Nitro server routes in `server/api/`.
- **Storage:** Nitro `useStorage('santa')` (unstorage). **Do not call the KV API directly.** Always go through `useStorage` so the driver can be swapped.
  - Production: Cloudflare KV binding `SANTA` (driver `cloudflare-kv-binding`)
  - Local dev: `fs` driver at `.data/santa`
  - Alternative host: Netlify Blobs driver, with the same code
- **Hosting:** Cloudflare Workers, Nitro preset `cloudflare-module`, `nodejs_compat` flag.
- **Validation:** `zod` for every request body or query.
- **Tests:** `vitest` (+ `@nuxt/test-utils` where useful).
- **Sharing links:** the Web Share API (`navigator.share`) opens the device's share sheet (chat, SMS, etc.), with a "Copy link" fallback. No email, so no email provider.

Package manager: **pnpm**.

## Commands

```bash
pnpm install
pnpm dev            # local dev (fs storage)
pnpm test           # vitest
pnpm typecheck      # nuxt typecheck
pnpm lint           # eslint (@nuxt/eslint)
pnpm build          # production build (cloudflare-module preset)
pnpm deploy         # wrangler deploy (after build)
```

Run `pnpm typecheck && pnpm test` before calling any task done.

---

## Project structure

```
app/
  pages/
    index.vue                 # "Start a new Secret Santa"
    admin/[id].vue            # Ellen's admin page (reads ?key=)
    reveal/[token].vue        # participant reveal page
  components/                 # ParticipantList, AddPersonForm, RevealCard, CopyLinkButton, Snow…
  composables/useAdminApi.ts  # wraps admin fetch calls, attaches key
server/
  api/
    groups/index.post.ts
    groups/[id]/index.get.ts
    groups/[id]/index.patch.ts
    groups/[id]/index.delete.ts
    groups/[id]/participants/index.post.ts
    groups/[id]/participants/[pid].delete.ts
    groups/[id]/draw.post.ts
    groups/[id]/reset.post.ts
    groups/[id]/participants/[pid]/link.post.ts  # new link for one person
    reveal/[token].get.ts
    reveal/[token]/wishlist.put.ts    # Phase 3
  utils/
    draw.ts          # pure allocation logic (no I/O), heavily tested
    tokens.ts        # generateToken, hashToken, safeEqual
    store.ts         # getGroup / saveGroup / token index helpers over useStorage
    auth.ts          # requireAdmin(event) → loads group, checks key, throws 401/404
    serialize.ts     # toAdminView(group), toRevealView(group, pid): the ONLY way data leaves the server
shared/types.ts      # Group, Participant, AdminView, RevealView
tests/
  draw.test.ts
  api.test.ts
```

## Data model (stored as JSON in KV)

```ts
// key: group:<groupId>
interface Group {
  id: string                 // short random id, e.g. 10 chars nanoid
  name: string               // "Smith Family Christmas 2026"
  budget?: string            // "£20"
  exchangeDate?: string      // ISO date
  createdAt: string
  adminKeyHash: string
  status: 'draft' | 'drawn'
  participants: Participant[]
  assignments?: Record<string, string> // giverId → receiverId. NEVER sent to admin.
}

interface Participant {
  id: string
  name: string
  tokenHash?: string         // set at draw time
  viewedAt?: string
  wishlist?: string          // Phase 3, max 500 chars
  excludes?: string[]        // Phase 3, participant ids this person must not draw
}

// key: token:<tokenHash> → { groupId: string, participantId: string }
```

- One group = one KV value. Read it, modify it, then write the whole value back.
- Set a KV TTL so groups expire automatically about 60 days after `exchangeDate` (or 120 days after creation if there's no date).
- On reset or delete, remove the `token:*` entries for that group too.

## Response shapes (enforce via `serialize.ts`)

- **AdminView:** `{ id, name, budget, exchangeDate, status, participants: [{ id, name, hasViewed }], revealLinks?: [...] }`
  - `revealLinks` (`[{ participantId, name, url }]`) is included **only** in the response to `POST /draw` (and `POST /reset` + redraw), because raw tokens exist only at that moment. After that, the admin can't recover the links, so use the "new link" endpoint, `POST /participants/:pid/link` (it rotates that one person's token without changing the match).
- **RevealView:** `{ groupName, budget, exchangeDate, giverName, recipientName, recipientWishlist? }`

Add a test that the AdminView never contains `assignments` or any recipient name.

## Draw algorithm (`server/utils/draw.ts`)

```
draw(participants, rng = crypto-based) → Record<giverId, receiverId>
```
- Require at least 3 participants (2 works but isn't secret, so return a friendly error).
- Fisher–Yates shuffle, then `shuffled[i]` gives to `shuffled[(i+1) % n]`. This forms a single loop with no self-matches.
- Phase 3 exclusions: retry up to 1000 shuffles until no exclusion is broken. If none works, throw `DrawImpossibleError` with a kid-friendly message ("We couldn't find a way that follows all the rules — try removing one rule").
- Keep it pure and injectable (pass `rng`) so tests are deterministic.
- Tests: for n = 3…30, run many times and assert no self-match, it's a bijection, it's a single cycle, and exclusions are respected.

## Admin auth

- The admin key arrives as the `x-admin-key` header from the composable. The page reads `?key=` from the URL once, keeps it in `sessionStorage`, and calls `history.replaceState` to remove it from the address bar.
- `requireAdmin(event)` hashes the key, compares it with `adminKeyHash`, and returns 404 (not 403) if the group or key is wrong, so group ids can't be probed.
- Participants can be edited only while `status === 'draft'`. After drawing, the admin can **reset** (clears assignments and tokens) and draw again.

## Pages / UX

- **`/` (create):** a form with group name, optional budget and date, and a "Let's go! 🎄" button. On success, show the admin link big and clear: "This is your secret admin link. Save it! Bookmark it or ask a grown-up to keep it." Include Copy and Open buttons.
- **`/admin/[id]`:**
  - Draft: list of people with remove (✕), an "Add a person" form (name only), a counter, and a big **"Do the draw! 🎁"** button (disabled under 3 people), with a confirm step.
  - Drawn: each person shows ✅ viewed / ⏳ not yet, and a "Send Sam's link" share button for each person right after the draw (falling back to "Copy link" where the browser can't share). Includes "Start again" (reset, with a confirm) and "Delete this group".
  - Never show who got whom. Not even a "peek" button.
- **`/reveal/[token]`:** "Hi Sam! 🎅" then a "Tap to find out who you're buying for" button that opens a gift-box animation to show the recipient name, budget and date. Phase 3 adds "Your wishlist" (editable) and "Their wishlist" (read only).
- Accessibility: proper labels, focus states, `prefers-reduced-motion` respected for snow and animations.
- Add `<meta name="robots" content="noindex">` on admin and reveal pages.

## Security & abuse

- Validate and limit inputs with zod: names ≤ 50 chars, max 50 participants, wishlist ≤ 500 chars.
- Basic rate limit on `POST /api/groups` (e.g. KV counter per IP hash per hour, 10 max).
- Escape everything (Vue does this by default; never use `v-html` for user content).
- The share message is plain and friendly, contains only the person's name, the group name and their reveal link, and never mentions the recipient.

---

## Build plan (work through in order; finish and test each phase before starting the next)

### Phase 0: Scaffold
- [ ] `pnpm create nuxt@latest` (Nuxt 4), add `@nuxt/ui`, `@nuxt/eslint`, `zod`, `vitest`, `@nuxt/test-utils`
- [ ] Configure `nitro.storage` / `nitro.devStorage` for `santa` (fs in dev, `cloudflare-kv-binding` with binding `SANTA` in prod)
- [ ] Nitro preset `cloudflare-module`, generate a `wrangler.jsonc` with the KV binding placeholder `<KV_NAMESPACE_ID>`
- [ ] Scripts in package.json as listed above
- [ ] Festive base layout + favicon

### Phase 1: MVP (share links by copy/paste)
- [ ] `server/utils/tokens.ts`, `draw.ts` + tests first
- [ ] `store.ts`, `auth.ts`, `serialize.ts` + leak test
- [ ] API routes: create, get, patch, delete, add/remove participant, draw, reset, regenerate link, reveal
- [ ] Pages: create, admin, reveal
- [ ] Manual check: create a group, add 4 people, draw, open each link in a private window, and confirm the admin page shows no matches
- [ ] README section: how to create the KV namespace and deploy

### Phase 2: Sharing (no email)
- [x] "Send Sam's link" button for each person using the Web Share API (chat, SMS, etc.), falling back to "Copy link"
- Email is out of scope: don't collect email addresses or add an email provider.

### Phase 3: Extras
- [ ] Exclusions UI ("Who shouldn't Sam get?") + draw support
- [ ] Wishlists on the reveal page
- [ ] Countdown to the exchange date, falling snow toggle, emoji avatars

---

## Working conventions for Claude

- Before a large change, briefly say what you'll do, then do it. Keep commits small and focused, with messages in the imperative mood.
- Prefer clear code over clever code. Forbes should be able to read every file.
- Put any logic that can be pure in `server/utils/` and test it.
- Don't add dependencies beyond the stack without a good reason. Say why if you do.
- Never commit secrets. Use `.env` (git-ignored) and Cloudflare secrets (`wrangler secret put`).
- If a requirement here is unclear, pick the simplest option that keeps the Golden Rules, and note it in `NOTES.md`.

## Assumptions (Forbes: edit these if they're wrong)

- Links are shared through the device's share sheet (chat, SMS, etc.) or by copy/paste. There's no email.
- Exclusions aren't needed until Phase 3.
- Hosting is Cloudflare Workers + KV, and the domain is TBD.
- Currency is shown as free text (e.g. "£20").
