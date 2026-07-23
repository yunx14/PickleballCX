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
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  beginner: {
    backgroundColor: brand.green100,
  },
  beginnerText: {
    color: brand.green900,
  },
  intermediate: {
    backgroundColor: '#FFF3CD',
  },
  intermediateText: {
    color: '#856404',
  },
  advanced: {
    backgroundColor: '#F8D7DA',
  },
  advancedText: {
    color: '#721C24',
  },
  unknown: {
    backgroundColor: '#E9ECEF',
  },
  unknownText: {
    color: brand.muted,
  },
});
