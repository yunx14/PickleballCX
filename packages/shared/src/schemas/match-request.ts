import { z } from 'zod';

export const createMatchRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .max(500, 'Message must be 500 characters or less')
    .optional()
    .or(z.literal('')),
});

export type CreateMatchRequestInput = z.infer<typeof createMatchRequestSchema>;
