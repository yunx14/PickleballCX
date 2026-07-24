import { StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import { border, cardShadow, radius, spacing, typography } from '@/constants/theme';

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: border.width,
    borderColor: border.color,
    ...cardShadow(),
  },
  title: {
    ...typography.titleSm,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.subtitle,
  },
  action: {
    marginTop: spacing.lg,
  },
});
