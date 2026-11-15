// POST /api/groups/:id/reset: "Start again". Forget the draw and all reveal links,
// so people can be changed and the draw done again.
export default defineEventHandler(async (event) => {
  const group = await requireAdmin(event)

  await removeGroupTokens(group)
  for (const participant of group.participants) {
    participant.tokenHash = undefined
    participant.viewedAt = undefined
  }
  group.assignments = undefined
  group.status = 'draft'
  await saveGroup(group)

  return toAdminView(group)
})
