import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SessionsFeed } from '@/components/sessions/SessionsFeed';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const { profile } = useAuth();
  const { data: groups } = useGroups();
  const groupCount = groups?.length ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <ScreenHeader
          eyebrow={`Hey, ${profile?.display_name ?? 'player'}`}
          title="Find a session"
          subtitle="Your feed of group and nearby open sessions."
        />

        {groupCount === 0 ? (
          <Card onPress={() => router.push('/(tabs)/groups')}>
            <Text style={styles.cardTitle}>Get started with a group</Text>
            <Text style={styles.cardBody}>
              Create or join a group to coordinate recurring games with your crew.
            </Text>
            <Text style={styles.cardLink}>Manage groups →</Text>
          </Card>
        ) : (
          <Pressable onPress={() => router.push('/(tabs)/groups')} style={styles.groupsLink}>
            <Text style={styles.groupsLinkText}>
              {groupCount} group{groupCount === 1 ? '' : 's'} · Manage groups →
            </Text>
          </Pressable>
        )}
      </View>

      <SessionsFeed />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.background,
  },
  headerBlock: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
    marginBottom: spacing.xs,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
  },
  cardLink: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: '700',
    color: brand.accent,
  },
  groupsLink: {
    alignSelf: 'flex-start',
  },
  groupsLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.accent,
  },
});
