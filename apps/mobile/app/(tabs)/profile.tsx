import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SKILL_LEVEL_LABELS } from '@pickleballcx/shared';

import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { brand } from '@/constants/brand';
import { spacing, typography } from '@/constants/theme';
import { courtsRoute, privacyPolicyRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const isAppAdmin = profile?.is_app_admin ?? false;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ScreenHeader
        eyebrow="Account"
        title={profile?.display_name ?? 'Your profile'}
        subtitle="Self-reported skill helps groups match games."
      />

      <Card>
        <Text style={styles.label}>Skill level</Text>
        <Text style={styles.value}>
          {profile?.skill_level
            ? `${SKILL_LEVEL_LABELS[profile.skill_level]} (self-reported)`
            : 'Not set'}
        </Text>

        {isAppAdmin ? (
          <>
            <Text style={[styles.label, styles.labelSpaced]}>Role</Text>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>App admin</Text>
            </View>
          </>
        ) : null}
      </Card>

      {isAppAdmin ? (
        <PrimaryButton label="Manage courts" onPress={() => router.push(courtsRoute)} />
      ) : null}

      <PrimaryButton label="Sign out" onPress={signOut} />

      <Pressable onPress={() => router.push(privacyPolicyRoute)} style={styles.legalLink}>
        <Text style={styles.legalLinkText}>Privacy Policy</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: brand.sand,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  label: {
    ...typography.eyebrow,
    color: brand.muted,
    marginBottom: spacing.xs,
  },
  labelSpaced: {
    marginTop: spacing.lg,
  },
  value: {
    fontSize: 17,
    color: brand.text,
    fontWeight: '600',
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: brand.green100,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  adminBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.green900,
  },
  legalLink: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  legalLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: brand.green700,
  },
});
