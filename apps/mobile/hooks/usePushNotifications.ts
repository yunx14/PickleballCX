import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { getExpoProjectId, getPushSetupHint } from '@/lib/push-config';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

if (isNativePlatform) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function getPushPlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Session updates',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function registerForPushNotifications(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  if (!Device.isDevice) {
    console.info('Push notifications require a physical device.');
    return;
  }

  await ensureAndroidNotificationChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.info('Push notification permission not granted.');
    return;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    console.warn(`Push token registration skipped: missing Expo project ID. ${getPushSetupHint()}`);
    return;
  }

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResult.data;

    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: getPushPlatform(),
      },
      { onConflict: 'user_id,token' },
    );

    if (error) {
      console.error('Failed to save push token', error.message);
      return;
    }

    console.info('Push token registered.');
  } catch (error) {
    console.error(
      'Failed to register push token.',
      error instanceof Error ? error.message : error,
      getPushSetupHint(),
    );
  }
}

export function usePushNotifications() {
  const { session, isProfileSetupComplete } = useAuth();

  useEffect(() => {
    if (!isNativePlatform || !session?.user.id || !isProfileSetupComplete) return;

    void registerForPushNotifications(session.user.id);
  }, [session?.user.id, isProfileSetupComplete]);
}

export function useNotificationNavigation(onNavigate: (data: Record<string, unknown>) => void) {
  useEffect(() => {
    if (!isNativePlatform) return;

    const navigateFromNotification = (data: Record<string, unknown> | undefined) => {
      if (!data) return;
      onNavigate(data);
    };

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        navigateFromNotification(response.notification.request.content.data as Record<string, unknown>);
      },
    );

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        navigateFromNotification(response.notification.request.content.data as Record<string, unknown>);
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, [onNavigate]);
}
