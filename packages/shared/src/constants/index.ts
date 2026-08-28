export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const COURT_TYPES = ['indoor', 'outdoor', 'both'] as const;
export type CourtType = (typeof COURT_TYPES)[number];

export const SESSION_TYPES = ['open_play', 'fixed_group'] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

// Mirrors the events_duration_minutes_check constraint in the database.
export const MIN_SESSION_DURATION_MINUTES = 15;
export const MAX_SESSION_DURATION_MINUTES = 720;
export const DEFAULT_SESSION_DURATION_MINUTES = 90;

export const SESSION_DURATION_OPTIONS = [60, 90, 120, 180] as const;

export const RSVP_STATUSES = ['going', 'maybe', 'not_going', 'waitlist'] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const USER_NOTIFICATION_TYPES = [
  'comment',
  'rsvp',
  'event_updated',
  'event_cancelled',
  'reminder',
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

export function formatDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const hourLabel = `${hours} hr${hours === 1 ? '' : 's'}`;

  return remainder ? `${hourLabel} ${remainder} min` : hourLabel;
}

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  going: 'Going',
  maybe: 'Maybe',
  not_going: 'Not going',
  waitlist: 'Waitlist',
};

export const APP_NAME = 'PickleballCX';
