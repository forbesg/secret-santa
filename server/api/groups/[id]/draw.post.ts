// POST /api/groups/:id/draw: do the draw!
// This is the only response that includes everyone's reveal links, because the raw
// tokens exist only right now. It still never says who got whom.

export default defineEventHandler(async (event) => {
  const group = await requireAdmin(event)
  if (group.status === 'drawn') {
    throw friendlyError(409, 'The names have already been drawn! Press "Start again" if you want to draw again.')
  }

  try {
    group.assignments = draw(group.participants)
  }
  catch (error) {
    if (error instanceof NotEnoughPeopleError || error instanceof DrawImpossibleError) {
      throw friendlyError(400, error.message)
    }
    throw error
  }

  const revealLinks = []
  for (const participant of group.participants) {
    participant.viewedAt = undefined
    revealLinks.push(await issueRevealLink(event, group, participant))
  }
  group.status = 'drawn'
  await saveGroup(group)

  return toAdminView(group, revealLinks)
})
