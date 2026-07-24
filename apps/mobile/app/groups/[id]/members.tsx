import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkillBadge } from '@/components/ui/SkillBadge';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import { useGroupMembers } from '@/hooks/useGroupMembers';

export default function GroupMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: members, isLoading, error } = useGroupMembers(id!);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error.message}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={members}
      keyExtractor={(item) => item.user_id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <EmptyState
          title="No members yet"
          body="Share your invite code to grow the group."
        />
      }
      renderItem={({ item }) => (
        <Card>
          <View style={styles.memberHeader}>
            <Text style={styles.memberName}>{item.display_name || 'Player'}</Text>
            {item.role === 'admin' ? (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            ) : null}
          </View>
          <SkillBadge level={item.skill_level} />
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.background,
  },
  container: {
    flex: 1,
    backgroundColor: brand.background,
    padding: spacing.xl,
  },
  list: {
    backgroundColor: brand.background,
  },
  listContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '700',
    color: brand.text,
    flexShrink: 1,
  },
  adminBadge: {
    backgroundColor: brand.accentSurface,
    borderWidth: 1,
    borderColor: brand.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: brand.accent,
    letterSpacing: 0.5,
  },
  error: {
    fontSize: 15,
    color: brand.danger,
  },
});
