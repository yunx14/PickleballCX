import type { Href } from 'expo-router';

export function groupRoute(groupId: string): Href {
  return `/groups/${groupId}` as Href;
}

export function groupMembersRoute(groupId: string): Href {
  return `/groups/${groupId}/members` as Href;
}

export function groupSessionsRoute(groupId: string): Href {
  return `/groups/${groupId}/sessions` as Href;
}

export function groupAnnouncementsRoute(groupId: string): Href {
  return `/groups/${groupId}/announcements` as Href;
}

export function newGroupAnnouncementRoute(groupId: string): Href {
  return `/groups/${groupId}/announcements/new` as Href;
}

export function newSessionRoute(groupId?: string): Href {
  if (groupId) {
    return `/sessions/new?groupId=${groupId}` as Href;
  }
  return '/sessions/new' as Href;
}

export function sessionRoute(eventId: string): Href {
  return `/sessions/${eventId}` as Href;
}

export function editSessionRoute(eventId: string): Href {
  return `/sessions/${eventId}/edit` as Href;
}

export const courtsRoute = '/courts' as Href;
export const newCourtRoute = '/courts/new' as Href;

export function courtRoute(courtId: string): Href {
  return `/courts/${courtId}` as Href;
}

export const sessionsTabRoute = '/(tabs)/sessions' as Href;

export const createGroupRoute = '/(tabs)/groups/create' as Href;
export const joinGroupRoute = '/(tabs)/groups/join' as Href;
