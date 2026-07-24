import { z } from 'zod';

export const createPlayerMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write a message')
    .max(2000, 'Message must be 2000 characters or less'),
});

export type CreatePlayerMessageInput = z.infer<typeof createPlayerMessageSchema>;

export const createSessionInviteSchema = z.object({
  eventId: z.string().uuid('Select a session'),
  message: z
    .string()
    .trim()
    .max(500, 'Message must be 500 characters or less')
    .optional()
    .or(z.literal('')),
});

export type CreateSessionInviteInput = z.infer<typeof createSessionInviteSchema>;
