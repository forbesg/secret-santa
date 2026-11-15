// The ONLY way group data leaves the server.
// Every field is picked by hand, so new secret fields can never leak by accident.
// AdminView NEVER includes assignments or anyone's recipient.

import type { AdminView, Group, RevealLink, RevealView } from '#shared/types'

export function toAdminView(group: Group, revealLinks?: RevealLink[]): AdminView {
  const view: AdminView = {
    id: group.id,
    name: group.name,
    budget: group.budget,
    exchangeDate: group.exchangeDate,
    status: group.status,
    participants: group.participants.map(p => ({
      id: p.id,
      name: p.name,
      hasViewed: Boolean(p.viewedAt),
    })),
  }
  if (revealLinks) {
    view.revealLinks = revealLinks.map(link => ({
      participantId: link.participantId,
      name: link.name,
      url: link.url,
    }))
  }
  return view
}

/** What one person sees on their reveal page: only their own recipient. */
export function toRevealView(group: Group, participantId: string): RevealView | null {
  const giver = group.participants.find(p => p.id === participantId)
  const recipientId = group.assignments?.[participantId]
  const recipient = group.participants.find(p => p.id === recipientId)
  if (!giver || !recipient) return null

  return {
    groupName: group.name,
    budget: group.budget,
    exchangeDate: group.exchangeDate,
    giverName: giver.name,
    recipientName: recipient.name,
    recipientWishlist: recipient.wishlist,
  }
}
