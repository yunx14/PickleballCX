export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const COURT_TYPES = ['indoor', 'outdoor', 'both'] as const;
export type CourtType = (typeof COURT_TYPES)[number];

export const SESSION_TYPES = ['open_play', 'fixed_group'] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const RSVP_STATUSES = ['going', 'maybe', 'not_going', 'waitlist'] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const USER_NOTIFICATION_TYPES = [
  'comment',
  'rsvp',
  'event_updated',
  'event_cancelled',
] as const;
export type UserNotificationType = (typeof USER_NOTIFICATION_TYPES)[number];

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const COURT_TYPE_LABELS: Record<CourtType, string> = {
  indoor: 'Indoor',
  outdoor: 'Outdoor',
  both: 'Indoor & outdoor',
};

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  open_play: 'Open play',
  fixed_group: 'Fixed group size',
};

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  going: 'Going',
  maybe: 'Maybe',
  not_going: 'Not going',
  waitlist: 'Waitlist',
};

export const APP_NAME = 'PickleballCX';
