import type { Href } from 'expo-router';

/** Values a rebook can carry over from a session that already happened. */
export interface NewSessionPrefill {
  startsAt?: Date;
  durationMinutes?: number;
  sessionType?: string;
  maxPlayers?: number | null;
  skillMin?: string | null;
  skillMax?: string | null;
}

export function newSessionRoute(courtId: string, prefill?: NewSessionPrefill): Href {
  const params = new URLSearchParams({ courtId });

  if (prefill?.startsAt) params.set('startsAt', prefill.startsAt.toISOString());
  if (prefill?.durationMinutes != null) {
    params.set('durationMinutes', String(prefill.durationMinutes));
  }
  if (prefill?.sessionType) params.set('sessionType', prefill.sessionType);
  if (prefill?.maxPlayers != null) params.set('maxPlayers', String(prefill.maxPlayers));
  if (prefill?.skillMin) params.set('skillMin', prefill.skillMin);
  if (prefill?.skillMax) params.set('skillMax', prefill.skillMax);

  return `/sessions/new?${params.toString()}` as Href;
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
