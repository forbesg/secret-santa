// GET /api/groups/:id: the admin view (never includes who got whom).
export default defineEventHandler(async (event) => {
  const group = await requireAdmin(event)
  return toAdminView(group)
})
