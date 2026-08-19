import { router, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { UserNotification } from '@pickleballcx/shared';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { brand } from '@/constants/brand';
import { spacing, typography } from '@/constants/theme';
import { queryKeys } from '@/hooks/query-keys';
import {
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/format';
import { sessionRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export default function NotificationsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();

  useFocusEffect(
    useCallback(() => {
      void refetch();
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(userId),
      });
    }, [queryClient, refetch, userId]),
  );

  const handlePress = (item: UserNotification) => {
    if (!item.read_at) {
      markRead.mutate(item.id);
    }
    if (item.event_id) {
      router.push(sessionRoute(item.event_id));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.padded}>
          <EmptyState title="Could not load notifications" body={error.message} />
        </View>
      ) : !(data ?? []).length ? (
        <View style={styles.padded}>
          <EmptyState
            title="You’re all caught up"
            body="Activity on games you host or join will show up here."
          />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const unread = !item.read_at;
            return (
              <View style={styles.row}>
                <Card accent={unread} onPress={() => handlePress(item)}>
                  <View style={styles.metaRow}>
                    <Text style={[styles.title, unread && styles.titleUnread]}>{item.title}</Text>
                    <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
                  </View>
                  {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
                  {!item.event_id ? (
                    <Text style={styles.cancelled}>This session is no longer available.</Text>
                  ) : null}
                </Card>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.background,
  },
  padded: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  row: {
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    flex: 1,
  },
  titleUnread: {
    color: brand.text,
  },
  time: {
    ...typography.caption,
    fontSize: 12,
  },
  body: {
    ...typography.subtitle,
  },
  cancelled: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
});
