import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { notificationsRoute } from '@/lib/routes';

export function NotificationsHeaderButton() {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      onPress={() => router.push(notificationsRoute)}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <SymbolView
        name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
        tintColor={brand.text}
        size={24}
      />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 4,
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: brand.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: brand.white,
    fontSize: 9,
    fontWeight: '800',
  },
});
