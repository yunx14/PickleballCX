import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getPushPlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

async function registerForPushNotifications(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  if (!Device.isDevice) {
    console.info('Push notifications require a physical device.');
    return;
  }

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

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    (Notifications as unknown as { expoPushTokenProjectId?: string }).expoPushTokenProjectId;

  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
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
  }
}

export function usePushNotifications() {
  const { session, isProfileSetupComplete } = useAuth();

  useEffect(() => {
    if (!session?.user.id || !isProfileSetupComplete) return;

    void registerForPushNotifications(session.user.id);
  }, [session?.user.id, isProfileSetupComplete]);
}
