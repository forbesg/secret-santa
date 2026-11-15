// Talks to the admin API for one group, attaching the secret admin key.
//
// The key arrives once as ?key=… in the admin link. We keep it in sessionStorage
// and remove it from the address bar, so it isn't left on screen or in history.

import type { AdminView, RevealLink } from '#shared/types'

export function useAdminApi(groupId: string) {
  const storageKey = `santa-admin-key:${groupId}`

  /** Call once on the client when the admin page loads. Returns the key, if we have one. */
  function captureKey(): string | null {
    const url = new URL(window.location.href)
    const fromUrl = url.searchParams.get('key')
    if (fromUrl) {
      sessionStorage.setItem(storageKey, fromUrl)
      url.searchParams.delete('key')
      history.replaceState(history.state, '', url.pathname + url.search + url.hash)
    }
    return sessionStorage.getItem(storageKey)
  }

  function key(): string {
    return sessionStorage.getItem(storageKey) ?? ''
  }

  /** The full admin link again, so Ellen can re-save it. */
  function adminUrl(): string {
    return `${window.location.origin}/admin/${groupId}?key=${key()}`
  }

  function call<T>(path: string, options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: Record<string, unknown> } = {}) {
    return $fetch<T>(`/api/groups/${groupId}${path}`, {
      method: options.method ?? 'GET',
      body: options.body,
      headers: { 'x-admin-key': key() },
    })
  }

  return {
    captureKey,
    adminUrl,
    getGroup: () => call<AdminView>(''),
    updateGroup: (changes: { name?: string, budget?: string, exchangeDate?: string }) =>
      call<AdminView>('', { method: 'PATCH', body: changes }),
    deleteGroup: () => call<{ ok: true }>('', { method: 'DELETE' }),
    addPerson: (person: { name: string }) =>
      call<AdminView>('/participants', { method: 'POST', body: person }),
    removePerson: (participantId: string) =>
      call<AdminView>(`/participants/${participantId}`, { method: 'DELETE' }),
    doDraw: () => call<AdminView>('/draw', { method: 'POST' }),
    reset: () => call<AdminView>('/reset', { method: 'POST' }),
    newLink: (participantId: string) =>
      call<RevealLink>(`/participants/${participantId}/link`, { method: 'POST' }),
  }
}
