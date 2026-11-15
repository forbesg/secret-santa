// End-to-end API test: builds the real app (with in-memory storage) and talks to it over HTTP.
import { fileURLToPath } from 'node:url'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import type { AdminView, CreateGroupResponse, RevealLink, RevealView } from '#shared/types'

await setup({
  rootDir: fileURLToPath(new URL('..', import.meta.url)),
  server: true,
  browser: false,
  nuxtConfig: {
    nitro: {
      preset: 'node-server',
      storage: { santa: { driver: 'memory' } },
    },
  },
})

async function createGroup(name = 'Test Family') {
  const res = await $fetch<CreateGroupResponse>('/api/groups', { method: 'POST', body: { name, budget: '£20' } })
  const url = new URL(res.adminUrl)
  const key = url.searchParams.get('key')!
  const id = url.pathname.split('/').pop()!
  const admin = <T>(path: string, options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: object } = {}) =>
    $fetch<T>(`/api/groups/${id}${path}`, { ...options, headers: { 'x-admin-key': key } })
  return { res, id, key, admin }
}

async function statusOf(path: string, init: RequestInit = {}) {
  return (await fetch(path, init)).status
}

describe('Secret Santa API', () => {
  it('runs a whole Secret Santa without ever showing the admin who got whom', async () => {
    const { res, admin } = await createGroup()
    expect(res.group.status).toBe('draft')
    expect(res.adminUrl).toMatch(/\/admin\/[a-z0-9]{10}\?key=[\w-]{43}$/)

    for (const name of ['Ellen', 'Mum', 'Dad', 'Grandma']) {
      await admin('/participants', { method: 'POST', body: { name } })
    }

    const drawn = await admin<AdminView>('/draw', { method: 'POST' })
    expect(drawn.status).toBe('drawn')
    expect(drawn.revealLinks).toHaveLength(4)

    // Everyone opens their own link
    const recipients: string[] = []
    for (const link of drawn.revealLinks!) {
      const token = new URL(link.url).pathname.split('/').pop()!
      const reveal = await $fetch<RevealView>(`/api/reveal/${token}`)
      expect(reveal.giverName).toBe(link.name)
      expect(reveal.recipientName).not.toBe(link.name)
      expect(Object.keys(reveal).sort()).toEqual(['budget', 'giverName', 'groupName', 'recipientName'])
      recipients.push(reveal.recipientName)
    }
    expect(recipients.sort()).toEqual(['Dad', 'Ellen', 'Grandma', 'Mum'])

    // The admin view afterwards: everyone has looked, but no matches anywhere
    const after = await admin<AdminView>('')
    expect(after.participants.every(p => p.hasViewed)).toBe(true)
    expect(after).not.toHaveProperty('revealLinks')
    const json = JSON.stringify(after)
    expect(json).not.toContain('assignments')
    expect(json).not.toContain('recipient')
    expect(json).not.toContain('Hash')
    for (const p of after.participants) {
      expect(Object.keys(p).sort()).toEqual(['hasViewed', 'id', 'name'])
    }
  })

  it('hides groups behind a 404 when the key is wrong or missing', async () => {
    const { id } = await createGroup()
    expect(await statusOf(`/api/groups/${id}`)).toBe(404)
    expect(await statusOf(`/api/groups/${id}`, { headers: { 'x-admin-key': 'x'.repeat(43) } })).toBe(404)
    expect(await statusOf('/api/groups/doesnotexist', { headers: { 'x-admin-key': 'x'.repeat(43) } })).toBe(404)
  })

  it('needs at least 3 people, with a friendly message', async () => {
    const { admin } = await createGroup()
    await admin('/participants', { method: 'POST', body: { name: 'A' } })
    await admin('/participants', { method: 'POST', body: { name: 'B' } })
    await expect(admin('/draw', { method: 'POST' })).rejects.toMatchObject({
      data: { message: expect.stringContaining('at least 3 people') },
    })
  })

  it('validates input in plain words', async () => {
    const { admin } = await createGroup()
    await expect(admin('/participants', { method: 'POST', body: { name: '' } }))
      .rejects.toMatchObject({ data: { message: 'Please type a name.' } })
    await expect(admin('/participants', { method: 'POST', body: { name: 'x'.repeat(51) } }))
      .rejects.toMatchObject({ statusCode: 400 })
    await admin('/participants', { method: 'POST', body: { name: 'Sam' } })
    await expect(admin('/participants', { method: 'POST', body: { name: 'sam' } }))
      .rejects.toMatchObject({ data: { message: expect.stringContaining('already someone called') } })
  })

  it('locks the people list after the draw, and reset makes old links stop working', async () => {
    const { admin } = await createGroup()
    for (const name of ['A', 'B', 'C']) await admin('/participants', { method: 'POST', body: { name } })
    const drawn = await admin<AdminView>('/draw', { method: 'POST' })
    const oldToken = new URL(drawn.revealLinks![0]!.url).pathname.split('/').pop()!

    await expect(admin('/participants', { method: 'POST', body: { name: 'D' } })).rejects.toMatchObject({ statusCode: 409 })
    await expect(admin('/draw', { method: 'POST' })).rejects.toMatchObject({ statusCode: 409 })

    const reset = await admin<AdminView>('/reset', { method: 'POST' })
    expect(reset.status).toBe('draft')
    expect(await statusOf(`/api/reveal/${oldToken}`)).toBe(404)

    const redrawn = await admin<AdminView>('/draw', { method: 'POST' })
    expect(redrawn.revealLinks).toHaveLength(3)
  })

  it('a new link replaces the old one but keeps the same match', async () => {
    const { admin } = await createGroup()
    for (const name of ['A', 'B', 'C', 'D']) await admin('/participants', { method: 'POST', body: { name } })
    const drawn = await admin<AdminView>('/draw', { method: 'POST' })
    const first = drawn.revealLinks![0]!
    const oldToken = new URL(first.url).pathname.split('/').pop()!
    const before = await $fetch<RevealView>(`/api/reveal/${oldToken}`)

    const fresh = await admin<RevealLink>(`/participants/${first.participantId}/link`, { method: 'POST' })
    const newToken = new URL(fresh.url).pathname.split('/').pop()!

    expect(await statusOf(`/api/reveal/${oldToken}`)).toBe(404)
    const afterReveal = await $fetch<RevealView>(`/api/reveal/${newToken}`)
    expect(afterReveal.recipientName).toBe(before.recipientName)
  })

  it('deleting a group removes it and its reveal links', async () => {
    const { id, key, admin } = await createGroup()
    for (const name of ['A', 'B', 'C']) await admin('/participants', { method: 'POST', body: { name } })
    const drawn = await admin<AdminView>('/draw', { method: 'POST' })
    const token = new URL(drawn.revealLinks![0]!.url).pathname.split('/').pop()!

    await admin('', { method: 'DELETE' })
    expect(await statusOf(`/api/groups/${id}`, { headers: { 'x-admin-key': key } })).toBe(404)
    expect(await statusOf(`/api/reveal/${token}`)).toBe(404)
  })

  it('rejects made-up reveal links', async () => {
    expect(await statusOf('/api/reveal/nope')).toBe(404)
    expect(await statusOf(`/api/reveal/${'a'.repeat(43)}`)).toBe(404)
  })
})
