import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import { useUpcomingEvents } from '@/hooks/useEvents';
import { useGroups } from '@/hooks/useGroups';
import { sessionsTabRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const { profile } = useAuth();
  const { data: events } = useUpcomingEvents();
  const { data: groups } = useGroups();

  const upcomingCount = events?.length ?? 0;
  const groupCount = groups?.length ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ScreenHeader
        eyebrow={`Hey, ${profile?.display_name ?? 'player'}`}
        title="Welcome back"
        subtitle="See what's coming up, manage your groups, and schedule your next game."
      />

      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Text style={styles.statValue}>{upcomingCount}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statValue}>{groupCount}</Text>
          <Text style={styles.statLabel}>Groups</Text>
        </View>
      </View>

      <Card accent onPress={() => router.push(sessionsTabRoute)}>
        <Text style={styles.cardTitle}>Sessions</Text>
        <Text style={styles.cardBody}>
          {upcomingCount === 0
            ? 'No upcoming sessions — tap to browse your feed'
            : `${upcomingCount} upcoming session${upcomingCount === 1 ? '' : 's'}`}
        </Text>
        <Text style={styles.cardLink}>View sessions →</Text>
      </Card>

      <Card onPress={() => router.push('/(tabs)/groups')}>
        <Text style={styles.cardTitle}>Groups</Text>
        <Text style={styles.cardBody}>
          {groupCount === 0
            ? 'Create or join a group to get started'
            : `${groupCount} group${groupCount === 1 ? '' : 's'}`}
        </Text>
        <Text style={styles.cardLink}>Manage groups →</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: brand.sand,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  statPill: {
    flex: 1,
    backgroundColor: brand.green100,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: brand.green900,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.green700,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: spacing.xs,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.muted,
  },
  cardLink: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: '700',
    color: brand.green700,
  },
});
