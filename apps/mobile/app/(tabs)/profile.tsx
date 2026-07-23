import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SKILL_LEVEL_LABELS } from '@pickleballcx/shared';

import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { courtsRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const isAppAdmin = profile?.is_app_admin ?? false;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Display name</Text>
        <Text style={styles.value}>{profile?.display_name ?? '—'}</Text>

        <Text style={styles.label}>Skill level</Text>
        <Text style={styles.value}>
          {profile?.skill_level
            ? `${SKILL_LEVEL_LABELS[profile.skill_level]} (self-reported)`
            : 'Not set'}
        </Text>

        {isAppAdmin ? (
          <>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>App admin</Text>
          </>
        ) : null}
      </View>

      {isAppAdmin ? (
        <PrimaryButton label="Manage courts" onPress={() => router.push(courtsRoute)} />
      ) : null}

      <PrimaryButton label="Sign out" onPress={signOut} />
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
  card: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 12,
  },
  value: {
    fontSize: 17,
    color: brand.text,
    fontWeight: '500',
  },
});
