import { z } from 'zod';

import { COURT_TYPES } from '../constants';

export const createCourtSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Court name must be at least 2 characters')
    .max(100, 'Court name must be 100 characters or less'),
  address: z
    .string()
    .trim()
    .min(5, 'Enter a full address')
    .max(200, 'Address must be 200 characters or less'),
  courtType: z.enum(COURT_TYPES, {
    required_error: 'Select indoor, outdoor, or both',
  }),
  numCourts: z.coerce
    .number()
    .int('Must be a whole number')
    .min(1, 'At least 1 court')
    .max(50, 'Maximum 50 courts'),
  notes: z.string().trim().max(500, 'Notes must be 500 characters or less').optional(),
});

export type CreateCourtInput = z.infer<typeof createCourtSchema>;

export const updateCourtSchema = createCourtSchema;

export type UpdateCourtInput = z.infer<typeof updateCourtSchema>;
