// DELETE /api/groups/:id: delete the group and all its reveal links.
export default defineEventHandler(async (event) => {
  const group = await requireAdmin(event)
  await deleteGroup(group)
  return { ok: true }
})
