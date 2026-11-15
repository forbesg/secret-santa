// zod schemas for everything that comes into the API.
// Error messages here are shown to the user, so they're written for a 9-year-old.

import { z } from 'zod'
import { LIMITS } from '#shared/types'

/** Treat "" (an empty form field) as "not given". */
const emptyToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value)

export const idSchema = z.string().regex(/^[a-z0-9]{6,20}$/)

const nameSchema = z
  .string({ error: 'Please type a name.' })
  .trim()
  .min(1, 'Please type a name.')
  .max(LIMITS.nameMax, `That name is a bit long. Keep it under ${LIMITS.nameMax} letters.`)

const budgetSchema = z
  .string()
  .trim()
  .max(LIMITS.budgetMax, `Keep the budget short, like "£20".`)

/** YYYY-MM-DD, not in the past, and not silly far in the future. */
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please pick a date.')
  .refine(value => !Number.isNaN(Date.parse(value)), 'Please pick a date.')
  .refine((value) => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000
    return Date.parse(value) >= yesterday
  }, 'That date has already happened! Pick one in the future.')
  .refine((value) => {
    const twoYears = Date.now() + 2 * 365 * 24 * 60 * 60 * 1000
    return Date.parse(value) <= twoYears
  }, 'That date is a very long way away! Pick one sooner.')

export const createGroupSchema = z.object({
  name: nameSchema,
  budget: z.preprocess(emptyToUndefined, budgetSchema.optional()),
  exchangeDate: z.preprocess(emptyToUndefined, dateSchema.optional()),
})

/** PATCH: only send what changes. An empty string clears budget or date. */
export const updateGroupSchema = z.object({
  name: nameSchema.optional(),
  budget: budgetSchema.optional(),
  exchangeDate: z.union([z.literal(''), dateSchema]).optional(),
})

export const addParticipantSchema = z.object({
  name: nameSchema,
})
