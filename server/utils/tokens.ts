// Secret tokens: generated with crypto.getRandomValues, stored only as SHA-256 hashes.
// Works in Node and Cloudflare Workers (both have Web Crypto).

/** 32 random bytes, base64url encoded (43 characters, no padding). */
export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return toBase64Url(bytes)
}

/** SHA-256 of the token, as lowercase hex. This is what we store. */
export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Compare two strings without bailing out early, so timing doesn't leak how much matched. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/** Looks like a token we could have made? (Cheap check before touching storage.) */
export function isTokenShaped(value: unknown): value is string {
  return typeof value === 'string' && /^[\w-]{43}$/.test(value)
}

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Short random id (not secret), e.g. for groups and participants. Lowercase letters + digits. */
export function generateId(length = 10): string {
  let id = ''
  while (id.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length))
    for (const byte of bytes) {
      // 252 = 36 * 7, so rejecting bytes >= 252 keeps every character equally likely
      if (byte < 252 && id.length < length) id += ID_ALPHABET[byte % 36]
    }
  }
  return id
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
