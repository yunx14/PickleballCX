export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const PROFILE_VISIBILITY = ['group_only', 'public'] as const;
export type ProfileVisibility = (typeof PROFILE_VISIBILITY)[number];

export const COURT_TYPES = ['indoor', 'outdoor', 'both'] as const;
export type CourtType = (typeof COURT_TYPES)[number];

export const SESSION_TYPES = ['open_play', 'fixed_group'] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const EVENT_VISIBILITY = ['group_private', 'public'] as const;
export type EventVisibility = (typeof EVENT_VISIBILITY)[number];

export const RSVP_STATUSES = ['going', 'maybe', 'not_going', 'waitlist'] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const GROUP_MEMBER_ROLES = ['admin', 'member'] as const;
export type GroupMemberRole = (typeof GROUP_MEMBER_ROLES)[number];

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const APP_NAME = 'PickleballCX';
