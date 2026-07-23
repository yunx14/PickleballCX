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
    upcoming: () => [...queryKeys.events.all, 'upcoming'] as const,
    group: (groupId: string) => [...queryKeys.events.all, 'group', groupId] as const,
    detail: (eventId: string) => [...queryKeys.events.all, 'detail', eventId] as const,
    rsvps: (eventId: string) => [...queryKeys.events.all, 'rsvps', eventId] as const,
  },
};
