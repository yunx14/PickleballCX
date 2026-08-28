export const queryKeys = {
  groups: {
    all: ['groups'] as const,
    list: (userId?: string) => [...queryKeys.groups.all, 'list', userId] as const,
    detail: (groupId: string) => [...queryKeys.groups.all, 'detail', groupId] as const,
    members: (groupId: string) => [...queryKeys.groups.all, 'members', groupId] as const,
  },
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
    group: (groupId: string) => [...queryKeys.events.all, 'group', groupId] as const,
    court: (courtId: string) => [...queryKeys.events.all, 'court', courtId] as const,
    detail: (eventId: string) => [...queryKeys.events.all, 'detail', eventId] as const,
    rsvps: (eventId: string) => [...queryKeys.events.all, 'rsvps', eventId] as const,
    myRsvps: (userId?: string) => [...queryKeys.events.all, 'myRsvps', userId] as const,
    mine: (userId?: string, timeframe?: 'upcoming' | 'past') =>
      [...queryKeys.events.all, 'mine', userId, timeframe] as const,
    hostedUpcoming: (userId?: string) =>
      [...queryKeys.events.all, 'hostedUpcoming', userId] as const,
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
  announcements: {
    group: (groupId: string) => ['announcements', 'group', groupId] as const,
  },
  players: {
    discover: (filter?: Record<string, unknown>) =>
      ['players', 'discover', filter ?? {}] as const,
  },
  matchRequests: {
    all: (userId?: string) => ['matchRequests', userId] as const,
  },
  playerMessages: {
    conversation: (conversationId?: string) =>
      ['playerMessages', 'conversation', conversationId] as const,
    byMatchRequest: (matchRequestId?: string) =>
      ['playerMessages', 'matchRequest', matchRequestId] as const,
  },
  sessionInvites: {
    all: (userId?: string) => ['sessionInvites', userId] as const,
  },
  hostSessions: {
    upcoming: (userId?: string) => ['hostSessions', 'upcoming', userId] as const,
  },
};
