import { isProfileComplete } from '@pickleballcx/shared';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SessionsFeed } from '@/components/sessions/SessionsFeed';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { spacing, typography } from '@/constants/theme';
import { profileTabRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const { profile } = useAuth();
  const showProfilePrompt = !isProfileComplete(profile) || !profile?.city?.trim();

  const header = (
    <View style={styles.headerBlock}>
      <Text style={styles.welcome}>Hey, {profile?.display_name ?? 'player'}</Text>
      {showProfilePrompt ? (
        <Card accent>
          <Text style={styles.promptTitle}>Finish your profile</Text>
          <Text style={styles.promptBody}>
            Add your city and how you like to play so other players know who you are.
          </Text>
          <View style={styles.promptAction}>
            <PrimaryButton label="Go to profile" onPress={() => router.push(profileTabRoute)} />
          </View>
        </Card>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <SessionsFeed header={header} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.background,
  },
  headerBlock: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  welcome: {
    ...typography.titleSm,
    fontSize: 20,
  },
  promptTitle: {
    ...typography.titleSm,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  promptBody: {
    ...typography.subtitle,
  },
  promptAction: {
    marginTop: spacing.lg,
  },
});
