// DELETE /api/groups/:id/participants/:pid: remove a person (before the draw only).
export default defineEventHandler(async (event) => {
  const group = await requireAdmin(event)
  requireDraft(group)
  const pid = parseParam(event, 'pid', idSchema)

  const before = group.participants.length
  group.participants = group.participants.filter(p => p.id !== pid)
  if (group.participants.length === before) throw notFound('That person isn\'t in this group.')

  // Tidy up any "must not get" rules that mentioned them
  for (const p of group.participants) {
    if (p.excludes) p.excludes = p.excludes.filter(id => id !== pid)
  }

  await saveGroup(group)
  return toAdminView(group)
})
