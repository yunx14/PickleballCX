import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write a comment')
    .max(1000, 'Comment must be 1000 characters or less'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
