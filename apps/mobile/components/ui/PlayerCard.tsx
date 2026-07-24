import {
  PLAY_FORMAT_LABELS,
  RANKED_PREFERENCE_LABELS,
  SKILL_LEVEL_LABELS,
  type PlayFormat,
  type SkillLevel,
} from '@pickleballcx/shared';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import { border, radius, spacing } from '@/constants/theme';
import type { PlayerMatchAction } from '@/lib/match-request-state';
import type { DiscoverPlayerRow } from '@/lib/player-filters';
import { computeMatchFit, formatPlayerLocation } from '@/lib/player-filters';
import type { DiscoveryRadiusMi } from '@/lib/event-filters';

export function PlayerCard({
  player,
  viewerSkill,
  viewerFormat,
  radiusMi,
  matchAction,
  actionLoading,
  onRequestMatch,
  onRespond,
  onMessage,
}: {
  player: DiscoverPlayerRow;
  viewerSkill: SkillLevel | null;
  viewerFormat: PlayFormat;
  radiusMi: DiscoveryRadiusMi;
  matchAction: PlayerMatchAction;
  actionLoading?: boolean;
  onRequestMatch: () => void;
  onRespond: () => void;
  onMessage: () => void;
}) {
  const initials = player.display_name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const matchFit = computeMatchFit(
    { skill_level: viewerSkill, play_format: viewerFormat },
    player,
    radiusMi,
  );

  const renderAction = () => {
    if (actionLoading) {
      return (
        <View style={styles.actionLoading}>
          <ActivityIndicator color={brand.accent} size="small" />
        </View>
      );
    }

    switch (matchAction.kind) {
      case 'respond':
        return (
          <Pressable
            onPress={onRespond}
            style={({ pressed }) => [styles.actionPrimary, pressed && styles.actionPressed]}>
            <Text style={styles.actionPrimaryText}>Respond</Text>
          </Pressable>
        );
      case 'pending_outgoing':
        return (
          <View style={styles.actionPending}>
            <Text style={styles.actionPendingText}>Pending…</Text>
          </View>
        );
      case 'connected':
        return (
          <Pressable
            onPress={onMessage}
            style={({ pressed }) => [styles.actionPrimary, pressed && styles.actionPressed]}>
            <Text style={styles.actionPrimaryText}>Message</Text>
          </Pressable>
        );
      case 'request':
      default:
        return (
          <Pressable
            onPress={onRequestMatch}
            style={({ pressed }) => [styles.actionOutline, pressed && styles.actionPressed]}>
            <Text style={styles.actionOutlineText}>Request match</Text>
          </Pressable>
        );
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{player.display_name}</Text>
          <Text style={styles.location}>{formatPlayerLocation(player)}</Text>
          <View style={styles.tagRow}>
            <Tag label={PLAY_FORMAT_LABELS[player.play_format]} />
            <Tag label={RANKED_PREFERENCE_LABELS[player.ranked_preference]} muted />
            {player.available_now ? <Tag label="Available now" accent /> : null}
          </View>
        </View>

        <View style={styles.metrics}>
          <Text style={styles.skillValue}>{SKILL_LEVEL_LABELS[player.skill_level]}</Text>
          <Text style={styles.matchFit}>{matchFit}% match fit</Text>
        </View>
      </View>

      <View style={styles.actionRow}>{renderAction()}</View>
    </View>
  );
}

function Tag({
  label,
  accent,
  muted,
}: {
  label: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <View
      style={[
        styles.tag,
        accent && styles.tagAccent,
        muted && styles.tagMuted,
      ]}>
      <Text
        style={[
          styles.tagText,
          accent && styles.tagTextAccent,
          muted && styles.tagTextMuted,
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: brand.surface,
    borderRadius: radius.lg,
    borderWidth: border.width,
    borderColor: brand.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: brand.surfaceElevated,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: brand.text,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: brand.text,
  },
  location: {
    fontSize: 13,
    color: brand.muted,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    backgroundColor: brand.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tagAccent: {
    borderColor: brand.accent,
    backgroundColor: brand.accentSurface,
  },
  tagMuted: {
    backgroundColor: brand.surface,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: brand.text,
  },
  tagTextAccent: {
    color: brand.accent,
  },
  tagTextMuted: {
    color: brand.muted,
  },
  metrics: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 72,
  },
  skillValue: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.text,
    textAlign: 'right',
  },
  matchFit: {
    fontSize: 11,
    color: brand.muted,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionOutline: {
    borderWidth: 1,
    borderColor: brand.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  actionOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.accent,
  },
  actionPrimary: {
    backgroundColor: brand.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  actionPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: brand.accentText,
  },
  actionPending: {
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  actionPendingText: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.muted,
  },
  actionConnected: {
    borderWidth: 1,
    borderColor: brand.accent,
    backgroundColor: brand.accentSurface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  actionConnectedText: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.accent,
  },
  actionLoading: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  actionPressed: {
    opacity: 0.85,
  },
});
