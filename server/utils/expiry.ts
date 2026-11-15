// How long a group lives in storage before KV deletes it automatically.
// Pure, so it's easy to test.

import type { Group } from '#shared/types'

const DAY_MS = 24 * 60 * 60 * 1000

export function groupExpiresAt(group: Pick<Group, 'createdAt' | 'exchangeDate'>): number {
  if (group.exchangeDate) return Date.parse(group.exchangeDate) + 60 * DAY_MS
  return Date.parse(group.createdAt) + 120 * DAY_MS
}

/** Seconds until the group should expire (KV's minimum TTL is 60 seconds). */
export function groupTtlSeconds(group: Pick<Group, 'createdAt' | 'exchangeDate'>, now = Date.now()): number {
  return Math.max(60, Math.ceil((groupExpiresAt(group) - now) / 1000))
}
