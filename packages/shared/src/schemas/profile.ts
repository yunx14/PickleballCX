import { z } from 'zod';

import { PLAY_FORMATS, RANKED_PREFERENCES, SKILL_LEVELS } from '../constants';

export const profileSetupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be 50 characters or less'),
  skillLevel: z.enum(SKILL_LEVELS, {
    required_error: 'Pick your pickleball skill level',
    invalid_type_error: 'Pick your pickleball skill level',
  }),
});

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

export const profileEditSchema = profileSetupSchema.extend({
  city: z.string().trim().max(80, 'City must be 80 characters or less').optional(),
  playFormat: z.enum(PLAY_FORMATS, {
    required_error: 'Choose how you like to play',
    invalid_type_error: 'Choose how you like to play',
  }),
  rankedPreference: z.enum(RANKED_PREFERENCES, {
    required_error: 'Choose whether you want ranked games',
    invalid_type_error: 'Choose whether you want ranked games',
  }),
  discoveryEnabled: z.boolean(),
  availableNow: z.boolean(),
});

export type ProfileEditInput = z.infer<typeof profileEditSchema>;

export const signUpSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Enter a valid email address, like you@example.com'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Re-enter your password to confirm it'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address, like you@example.com'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof signInSchema>;