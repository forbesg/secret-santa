// Admin access is by secret key only (no accounts).
// The key arrives in the x-admin-key header. We hash it and compare with the stored hash.
// Wrong group OR wrong key both give 404, so nobody can find out which group ids exist.

import type { H3Event } from 'h3'
import type { Group } from '#shared/types'
import { notFound, parseParam } from './errors'
import { idSchema } from './schemas'
import { getGroup } from './store'
import { hashToken, isTokenShaped, safeEqual } from './tokens'

export async function requireAdmin(event: H3Event): Promise<Group> {
  const id = parseParam(event, 'id', idSchema)
  const key = getHeader(event, 'x-admin-key')
  if (!isTokenShaped(key)) throw notFound()

  const group = await getGroup(id)
  if (!group) throw notFound()

  const keyHash = await hashToken(key)
  if (!safeEqual(keyHash, group.adminKeyHash)) throw notFound()

  return group
}

/** People can only be added or removed before the draw. */
export function requireDraft(group: Group) {
  if (group.status !== 'draft') {
    throw createError({
      statusCode: 409,
      message: 'The names have already been drawn. Press "Start again" if you want to change who\'s in.',
    })
  }
}
