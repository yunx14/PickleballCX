import { Linking, ScrollView, StyleSheet, Text } from 'react-native';

import { brand } from '@/constants/brand';
import { SUPPORT_EMAIL, supportMailtoUrl } from '@/constants/support';

export default function TermsOfServiceScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.updated}>Last updated: July 23, 2026</Text>

      <Text style={styles.paragraph}>
        These Terms of Service ("Terms") govern your use of PickleballCX ("the app", "we", "our").
        By creating an account or using the app, you agree to these Terms.
      </Text>

      <Text style={styles.heading}>The service</Text>
      <Text style={styles.paragraph}>
        PickleballCX helps pickleball groups coordinate sessions, courts, RSVPs, comments, and
        announcements. We may update features over time; material changes to these Terms will be
        reflected on this page.
      </Text>

      <Text style={styles.heading}>Your account</Text>
      <Text style={styles.paragraph}>
        You are responsible for your account credentials and for activity under your account. Provide
        accurate profile information, including your self-reported skill level. Do not impersonate
        others or share access to your account.
      </Text>

      <Text style={styles.heading}>Acceptable use</Text>
      <Text style={styles.paragraph}>
        Use the app only for lawful pickleball coordination. Do not harass other users, post
        spam, attempt to access data you are not permitted to see, or interfere with the service.
        Group admins are responsible for the culture and content of their groups.
      </Text>

      <Text style={styles.heading}>Content you create</Text>
      <Text style={styles.paragraph}>
        You retain ownership of content you submit (session details, comments, announcements, court
        notes). You grant us a license to store, display, and process that content solely to operate
        the app—for example, showing RSVPs to group members or sending notifications about sessions
        you participate in.
      </Text>

      <Text style={styles.heading}>Location and notifications</Text>
      <Text style={styles.paragraph}>
        Location and push notification permissions are optional. If enabled, location is used to
        filter nearby public sessions on your device; push tokens are stored so we can deliver alerts
        about sessions and group activity. See our Privacy Policy for details.
      </Text>

      <Text style={styles.heading}>Disclaimer</Text>
      <Text style={styles.paragraph}>
        The app is provided "as is" without warranties. We do not guarantee court availability,
        session attendance, skill accuracy, or that coordination through the app will meet your
        expectations. Pickleball play carries inherent physical risk; participate at your own
        discretion.
      </Text>

      <Text style={styles.heading}>Limitation of liability</Text>
      <Text style={styles.paragraph}>
        To the fullest extent permitted by law, PickleballCX and its operators are not liable for
        indirect, incidental, or consequential damages arising from your use of the app.
      </Text>

      <Text style={styles.heading}>Termination</Text>
      <Text style={styles.paragraph}>
        You may stop using the app at any time by signing out. We may suspend or terminate access
        for violations of these Terms or to protect the service and other users.
      </Text>

      <Text style={styles.heading}>Contact</Text>
      <Text style={styles.paragraph}>
        Questions about these Terms:{' '}
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
