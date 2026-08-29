export const queryKeys = {
  courts: {
    all: ['courts'] as const,
    list: () => [...queryKeys.courts.all, 'list'] as const,
    detail: (courtId: string) => [...queryKeys.courts.all, 'detail', courtId] as const,
  },
  events: {
    all: ['events'] as const,
    upcoming: (filter?: {
      userId?: string;
      userSkill?: string | null;
      lat?: number;
      lng?: number;
      radiusMi?: number;
    }) => [...queryKeys.events.all, 'upcoming', filter ?? {}] as const,
    search: (filter?: Record<string, unknown>) =>
      [...queryKeys.events.all, 'search', filter ?? {}] as const,
    court: (courtId: string) => [...queryKeys.events.all, 'court', courtId] as const,
    detail: (eventId: string) => [...queryKeys.events.all, 'detail', eventId] as const,
    rsvps: (eventId: string) => [...queryKeys.events.all, 'rsvps', eventId] as const,
    myRsvps: (userId?: string) => [...queryKeys.events.all, 'myRsvps', userId] as const,
    mine: (userId?: string, timeframe?: 'upcoming' | 'past') =>
      [...queryKeys.events.all, 'mine', userId, timeframe] as const,
    hostedUpcoming: (userId?: string) =>
      [...queryKeys.events.all, 'hostedUpcoming', userId] as const,
    feedback: (eventId: string, userId?: string) =>
      [...queryKeys.events.all, 'feedback', eventId, userId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (userId?: string) => [...queryKeys.notifications.all, 'list', userId] as const,
    unreadCount: (userId?: string) =>
      [...queryKeys.notifications.all, 'unreadCount', userId] as const,
  },
  location: {
    current: () => ['location', 'current'] as const,
  },
  comments: {
    event: (eventId: string) => ['comments', 'event', eventId] as const,
  },
};
