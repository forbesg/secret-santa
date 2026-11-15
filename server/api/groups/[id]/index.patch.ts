// PATCH /api/groups/:id: change the group name, budget or date.
export default defineEventHandler(async (event) => {
  const group = await requireAdmin(event)
  const body = await parseBody(event, updateGroupSchema)

  if (body.name !== undefined) group.name = body.name
  if (body.budget !== undefined) group.budget = body.budget || undefined
  if (body.exchangeDate !== undefined) group.exchangeDate = body.exchangeDate || undefined

  await saveGroup(group)
  return toAdminView(group)
})
