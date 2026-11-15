// The Secret Santa draw. Pure logic: no storage, no network.
//
// How it works: shuffle everyone, then each person gives to the next person
// in the shuffled list, and the last person gives to the first. That makes one
// big loop, so nobody can ever get themselves.

import { LIMITS } from '#shared/types'

/** Returns a number in [0, 1). Injectable so tests can be repeatable. */
export type Rng = () => number

export interface DrawPerson {
  id: string
  excludes?: string[] // ids this person must not get
}

export class NotEnoughPeopleError extends Error {
  constructor() {
    super(`You need at least ${LIMITS.participantsMin} people to do the draw, otherwise it's not a secret!`)
    this.name = 'NotEnoughPeopleError'
  }
}

export class DrawImpossibleError extends Error {
  constructor() {
    super('We couldn\'t find a way that follows all the rules — try removing one rule.')
    this.name = 'DrawImpossibleError'
  }
}

/** Random number from Web Crypto (better than Math.random). */
export const cryptoRng: Rng = () => {
  const [value] = crypto.getRandomValues(new Uint32Array(1))
  return value! / 2 ** 32
}

/** Fisher–Yates shuffle. Returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

/**
 * Work out who gives to whom.
 * @returns giverId → receiverId
 */
export function draw(
  people: readonly DrawPerson[],
  rng: Rng = cryptoRng,
  maxAttempts = 1000,
): Record<string, string> {
  if (people.length < LIMITS.participantsMin) throw new NotEnoughPeopleError()

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const order = shuffle(people, rng)
    const assignments: Record<string, string> = {}
    let ok = true

    for (let i = 0; i < order.length; i++) {
      const giver = order[i]!
      const receiver = order[(i + 1) % order.length]!
      if (giver.excludes?.includes(receiver.id)) {
        ok = false
        break
      }
      assignments[giver.id] = receiver.id
    }

    if (ok) return assignments
  }

  throw new DrawImpossibleError()
}
