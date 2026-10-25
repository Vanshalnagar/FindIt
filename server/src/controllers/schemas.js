import { z } from 'zod';
import { CATEGORIES } from '../models/Item.js';

const str = (min, max, label) =>
  z.string({ error: `${label} is required` }).trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

export const registerSchema = z.object({
  name: str(2, 60, 'Name'),
  email: z.string({ error: 'Email is required' }).trim().toLowerCase().max(254).email('Email is invalid'),
  password: z.string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a digit'),
});

export const loginSchema = z.object({
  email: z.string({ error: 'Email is required' }).trim().toLowerCase().min(1, 'Email is required'),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required').max(200),
});

const dateField = z.string({ error: 'Date is required' }).trim().min(1, 'Date is required')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Date is invalid')
  .refine((v) => Number.isNaN(Date.parse(v)) || Date.parse(v) <= Date.now() + 14 * 3600 * 1000, 'Date cannot be in the future')
  .transform((v) => new Date(v));

const itemFields = {
  title: str(3, 100, 'Title'),
  description: str(10, 1000, 'Description'),
  category: z.enum(CATEGORIES, { error: `Category must be one of: ${CATEGORIES.join(', ')}` }),
  location: str(2, 120, 'Location'),
  date: dateField,
};

export const createItemSchema = z.object({
  type: z.enum(['lost', 'found'], { error: "Type must be 'lost' or 'found'" }),
  ...itemFields,
});

export const updateItemSchema = z.object({
  ...Object.fromEntries(Object.entries(itemFields).map(([k, v]) => [k, v.optional()])),
  status: z.enum(['open', 'resolved', 'closed'], { error: 'Status is invalid' }).optional(),
  removeImage: z.enum(['true', 'false']).or(z.boolean()).optional(),
});

export const listItemsSchema = z.object({
  search: z.string().trim().max(100).optional(),
  type: z.enum(['lost', 'found']).optional().or(z.literal('').transform(() => undefined)),
  category: z.enum(CATEGORIES).optional().or(z.literal('').transform(() => undefined)),
  status: z.enum(['open', 'resolved', 'closed']).optional().or(z.literal('').transform(() => undefined)),
  location: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).catch(9).default(9),
});

export const adminListSchema = z.object({
  status: z.enum(['open', 'resolved', 'closed']).optional().or(z.literal('').transform(() => undefined)),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20).default(20),
});

export const createClaimSchema = z.object({
  message: str(10, 500, 'Message'),
  proof: str(10, 1000, 'Proof'),
});

export const updateClaimSchema = z.object({
  status: z.enum(['accepted', 'rejected'], { error: "Status must be 'accepted' or 'rejected'" }),
});

export const hideSchema = z.object({
  hidden: z.boolean({ error: 'hidden must be a boolean' }),
});
