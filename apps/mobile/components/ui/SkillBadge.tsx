import type { SkillLevel } from '@pickleballcx/shared';
import { SKILL_LEVEL_LABELS } from '@pickleballcx/shared';
import { StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';

export function SkillBadge({ level }: { level: SkillLevel | null | undefined }) {
  if (!level) {
    return (
      <View style={[styles.badge, styles.unknown]}>
        <Text style={[styles.text, styles.unknownText]}>Skill not set</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles[level]]}>
      <Text style={[styles.text, styles[`${level}Text`]]}>{SKILL_LEVEL_LABELS[level]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  beginner: {
    backgroundColor: brand.accentSurface,
    borderColor: brand.accent,
  },
  beginnerText: {
    color: brand.accent,
  },
  intermediate: {
    backgroundColor: '#2A2200',
    borderColor: brand.warning,
  },
  intermediateText: {
    color: brand.warning,
  },
  advanced: {
    backgroundColor: '#2A1010',
    borderColor: brand.danger,
  },
  advancedText: {
    color: brand.danger,
  },
  unknown: {
    backgroundColor: brand.surfaceElevated,
    borderColor: brand.border,
  },
  unknownText: {
    color: brand.muted,
  },
});
