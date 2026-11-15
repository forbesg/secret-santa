// Friendly errors. The `message` is shown to Ellen as-is, so keep it plain and kind.

import type { H3Event } from 'h3'
import type { z } from 'zod'

export function friendlyError(statusCode: number, message: string) {
  return createError({ statusCode, message })
}

export function notFound(message = 'We couldn\'t find that. Check the link is exactly right.') {
  return friendlyError(404, message)
}

/** Read the JSON body and check it with zod. Throws a 400 with the first problem in plain words. */
export async function parseBody<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.output<T>> {
  const body = await readBody(event).catch(() => undefined)
  const result = schema.safeParse(body ?? {})
  if (!result.success) {
    throw friendlyError(400, result.error.issues[0]?.message ?? 'Something in the form doesn\'t look right.')
  }
  return result.data
}

/** Check a route parameter (like :id) with zod. Anything odd is a 404. */
export function parseParam<T extends z.ZodType>(event: H3Event, name: string, schema: T): z.output<T> {
  const result = schema.safeParse(getRouterParam(event, name))
  if (!result.success) throw notFound()
  return result.data
}
