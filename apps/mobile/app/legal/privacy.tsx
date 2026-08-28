import { Linking, ScrollView, StyleSheet, Text } from 'react-native';

import { brand } from '@/constants/brand';
import { SUPPORT_EMAIL, supportMailtoUrl } from '@/constants/support';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.updated}>Last updated: July 23, 2026</Text>

      <Text style={styles.paragraph}>
        PickleballCX ("we", "our", "the app") helps pickleball players find and coordinate
        sessions, courts, and RSVPs. This policy describes what we collect and how we use it.
      </Text>

      <Text style={styles.heading}>Information we collect</Text>
      <Text style={styles.paragraph}>
        Account information you provide: email, display name, profile photo (optional), and
        self-reported skill level.
      </Text>
      <Text style={styles.paragraph}>
        Session data you create: court locations, session times, RSVPs, and comments.
      </Text>
      <Text style={styles.paragraph}>
        Location data (optional): if you grant permission, we use your device location to show
        nearby public sessions. Location is not stored on our servers unless embedded in content
        you create (e.g. court addresses you enter).
      </Text>
      <Text style={styles.paragraph}>
        Push notification tokens: if you allow notifications on a mobile device, we store a device
        token so we can send session alerts.
      </Text>

      <Text style={styles.heading}>How we use information</Text>
      <Text style={styles.paragraph}>
        We use your data to operate the app: authentication, showing sessions near you, displaying
        attendee lists with skill levels, and sending notifications about sessions you host or
        joined.
      </Text>

      <Text style={styles.heading}>Sharing</Text>
      <Text style={styles.paragraph}>
        Session information (attendees, RSVPs, comments) is visible to other players in that
        session, and public sessions may be visible to all signed-in users. We do not sell your
        personal information.
      </Text>

      <Text style={styles.heading}>Data storage</Text>
      <Text style={styles.paragraph}>
        Data is stored in Supabase (PostgreSQL) with row-level security. See{' '}
        <Text style={styles.link}>supabase.com</Text> for their security practices.
      </Text>

      <Text style={styles.heading}>Your choices</Text>
      <Text style={styles.paragraph}>
        You can sign out at any time. You can deny location and notification permissions in your
        device settings. To delete your account, contact us at{' '}
        <Text
          accessibilityRole="link"
          onPress={() => void Linking.openURL(supportMailtoUrl)}
          style={styles.link}>
          {SUPPORT_EMAIL}
        </Text>
        .
      </Text>

      <Text style={styles.heading}>Contact</Text>
      <Text style={styles.paragraph}>
        Questions about this policy:{' '}
        <Text
          accessibilityRole="link"
          onPress={() => void Linking.openURL(supportMailtoUrl)}
          style={styles.link}>
          {SUPPORT_EMAIL}
        </Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
    backgroundColor: brand.background,
    flexGrow: 1,
  },
  updated: {
    fontSize: 13,
    color: brand.muted,
    marginBottom: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginTop: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.text,
  },
  link: {
    color: brand.accent,
    fontWeight: '600',
  },
});
