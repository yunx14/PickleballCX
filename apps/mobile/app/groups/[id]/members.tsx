import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { SkillBadge } from '@/components/ui/SkillBadge';
import { brand } from '@/constants/brand';
import { useGroupMembers } from '@/hooks/useGroupMembers';

export default function GroupMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: members, isLoading, error } = useGroupMembers(id!);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.green700} />
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
      data={members}
      keyExtractor={(item) => item.user_id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <Text style={styles.empty}>No members yet. Share your invite code to grow the group.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.memberCard}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberName}>{item.display_name || 'Player'}</Text>
            {item.role === 'admin' && <Text style={styles.adminBadge}>Admin</Text>}
          </View>
          <SkillBadge level={item.skill_level} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.sand,
  },
  container: {
    flex: 1,
    backgroundColor: brand.sand,
    padding: 20,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  memberCard: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 12,
    gap: 10,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontSize: 17,
    fontWeight: '700',
    color: brand.text,
  },
  adminBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.green700,
    backgroundColor: brand.green100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.muted,
  },
  error: {
    fontSize: 15,
    color: brand.danger,
  },
});
