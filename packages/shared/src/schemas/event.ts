import { z } from 'zod';

import { SESSION_TYPES, SKILL_LEVELS } from '../constants';

export const createEventSchema = z.object({
  courtId: z.string().uuid('Select a court'),
  startsAt: z.date({ required_error: 'Pick a date and time' }),
  sessionType: z.enum(SESSION_TYPES, {
    required_error: 'Select a session type',
  }),
  maxPlayers: z.number().int().min(2, 'At least 2 players').max(100, 'Maximum 100 players').optional(),
  skillMin: z.enum(SKILL_LEVELS).optional(),
  skillMax: z.enum(SKILL_LEVELS).optional(),
  description: z.string().trim().max(500, 'Description must be 500 characters or less').optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
