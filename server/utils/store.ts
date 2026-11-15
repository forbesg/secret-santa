// All reads and writes go through Nitro's useStorage('santa'), never the KV API directly,
// so the storage driver can be swapped (fs in dev, Cloudflare KV in prod, Netlify Blobs…).
//
// Keys:
//   group:<groupId>       → Group (the whole group is one value)
//   token:<tokenHash>     → TokenIndexEntry (find a group from a reveal link)
//   ratelimit:<ip>:<hour> → number

import type { Group, TokenIndexEntry } from '#shared/types'
import { groupTtlSeconds } from './expiry'

function storage() {
  return useStorage('santa')
}

export async function getGroup(id: string): Promise<Group | null> {
  return await storage().getItem<Group>(`group:${id}`)
}

export async function saveGroup(group: Group): Promise<void> {
  await storage().setItem(`group:${group.id}`, group, { ttl: groupTtlSeconds(group) })
}

/** Deletes the group and every reveal-link entry that points at it. */
export async function deleteGroup(group: Group): Promise<void> {
  await removeGroupTokens(group)
  await storage().removeItem(`group:${group.id}`)
}

export async function getTokenEntry(tokenHash: string): Promise<TokenIndexEntry | null> {
  return await storage().getItem<TokenIndexEntry>(`token:${tokenHash}`)
}

export async function saveTokenEntry(tokenHash: string, entry: TokenIndexEntry, group: Group): Promise<void> {
  await storage().setItem(`token:${tokenHash}`, entry, { ttl: groupTtlSeconds(group) })
}

export async function removeTokenEntry(tokenHash: string): Promise<void> {
  await storage().removeItem(`token:${tokenHash}`)
}

/** Removes the token:* entries for everyone in the group (used by reset and delete). */
export async function removeGroupTokens(group: Group): Promise<void> {
  await Promise.all(
    group.participants
      .filter(p => p.tokenHash)
      .map(p => removeTokenEntry(p.tokenHash!)),
  )
}

/**
 * Very simple counter: returns false once `key` has been hit more than `max` times this hour.
 * (KV isn't atomic, so it's "roughly 10", which is fine for stopping casual abuse.)
 */
export async function hitRateLimit(key: string, max: number): Promise<boolean> {
  const hour = Math.floor(Date.now() / 3_600_000)
  const storageKey = `ratelimit:${key}:${hour}`
  const count = (await storage().getItem<number>(storageKey)) ?? 0
  if (count >= max) return false
  await storage().setItem(storageKey, count + 1, { ttl: 3600 })
  return true
}
