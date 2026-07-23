import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COURT_TYPE_LABELS } from '@pickleballcx/shared';

import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useCourts } from '@/hooks/useCourts';
import { courtRoute, newCourtRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export default function CourtsScreen() {
  const { profile } = useAuth();
  const isAppAdmin = profile?.is_app_admin ?? false;
  const { data: courts, isLoading, isRefetching, refetch, error } = useCourts();

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
        <PrimaryButton label="Try again" onPress={() => void refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={courts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.mapNote}>
              Global court catalog for all sessions. Addresses are geocoded when courts are saved.
            </Text>
            {isAppAdmin ? (
              <PrimaryButton label="Add court" onPress={() => router.push(newCourtRoute)} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No courts yet</Text>
            <Text style={styles.emptyBody}>
              {isAppAdmin
                ? 'Add the first court or venue so players can schedule sessions.'
                : 'Courts are added by app admins. Check back soon or ask an admin to add your local venues.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(courtRoute(item.id))}
            style={({ pressed }) => [styles.courtCard, pressed && styles.courtCardPressed]}>
            <Text style={styles.courtName}>{item.name}</Text>
            <Text style={styles.courtAddress}>{item.address}</Text>
            <Text style={styles.courtMeta}>
              {COURT_TYPE_LABELS[item.court_type]} · {item.num_courts} court
              {item.num_courts === 1 ? '' : 's'}
            </Text>
          </Pressable>
        )}
      />
    </View>
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
  listContainer: {
    flex: 1,
    backgroundColor: brand.sand,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    marginBottom: 16,
    gap: 12,
  },
  mapNote: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
    backgroundColor: brand.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  emptyCard: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.muted,
  },
  courtCard: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 12,
  },
  courtCardPressed: {
    opacity: 0.85,
  },
  courtName: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 4,
  },
  courtAddress: {
    fontSize: 14,
    color: brand.muted,
    marginBottom: 6,
  },
  courtMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.green700,
  },
  error: {
    fontSize: 15,
    color: brand.danger,
    marginBottom: 16,
  },
});
