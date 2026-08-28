import { z } from 'zod';

import { COURT_TYPES } from '../constants';

export const createCourtSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Court name is required')
    .min(2, 'Court name must be at least 2 characters')
    .max(100, 'Court name must be 100 characters or less'),
  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .min(5, 'Enter the full street address so players can find it')
    .max(200, 'Address must be 200 characters or less'),
  courtType: z.enum(COURT_TYPES, {
    required_error: 'Select indoor, outdoor, or both',
    invalid_type_error: 'Select indoor, outdoor, or both',
  }),
  numCourts: z.coerce
    .number({ invalid_type_error: 'Enter the number of courts as a number' })
    .int('Enter a whole number of courts')
    .min(1, 'There must be at least 1 court')
    .max(50, 'Enter 50 courts or fewer'),
  notes: z.string().trim().max(500, 'Notes must be 500 characters or less').optional(),
});

export type CreateCourtInput = z.infer<typeof createCourtSchema>;

export const updateCourtSchema = createCourtSchema;

export type UpdateCourtInput = z.infer<typeof updateCourtSchema>;
