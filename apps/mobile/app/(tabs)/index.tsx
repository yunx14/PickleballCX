import { StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const { profile } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hey, {profile?.display_name ?? 'player'} 👋</Text>
      <Text style={styles.title}>Upcoming sessions</Text>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No sessions yet</Text>
        <Text style={styles.emptyBody}>
          Join a group and schedule your first pickleball session. This feed will show sessions
          across all your groups.
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
  greeting: {
    fontSize: 16,
    color: brand.muted,
    marginBottom: 4,
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
