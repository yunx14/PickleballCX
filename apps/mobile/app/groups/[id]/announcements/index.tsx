import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
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
        <ActivityIndicator size="large" color={brand.green700} />
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
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No announcements yet</Text>
          <Text style={styles.emptyBody}>
            {isAdmin
              ? 'Post updates about schedule changes, court reservations, or group norms.'
              : 'Group admins can post announcements here.'}
          </Text>
        </View>
      ) : (
        announcements?.map((item) => {
          const isDeleting =
            deleteAnnouncement.isPending && deleteAnnouncement.variables === item.id;

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  {item.pinned ? <Text style={styles.pinnedBadge}>Pinned</Text> : null}
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
            </View>
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
    backgroundColor: brand.sand,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 8,
  },
  cardHeader: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pinnedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: brand.green900,
    backgroundColor: brand.green100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
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
    paddingVertical: 4,
  },
  deleteLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.danger,
  },
  emptyCard: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.muted,
  },
  errorText: {
    fontSize: 15,
    color: brand.danger,
  },
});
