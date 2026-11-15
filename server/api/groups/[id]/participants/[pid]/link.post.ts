// POST /api/groups/:id/participants/:pid/link: make a new reveal link for one person
// (e.g. they lost theirs). Their match stays the same; only the link changes,
// and the old link stops working.
import type { RevealLink } from '#shared/types'

export default defineEventHandler(async (event): Promise<RevealLink> => {
  const group = await requireAdmin(event)
  if (group.status !== 'drawn') {
    throw friendlyError(409, 'Do the draw first, then everyone gets a link.')
  }
  const pid = parseParam(event, 'pid', idSchema)
  const participant = group.participants.find(p => p.id === pid)
  if (!participant) throw notFound('That person isn\'t in this group.')

  const link = await issueRevealLink(event, group, participant)
  await saveGroup(group)
  return link
})
