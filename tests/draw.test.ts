import { describe, expect, it } from 'vitest'
import { draw, DrawImpossibleError, NotEnoughPeopleError, shuffle, type DrawPerson, type Rng } from '../server/utils/draw'

/** Small seeded random number generator (mulberry32) so failures can be reproduced. */
function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makePeople(n: number): DrawPerson[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}` }))
}

/** Checks every rule a valid draw must follow. */
function expectValidDraw(people: DrawPerson[], result: Record<string, string>) {
  const ids = people.map(p => p.id)
  const givers = Object.keys(result)
  const receivers = Object.values(result)

  // Everyone gives exactly once
  expect(givers.sort()).toEqual([...ids].sort())
  // Everyone receives exactly once
  expect([...receivers].sort()).toEqual([...ids].sort())
  // Nobody gets themselves
  for (const [giver, receiver] of Object.entries(result)) {
    expect(receiver).not.toBe(giver)
  }
  // It's one single loop that visits everyone
  const seen = new Set<string>()
  let current = ids[0]!
  while (!seen.has(current)) {
    seen.add(current)
    current = result[current]!
  }
  expect(current).toBe(ids[0])
  expect(seen.size).toBe(ids.length)
  // Exclusions are respected
  for (const person of people) {
    expect(person.excludes ?? []).not.toContain(result[person.id])
  }
}

describe('draw', () => {
  it('refuses fewer than 3 people with a friendly message', () => {
    expect(() => draw(makePeople(0))).toThrow(NotEnoughPeopleError)
    expect(() => draw(makePeople(1))).toThrow(NotEnoughPeopleError)
    expect(() => draw(makePeople(2))).toThrow(/at least 3 people/)
  })

  it('makes a valid draw for 3 to 30 people, many times over', () => {
    for (let n = 3; n <= 30; n++) {
      const people = makePeople(n)
      for (let run = 0; run < 200; run++) {
        expectValidDraw(people, draw(people, seededRng(n * 1000 + run)))
      }
    }
  })

  it('works with the real crypto random generator', () => {
    const people = makePeople(12)
    for (let run = 0; run < 200; run++) {
      expectValidDraw(people, draw(people))
    }
  })

  it('is repeatable when given the same seed', () => {
    const people = makePeople(10)
    expect(draw(people, seededRng(42))).toEqual(draw(people, seededRng(42)))
  })

  it('respects exclusions', () => {
    for (let n = 3; n <= 30; n++) {
      const people = makePeople(n).map((p, i) => ({
        ...p,
        // each person must not get the next person in the original list
        excludes: [`p${(i + 1) % n}`],
      }))
      for (let run = 0; run < 50; run++) {
        expectValidDraw(people, draw(people, seededRng(n * 7 + run)))
      }
    }
  })

  it('throws DrawImpossibleError when the rules cannot all be followed', () => {
    // With 3 people, p0 must give to p1 or p2. Excluding both is impossible.
    const people = [{ id: 'p0', excludes: ['p1', 'p2'] }, { id: 'p1' }, { id: 'p2' }]
    expect(() => draw(people, seededRng(1))).toThrow(DrawImpossibleError)
    expect(() => draw(people, seededRng(1))).toThrow(/try removing one rule/)
  })
})

describe('shuffle', () => {
  it('keeps the same items and does not change the original', () => {
    const items = [1, 2, 3, 4, 5]
    const result = shuffle(items, seededRng(3))
    expect([...result].sort()).toEqual(items)
    expect(items).toEqual([1, 2, 3, 4, 5])
  })
})
