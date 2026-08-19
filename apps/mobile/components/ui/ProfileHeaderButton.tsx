import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { brand } from '@/constants/brand';
import { profileTabRoute } from '@/lib/routes';

export function ProfileHeaderButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profile"
      onPress={() => router.push(profileTabRoute)}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <SymbolView
        name={{ ios: 'person.crop.circle', android: 'person', web: 'person' }}
        tintColor={brand.text}
        size={26}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 12,
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
