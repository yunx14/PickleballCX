import { z } from 'zod';

import { PLAY_FORMATS, RANKED_PREFERENCES, SKILL_LEVELS } from '../constants';

export const profileSetupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be 50 characters or less'),
  skillLevel: z.enum(SKILL_LEVELS, {
    required_error: 'Pick your pickleball skill level',
  }),
});

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

export const profileEditSchema = profileSetupSchema.extend({
  city: z.string().trim().max(80, 'City must be 80 characters or less').optional(),
  playFormat: z.enum(PLAY_FORMATS),
  rankedPreference: z.enum(RANKED_PREFERENCES),
  discoveryEnabled: z.boolean(),
  availableNow: z.boolean(),
});

export type ProfileEditInput = z.infer<typeof profileEditSchema>;

export const signUpSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof signInSchema>;