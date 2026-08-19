import { Image, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';

export function Avatar({
  uri,
  name,
  size = 64,
}: {
  uri?: string | null;
  name?: string | null;
  size?: number;
}) {
  const initials = (name?.trim() || 'P')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} accessibilityLabel={`${name ?? 'Player'} photo`} />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.round(size * 0.34) }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: brand.accentSurface,
    borderWidth: 2,
    borderColor: brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontWeight: '800',
    color: brand.accent,
  },
});
