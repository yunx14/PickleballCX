import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { brand } from '@/constants/brand';
import { border, cardShadow, radius, spacing } from '@/constants/theme';

export function Card({
  children,
  onPress,
  style,
  accent,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accent?: boolean;
}) {
  const content = (
    <View style={[styles.card, accent && styles.cardAccent, style]}>
      {accent ? <View style={styles.accentBar} /> : null}
      <View style={styles.cardInner}>{children}</View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    borderWidth: border.width,
    borderColor: border.color,
    overflow: 'hidden',
    ...cardShadow(),
  },
  cardAccent: {
    borderColor: brand.green100,
  },
  accentBar: {
    height: 4,
    backgroundColor: brand.green700,
  },
  cardInner: {
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.88,
  },
});
