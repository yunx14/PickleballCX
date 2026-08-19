import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PlayerCard } from '@/components/ui/PlayerCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterDropdown, type FilterDropdownOption } from '@/components/ui/FilterDropdown';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import {
  useCreateMatchRequest,
  useIncomingMatchRequestCount,
  useMatchRequests,
} from '@/hooks/useMatchRequests';
import { useIncomingSessionInviteCount } from '@/hooks/useSessionInvites';
import { useDiscoverPlayers } from '@/hooks/useDiscoverPlayers';
import { useUserLocation } from '@/hooks/useUserLocation';
import type { DiscoveryRadiusMi } from '@/lib/event-filters';
import { DISCOVERY_RADIUS_OPTIONS_MI } from '@/lib/event-filters';
import { getPlayerMatchAction } from '@/lib/match-request-state';
import {
  FORMAT_FILTER_ANY,
  SKILL_FILTER_ANY,
  type FormatFilter,
  type SkillFilter,
} from '@/lib/player-filters';
import { playerMessageRoute, playerRequestsRoute } from '@/lib/routes';
import {
  PLAY_FORMATS,
  PLAY_FORMAT_LABELS,
  SKILL_LEVELS,
  SKILL_LEVEL_LABELS,
} from '@pickleballcx/shared';
import { useAuth } from '@/providers/AuthProvider';

const FORMAT_FILTERS: FormatFilter[] = [FORMAT_FILTER_ANY, ...PLAY_FORMATS.filter((f) => f !== 'either')];
const SKILL_FILTERS: SkillFilter[] = [SKILL_FILTER_ANY, ...SKILL_LEVELS];

const SKILL_OPTIONS: FilterDropdownOption<SkillFilter>[] = SKILL_FILTERS.map((option) => ({
  value: option,
  label: option === SKILL_FILTER_ANY ? 'Any skill' : SKILL_LEVEL_LABELS[option],
}));

const FORMAT_OPTIONS: FilterDropdownOption<FormatFilter>[] = FORMAT_FILTERS.map((option) => ({
  value: option,
  label: option === FORMAT_FILTER_ANY ? 'Any format' : PLAY_FORMAT_LABELS[option],
}));

const DISTANCE_OPTIONS: FilterDropdownOption<DiscoveryRadiusMi>[] =
  DISCOVERY_RADIUS_OPTIONS_MI.map((option) => ({
    value: option,
    label: `Within ${option} mi`,
  }));

