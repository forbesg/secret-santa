// GET /api/reveal/:token: one person's reveal. Shows only who THEY are buying for.
const BROKEN_LINK = 'This link doesn\'t work any more. Ask the person running your Secret Santa for a new one.'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!isTokenShaped(token)) throw notFound(BROKEN_LINK)

  const tokenHash = await hashToken(token)
  const entry = await getTokenEntry(tokenHash)
  if (!entry) throw notFound(BROKEN_LINK)

  const group = await getGroup(entry.groupId)
  const participant = group?.participants.find(p => p.id === entry.participantId)
  // Double-check against the group itself, in case the index entry is stale
  if (!group || group.status !== 'drawn' || !participant?.tokenHash || !safeEqual(participant.tokenHash, tokenHash)) {
    throw notFound(BROKEN_LINK)
  }

  const view = toRevealView(group, participant.id)
  if (!view) throw notFound(BROKEN_LINK)

  if (!participant.viewedAt) {
    participant.viewedAt = new Date().toISOString()
    await saveGroup(group)
  }
  return view
})
