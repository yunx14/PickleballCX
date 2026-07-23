import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { brand } from '@/constants/brand';
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
      <Text style={styles.greeting}>Hey, {profile?.display_name ?? 'player'} 👋</Text>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>
        See what's coming up, manage your groups, and schedule your next game.
      </Text>

      <Pressable
        onPress={() => router.push(sessionsTabRoute)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <Text style={styles.cardTitle}>Sessions</Text>
        <Text style={styles.cardBody}>
          {upcomingCount === 0
            ? 'No upcoming sessions — tap to view your feed'
            : `${upcomingCount} upcoming session${upcomingCount === 1 ? '' : 's'}`}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(tabs)/groups')}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <Text style={styles.cardTitle}>Groups</Text>
        <Text style={styles.cardBody}>
          {groupCount === 0
            ? 'Create or join a group to get started'
            : `${groupCount} group${groupCount === 1 ? '' : 's'}`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: brand.sand,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 12,
  },
  greeting: {
    fontSize: 16,
    color: brand.muted,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: brand.green900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.muted,
    marginBottom: 12,
  },
  card: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.muted,
  },
});
