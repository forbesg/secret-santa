// Types shared by the server and the app.
// The `Group` / `Participant` shapes are what we store in KV.
// `AdminView` / `RevealView` are the ONLY shapes that leave the server
// (built in server/utils/serialize.ts).

export const LIMITS = {
  nameMax: 50,
  budgetMax: 30,
  wishlistMax: 500,
  participantsMax: 50,
  participantsMin: 3,
} as const

export interface Participant {
  id: string
  name: string
  tokenHash?: string // set at draw time
  viewedAt?: string
  wishlist?: string // Phase 3
  excludes?: string[] // Phase 3: participant ids this person must not draw
}

export interface Group {
  id: string
  name: string
  budget?: string
  exchangeDate?: string // YYYY-MM-DD
  createdAt: string
  adminKeyHash: string
  status: 'draft' | 'drawn'
  participants: Participant[]
  assignments?: Record<string, string> // giverId → receiverId. NEVER sent to admin.
}

// Stored at token:<tokenHash>
export interface TokenIndexEntry {
  groupId: string
  participantId: string
}

export interface AdminParticipantView {
  id: string
  name: string
  hasViewed: boolean
}

export interface RevealLink {
  participantId: string
  name: string
  url: string
}

export interface AdminView {
  id: string
  name: string
  budget?: string
  exchangeDate?: string
  status: 'draft' | 'drawn'
  participants: AdminParticipantView[]
  revealLinks?: RevealLink[] // only in the response to POST /draw
}

export interface CreateGroupResponse {
  group: AdminView
  adminUrl: string
}

export interface RevealView {
  groupName: string
  budget?: string
  exchangeDate?: string
  giverName: string
  recipientName: string
  recipientWishlist?: string
}
