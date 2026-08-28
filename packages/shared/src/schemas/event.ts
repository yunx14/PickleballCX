import { z } from 'zod';

import {
  MAX_SESSION_DURATION_MINUTES,
  MIN_SESSION_DURATION_MINUTES,
  SESSION_TYPES,
  SKILL_LEVELS,
} from '../constants';

export const createEventSchema = z.object({
  courtId: z.string().uuid('Select a court for this session'),
  startsAt: z.date({
    required_error: 'Pick a date and time for the session',
    invalid_type_error: 'Pick a date and time for the session',
  }),
  durationMinutes: z
    .number({
      required_error: 'Choose how long the session runs',
      invalid_type_error: 'Choose how long the session runs',
    })
    .int('Enter the length in whole minutes')
    .min(MIN_SESSION_DURATION_MINUTES, `A session must run at least ${MIN_SESSION_DURATION_MINUTES} minutes`)
    .max(MAX_SESSION_DURATION_MINUTES, `A session must run ${MAX_SESSION_DURATION_MINUTES / 60} hours or less`),
  sessionType: z.enum(SESSION_TYPES, {
    required_error: 'Select a session type',
    invalid_type_error: 'Select a session type',
  }),
  maxPlayers: z
    .number({ invalid_type_error: 'Enter the player limit as a number' })
    .int('Enter a whole number of players')
    .min(2, 'A session needs room for at least 2 players')
    .max(100, 'Enter 100 players or fewer')
    .optional(),
  skillMin: z.enum(SKILL_LEVELS).optional(),
  skillMax: z.enum(SKILL_LEVELS).optional(),
  description: z.string().trim().max(500, 'Description must be 500 characters or less').optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
