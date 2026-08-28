import type { Href } from 'expo-router';

export function newSessionRoute(courtId: string): Href {
  return `/sessions/new?courtId=${courtId}` as Href;
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

export const homeTabRoute = '/(tabs)' as Href;
export const mapTabRoute = '/(tabs)/map' as Href;
export const myGamesTabRoute = '/(tabs)/my-games' as Href;
export const profileTabRoute = '/(tabs)/profile' as Href;
export const notificationsRoute = '/(tabs)/notifications' as Href;

/** @deprecated Sessions live on Home; kept for existing navigation call sites. */
export const sessionsTabRoute = homeTabRoute;

export const privacyPolicyRoute = '/legal/privacy' as Href;
export const termsOfServiceRoute = '/legal/terms' as Href;
