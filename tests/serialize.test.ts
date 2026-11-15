// Golden rule #1: the admin must never be able to see who got whom.
import { describe, expect, it } from 'vitest'
import type { Group } from '#shared/types'
import { toAdminView, toRevealView } from '../server/utils/serialize'
import { groupTtlSeconds } from '../server/utils/expiry'

function drawnGroup(): Group {
  return {
    id: 'g123456789',
    name: 'Test Family',
    budget: '£20',
    exchangeDate: '2026-12-25',
    createdAt: '2026-11-01T00:00:00.000Z',
    adminKeyHash: 'ADMIN_HASH_SECRET',
    status: 'drawn',
    participants: [
      { id: 'a', name: 'Alice', tokenHash: 'TOKEN_A', viewedAt: '2026-11-02T00:00:00Z', wishlist: 'WISH_A' },
      { id: 'b', name: 'Bob', tokenHash: 'TOKEN_B', wishlist: 'WISH_B', excludes: ['c'] },
      { id: 'c', name: 'Cara', tokenHash: 'TOKEN_C' },
    ],
    assignments: { a: 'b', b: 'c', c: 'a' },
  }
}

describe('toAdminView', () => {
  it('never contains assignments, recipients, secrets or wishlists', () => {
    const view = toAdminView(drawnGroup())
    const json = JSON.stringify(view)

    expect(view).not.toHaveProperty('assignments')
    for (const secret of ['assignments', 'recipient', 'ADMIN_HASH_SECRET', 'TOKEN_A', 'TOKEN_B', 'TOKEN_C', 'WISH_A', 'WISH_B', 'excludes', 'tokenHash']) {
      expect(json).not.toContain(secret)
    }
  })

  it('only has the allowed fields', () => {
    const view = toAdminView(drawnGroup(), [{ participantId: 'a', name: 'Alice', url: 'https://x/reveal/t' }])
    expect(Object.keys(view).sort()).toEqual(['budget', 'exchangeDate', 'id', 'name', 'participants', 'revealLinks', 'status'])
    for (const p of view.participants) {
      expect(Object.keys(p).sort()).toEqual(['hasViewed', 'id', 'name'])
    }
    for (const link of view.revealLinks!) {
      expect(Object.keys(link).sort()).toEqual(['name', 'participantId', 'url'])
    }
  })

  it('a reveal link only ever names its own person', () => {
    const view = toAdminView(drawnGroup(), [{ participantId: 'a', name: 'Alice', url: 'https://x/reveal/t' }])
    expect(view.revealLinks).toEqual([{ participantId: 'a', name: 'Alice', url: 'https://x/reveal/t' }])
  })

  it('shows whether people have looked', () => {
    expect(toAdminView(drawnGroup()).participants.map(p => p.hasViewed)).toEqual([true, false, false])
  })
})

describe('toRevealView', () => {
  it('shows only the giver\'s own recipient', () => {
    expect(toRevealView(drawnGroup(), 'a')).toEqual({
      groupName: 'Test Family',
      budget: '£20',
      exchangeDate: '2026-12-25',
      giverName: 'Alice',
      recipientName: 'Bob',
      recipientWishlist: 'WISH_B',
    })
  })

  it('does not leak anyone else\'s match', () => {
    const json = JSON.stringify(toRevealView(drawnGroup(), 'a'))
    expect(json).not.toContain('Cara')
    expect(json).not.toContain('TOKEN')
  })

  it('returns null for unknown people or undrawn groups', () => {
    expect(toRevealView(drawnGroup(), 'zzz')).toBeNull()
    expect(toRevealView({ ...drawnGroup(), assignments: undefined }, 'a')).toBeNull()
  })
})

describe('groupTtlSeconds', () => {
  const DAY = 24 * 60 * 60
  it('expires 60 days after the exchange date', () => {
    const now = Date.parse('2026-12-25')
    expect(groupTtlSeconds({ createdAt: '2026-11-01', exchangeDate: '2026-12-25' }, now)).toBe(60 * DAY)
  })
  it('expires 120 days after creation if there is no date', () => {
    const now = Date.parse('2026-11-01')
    expect(groupTtlSeconds({ createdAt: '2026-11-01' }, now)).toBe(120 * DAY)
  })
  it('never goes below the KV minimum of 60 seconds', () => {
    expect(groupTtlSeconds({ createdAt: '2020-01-01' })).toBe(60)
  })
})