export default function PlayersScreen() {
  const { profile, session } = useAuth();
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>(SKILL_FILTER_ANY);
  const [formatFilter, setFormatFilter] = useState<FormatFilter>(FORMAT_FILTER_ANY);
  const [radiusMi, setRadiusMi] = useState<DiscoveryRadiusMi>(25);
  const [actionError, setActionError] = useState<string>();
  const [loadingPlayerId, setLoadingPlayerId] = useState<string | null>(null);

  const {
    data: locationResult,
    isLoading: locationLoading,
    refetch: refetchLocation,
  } = useUserLocation();

  const location = locationResult?.coords ?? null;
  const locationStatus = locationResult?.status ?? 'unavailable';

  const discoverFilter = useMemo(
    () => ({
      search,
      skill: skillFilter,
      format: formatFilter,
      radiusMi,
      viewerLat: location?.lat,
      viewerLng: location?.lng,
    }),
    [search, skillFilter, formatFilter, radiusMi, location],
  );

  const {
    data: players,
    isLoading: playersLoading,
    isRefetching,
    refetch: refetchPlayers,
    error,
  } = useDiscoverPlayers(discoverFilter);

  const { data: matchRequests, refetch: refetchMatchRequests } = useMatchRequests();
  const createMatchRequest = useCreateMatchRequest();
  const incomingCount = useIncomingMatchRequestCount();
  const incomingInviteCount = useIncomingSessionInviteCount();
  const pendingActivityCount = incomingCount + incomingInviteCount;

  const isLoading = playersLoading || locationLoading;

  const profileIncomplete =
    !profile?.discovery_enabled || !profile?.city?.trim() || !profile?.skill_level;

  const handleRefresh = () => {
    void refetchLocation();
    void refetchPlayers();
    void refetchMatchRequests();
  };

  const handleRequestMatch = async (playerId: string) => {
    setActionError(undefined);
    setLoadingPlayerId(playerId);

    try {
      await createMatchRequest.mutateAsync({ toUserId: playerId });
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not send match request';
      setActionError(
        message.includes('match_requests_one_pending_pair')
          ? 'A match request is already pending with this player.'
          : message,
      );
    } finally {
      setLoadingPlayerId(null);
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
      <FlatList
        data={players ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {pendingActivityCount > 0 ? (
              <Pressable
                style={styles.incomingBanner}
                onPress={() => router.push(playerRequestsRoute)}>
                <Text style={styles.incomingBannerTitle}>
                  {pendingActivityCount} pending request{pendingActivityCount === 1 ? '' : 's'}{' '}
                  {incomingInviteCount > 0 && incomingCount > 0
                    ? `(matches + invites)`
                    : incomingInviteCount > 0
                      ? '(session invites)'
                      : '(match requests)'}
                </Text>
                <Text style={styles.incomingBannerLink}>Review →</Text>
              </Pressable>
            ) : null}

            {profileIncomplete ? (
              <Pressable
                style={styles.profilePrompt}
                onPress={() => router.push('/(tabs)/profile')}>
                <Text style={styles.profilePromptTitle}>Complete your player profile</Text>
                <Text style={styles.profilePromptBody}>
                  Add your city, skill level, and turn on discovery so others can find you too.
                </Text>
                <Text style={styles.profilePromptLink}>Go to Profile →</Text>
              </Pressable>
            ) : null}

            {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Find players</Text>
                <Text style={styles.countLabel}>
                  {players?.length ?? 0} player{(players?.length ?? 0) === 1 ? '' : 's'}
                </Text>
              </View>

              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search player or city…"
                placeholderTextColor={brand.muted}
                autoCapitalize="words"
                autoCorrect={false}
              />

              <View style={styles.filterRow}>
                <FilterDropdown
                  value={skillFilter}
                  options={SKILL_OPTIONS}
                  onChange={setSkillFilter}
                  accessibilityLabel="Skill level filter"
                />
                <FilterDropdown
                  value={formatFilter}
                  options={FORMAT_OPTIONS}
                  onChange={setFormatFilter}
                  accessibilityLabel="Format filter"
                />
                <FilterDropdown
                  value={radiusMi}
                  options={DISTANCE_OPTIONS}
                  onChange={setRadiusMi}
                  disabled={!location}
                  accessibilityLabel="Distance filter"
                />
              </View>
            </View>

            {locationStatus === 'denied' ? (
              <Pressable onPress={() => void refetchLocation()} style={styles.secondaryLink}>
                <Text style={styles.secondaryLinkText}>Try enabling location again</Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          error ? (
            <EmptyState title="Could not load players" body={error.message} />
          ) : (
            <EmptyState
              title="No players found"
              body="Try a wider radius, different filters, or check back when more players join with discovery enabled."
            />
          )
        }
        renderItem={({ item }) => {
          const matchAction = getPlayerMatchAction(
            item.id,
            session?.user.id ?? '',
            matchRequests ?? [],
          );

          return (
            <PlayerCard
              player={item}
              viewerSkill={profile?.skill_level ?? null}
              viewerFormat={profile?.play_format ?? 'either'}
              radiusMi={radiusMi}
              matchAction={matchAction}
              actionLoading={loadingPlayerId === item.id}
              onRequestMatch={() => void handleRequestMatch(item.id)}
              onRespond={() => router.push(playerRequestsRoute)}
              onMessage={() => {
                if (matchAction.kind === 'connected') {
                  router.push(playerMessageRoute(matchAction.requestId));
                }
              }}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
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
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  headerBlock: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  incomingBanner: {
    backgroundColor: brand.accentSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.accent,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  incomingBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: brand.accent,
  },
  incomingBannerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.accent,
  },
  profilePrompt: {
    backgroundColor: brand.accentSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.accent,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  profilePromptTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: brand.accent,
  },
  profilePromptBody: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.text,
  },
  profilePromptLink: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.accent,
    marginTop: spacing.xs,
  },
  actionError: {
    fontSize: 14,
    color: brand.danger,
  },
  panel: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: brand.text,
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.muted,
    backgroundColor: brand.surfaceElevated,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  searchInput: {
    backgroundColor: brand.background,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: brand.text,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  separator: {
    height: spacing.md,
  },
  secondaryLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  secondaryLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.accent,
  },
});
