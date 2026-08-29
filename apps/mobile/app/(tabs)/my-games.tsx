import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/Screen';
import { SessionCard } from '@/components/ui/SessionCard';
import { brand } from '@/constants/brand';
import { radius, spacing } from '@/constants/theme';
import { useMyPastEvents, useMyUpcomingEvents, type EventRow } from '@/hooks/useEvents';
import { useSessionCardColumns } from '@/hooks/useSessionCardColumns';
import { mapTabRoute, newSessionRoute, sessionRoute } from '@/lib/routes';

type GamesTab = 'upcoming' | 'past';

const TABS: { id: GamesTab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
];

/**
 * Rebooking keeps the shape of the old game and moves it to the same weekday and time
 * in the next week that has not happened yet, which is the usual reason someone taps it.
 */
function rebookRoute(event: EventRow) {
  const startsAt = new Date(event.starts_at);

  while (startsAt.getTime() <= Date.now()) {
    startsAt.setDate(startsAt.getDate() + 7);
  }

  return newSessionRoute(event.court_id, {
    startsAt,
    durationMinutes: event.duration_minutes,
    sessionType: event.session_type,
    maxPlayers: event.max_players,
    skillMin: event.skill_min,
    skillMax: event.skill_max,
  });
}

export default function MyGamesScreen() {
  const [tab, setTab] = useState<GamesTab>('upcoming');
  const upcomingQuery = useMyUpcomingEvents();
  const pastQuery = useMyPastEvents();
  const { cardWidth, gap } = useSessionCardColumns();

  const activeQuery = tab === 'upcoming' ? upcomingQuery : pastQuery;
  const games = activeQuery.data ?? [];
  const isLoading = activeQuery.isLoading;
  const isRefetching = upcomingQuery.isRefetching || pastQuery.isRefetching;
  const error = activeQuery.error;

  const handleRefresh = () => {
    void upcomingQuery.refetch();
    void pastQuery.refetch();
  };

  return (
    <View style={styles.container}>
      <View accessibilityRole="tablist" style={styles.tabBar}>
        {TABS.map((item) => {
          const selected = item.id === tab;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setTab(item.id)}
              style={({ pressed }) => [
                styles.tab,
                selected && styles.tabSelected,
                pressed && !selected && styles.tabPressed,
              ]}>
              <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brand.accent} />
        </View>
      ) : error ? (
        <View style={styles.padded}>
          <EmptyState title="Could not load your games" body={error.message} />
        </View>
      ) : !games.length ? (
        <View style={styles.padded}>
          {tab === 'upcoming' ? (
            <EmptyState
              title="No upcoming games"
              body="Schedule a session from the map, or RSVP to a game on Home."
              action={
                <PrimaryButton label="Find a court" onPress={() => router.push(mapTabRoute)} />
              }
            />
          ) : (
            <EmptyState
              title="No past games"
              body="Games you hosted or RSVP’d to will show up here after they end."
            />
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }>
          <View style={[styles.grid, { gap }]}>
            {games.map((item) => (
              <View key={item.id} style={{ width: cardWidth }}>
                <SessionCard event={item} onPress={() => router.push(sessionRoute(item.id))} />
                {tab === 'past' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Play ${item.courts?.name ?? 'this session'} again`}
                    onPress={() => router.push(rebookRoute(item))}
                    style={({ pressed }) => [styles.rebookButton, pressed && styles.rebookPressed]}>
                    <Text style={styles.rebookLabel}>Play this again</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
          {tab === 'upcoming' ? (
            <Pressable onPress={() => router.push(mapTabRoute)} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Find a court</Text>
            </Pressable>
          ) : null}
        </ScrollView>
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: 4,
    backgroundColor: brand.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: brand.border,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  tabSelected: {
    backgroundColor: brand.accent,
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.muted,
  },
  tabLabelSelected: {
    color: brand.accentText,
  },
  padded: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rebookButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.surface,
  },
  rebookPressed: {
    opacity: 0.7,
  },
  rebookLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.accent,
  },
  footerLink: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerLinkText: {
    color: brand.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
