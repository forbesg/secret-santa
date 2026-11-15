// POST /api/groups/:id/participants: add a person (before the draw only).
import { LIMITS } from '#shared/types'

export default defineEventHandler(async (event) => {
  const group = await requireAdmin(event)
  requireDraft(group)
  const body = await parseBody(event, addParticipantSchema)

  if (group.participants.length >= LIMITS.participantsMax) {
    throw friendlyError(400, `That's the most people we can fit (${LIMITS.participantsMax})!`)
  }
  const sameName = group.participants.some(p => p.name.toLowerCase() === body.name.toLowerCase())
  if (sameName) {
    throw friendlyError(400, `There's already someone called ${body.name}. Try adding their last name too.`)
  }

  group.participants.push({ id: generateId(8), name: body.name })
  await saveGroup(group)

  setResponseStatus(event, 201)
  return toAdminView(group)
})
