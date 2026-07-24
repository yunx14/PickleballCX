import { router } from 'expo-router';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import {
  useNotificationNavigation,
  usePushNotifications,
} from '@/hooks/usePushNotifications';
import {
  groupAnnouncementsRoute,
  playerMessageRoute,
  playerRequestsRoute,
  sessionRoute,
} from '@/lib/routes';

const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

export function PushNotificationRegistration() {
  if (!isNativePlatform) {
    return null;
  }

  return <NativePushNotificationRegistration />;
}

function NativePushNotificationRegistration() {
  usePushNotifications();

  const handleNavigate = useCallback((data: Record<string, unknown>) => {
    const screen = typeof data.screen === 'string' ? data.screen : undefined;

    if (screen === 'session' && typeof data.eventId === 'string') {
      router.push(sessionRoute(data.eventId));
      return;
    }

    if (screen === 'announcements' && typeof data.groupId === 'string') {
      router.push(groupAnnouncementsRoute(data.groupId));
      return;
    }

    if (screen === 'match_requests') {
      router.push(playerRequestsRoute);
      return;
    }

    if (screen === 'player_message' && typeof data.matchRequestId === 'string') {
      router.push(playerMessageRoute(data.matchRequestId));
      return;
    }

    if (screen === 'session_invite') {
      router.push(playerRequestsRoute);
    }
  }, []);

  useNotificationNavigation(handleNavigate);

  return null;
}

