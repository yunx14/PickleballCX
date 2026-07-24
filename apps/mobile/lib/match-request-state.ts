import type { MatchRequest } from '@pickleballcx/shared';

export type PlayerMatchAction =
  | { kind: 'request' }
  | { kind: 'pending_outgoing'; requestId: string }
  | { kind: 'respond'; requestId: string }
  | { kind: 'connected'; requestId: string };

/** Pick the most relevant match request row between the viewer and a discovered player. */
export function getPlayerMatchAction(
  playerId: string,
  viewerId: string,
  requests: MatchRequest[],
): PlayerMatchAction {
  const relevant = requests.filter(
    (request) =>
      (request.from_user_id === viewerId && request.to_user_id === playerId) ||
      (request.from_user_id === playerId && request.to_user_id === viewerId),
  );

  const pendingIncoming = relevant.find(
    (request) => request.status === 'pending' && request.to_user_id === viewerId,
  );
  if (pendingIncoming) {
    return { kind: 'respond', requestId: pendingIncoming.id };
  }

  const pendingOutgoing = relevant.find(
    (request) => request.status === 'pending' && request.from_user_id === viewerId,
  );
  if (pendingOutgoing) {
    return { kind: 'pending_outgoing', requestId: pendingOutgoing.id };
  }

  const accepted = relevant.find((request) => request.status === 'accepted');
  if (accepted) {
    return { kind: 'connected', requestId: accepted.id };
  }

  return { kind: 'request' };
}

export function getOtherUserId(request: MatchRequest, viewerId: string): string {
  return request.from_user_id === viewerId ? request.to_user_id : request.from_user_id;
}

export function isIncomingRequest(request: MatchRequest, viewerId: string): boolean {
  return request.to_user_id === viewerId;
}
