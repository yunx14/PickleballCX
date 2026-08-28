import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Group name is required')
    .min(2, 'Group name must be at least 2 characters')
    .max(60, 'Group name must be 60 characters or less'),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const joinGroupSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(1, 'Invite code is required')
    .min(4, 'Invite codes are at least 4 characters')
    .max(20, 'Invite codes are at most 20 characters')
    .transform((value) => value.toUpperCase()),
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;

export function generateInviteCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
