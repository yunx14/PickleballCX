import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import {
  useDeleteGroupAnnouncement,
  useGroupAnnouncements,
} from '@/hooks/useGroupAnnouncements';
import { useGroups } from '@/hooks/useGroups';
import { formatRelativeTime } from '@/lib/format';
import { newGroupAnnouncementRoute } from '@/lib/routes';

export default function GroupAnnouncementsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id!;
  const { data: groups } = useGroups();
  const { data: announcements, isLoading, error } = useGroupAnnouncements(groupId);
  const deleteAnnouncement = useDeleteGroupAnnouncement(groupId);

  const membership = groups?.find((item) => item.id === groupId);
  const isAdmin = membership?.role === 'admin';

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {isAdmin ? (
        <PrimaryButton
          label="New announcement"
          onPress={() => router.push(newGroupAnnouncementRoute(groupId))}
        />
      ) : null}

      {error ? (
        <Text style={styles.errorText}>Could not load announcements.</Text>
      ) : announcements?.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          body={
            isAdmin
              ? 'Post updates about schedule changes, court reservations, or group norms.'
              : 'Group admins can post announcements here.'
          }
        />
      ) : (
        announcements?.map((item) => {
          const isDeleting =
            deleteAnnouncement.isPending && deleteAnnouncement.variables === item.id;

          return (
            <Card key={item.id}>
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  {item.pinned ? (
                    <View style={styles.pinnedBadge}>
                      <Text style={styles.pinnedBadgeText}>Pinned</Text>
                    </View>
                  ) : null}
                  <Text style={styles.title}>{item.title}</Text>
                </View>
                <Text style={styles.meta}>
                  {item.author_name} · {formatRelativeTime(item.created_at)}
                </Text>
              </View>
              <Text style={styles.body}>{item.body}</Text>
              {isAdmin ? (
                <Pressable
                  disabled={isDeleting}
                  onPress={() => deleteAnnouncement.mutate(item.id)}
                  style={styles.deleteLink}>
                  <Text style={styles.deleteLinkText}>
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </Text>
                </Pressable>
              ) : null}
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.background,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  cardHeader: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  pinnedBadge: {
    backgroundColor: brand.accentSurface,
    borderWidth: 1,
    borderColor: brand.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pinnedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: brand.accent,
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    flexShrink: 1,
  },
  meta: {
    fontSize: 13,
    color: brand.muted,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.text,
  },
  deleteLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  deleteLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.danger,
  },
  errorText: {
    fontSize: 15,
    color: brand.danger,
  },
});
