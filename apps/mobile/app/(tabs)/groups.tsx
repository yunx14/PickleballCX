import { StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';

export default function GroupsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your groups</Text>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No groups yet</Text>
        <Text style={styles.emptyBody}>
          Create a group for your regular pickleball crew or join with an invite code. Groups keep
          courts, sessions, and members in one place.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.sand,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: brand.green900,
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.muted,
  },
});
