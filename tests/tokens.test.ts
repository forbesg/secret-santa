import { describe, expect, it } from 'vitest'
import { generateId, generateToken, hashToken, isTokenShaped, safeEqual } from '../server/utils/tokens'

describe('tokens', () => {
  it('generates 43-character base64url tokens that are all different', () => {
    const tokens = new Set(Array.from({ length: 500 }, generateToken))
    expect(tokens.size).toBe(500)
    for (const token of tokens) {
      expect(token).toMatch(/^[\w-]{43}$/)
      expect(isTokenShaped(token)).toBe(true)
    }
  })

  it('hashes with SHA-256 (known value)', async () => {
    expect(await hashToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('compares strings safely', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
    expect(safeEqual('', '')).toBe(true)
  })

  it('rejects things that are not token shaped', () => {
    expect(isTokenShaped('short')).toBe(false)
    expect(isTokenShaped(undefined)).toBe(false)
    expect(isTokenShaped('a'.repeat(42) + '/')).toBe(false)
  })

  it('generates short lowercase ids', () => {
    for (let i = 0; i < 200; i++) expect(generateId()).toMatch(/^[a-z0-9]{10}$/)
    expect(generateId(6)).toHaveLength(6)
  })
})
