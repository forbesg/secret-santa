// Making reveal links. The raw token only ever exists here and in the URL we hand back.

import type { H3Event } from 'h3'
import type { Group, Participant, RevealLink } from '#shared/types'
import { removeTokenEntry, saveTokenEntry } from './store'
import { generateToken, hashToken } from './tokens'

export function siteOrigin(event: H3Event): string {
  return getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin
}

/**
 * Give one person a brand-new reveal link (replacing any old one).
 * Updates participant.tokenHash in place; the caller must save the group afterwards.
 */
export async function issueRevealLink(event: H3Event, group: Group, participant: Participant): Promise<RevealLink> {
  if (participant.tokenHash) await removeTokenEntry(participant.tokenHash)

  const token = generateToken()
  const tokenHash = await hashToken(token)
  await saveTokenEntry(tokenHash, { groupId: group.id, participantId: participant.id }, group)
  participant.tokenHash = tokenHash

  return {
    participantId: participant.id,
    name: participant.name,
    url: `${siteOrigin(event)}/reveal/${token}`,
  }
}
