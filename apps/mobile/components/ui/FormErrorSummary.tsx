import { StyleSheet, Text, View } from 'react-native';
import type { FieldErrors } from 'react-hook-form';

import { brand } from '@/constants/brand';
import { border, radius, spacing, typography } from '@/constants/theme';

/**
 * Maps form field names to the label the user actually sees, so summary lines
 * can name the field they refer to.
 */
export type FieldLabels = Record<string, string>;

function messageFor(fieldError: unknown): string | null {
  if (!fieldError || typeof fieldError !== 'object') return null;
  const message = (fieldError as { message?: unknown }).message;
  return typeof message === 'string' && message.length ? message : null;
}

/**
 * Collects every field error into labelled lines. Iterates `labels` first so the
 * summary follows the visual order of the form rather than object key order,
 * then sweeps any remaining errors so a field missing from `labels` still shows.
 */
export function collectFormErrors(errors: FieldErrors, labels: FieldLabels): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const name of Object.keys(labels)) {
    const message = messageFor(errors[name]);
    if (!message) continue;
    seen.add(name);
    lines.push(`${labels[name]}: ${message}`);
  }

  for (const name of Object.keys(errors)) {
    if (seen.has(name)) continue;
    const message = messageFor(errors[name]);
    if (!message) continue;
    lines.push(labels[name] ? `${labels[name]}: ${message}` : message);
  }

  return lines;
}

export function FormErrorSummary({
  formError,
  errors,
  labels,
}: {
  /** Submit-time or server error that is not tied to a single field. */
  formError?: string;
  errors?: FieldErrors;
  labels?: FieldLabels;
}) {
  const fieldLines = errors ? collectFormErrors(errors, labels ?? {}) : [];
  const lines = formError ? [formError, ...fieldLines] : fieldLines;

  if (!lines.length) return null;

  const heading =
    lines.length > 1 ? 'Please fix the following' : 'There was a problem with this form';

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.heading}>{heading}</Text>
      {lines.map((line) => (
        <View key={line} style={styles.line}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.lineText}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: brand.dangerSurface,
    borderWidth: border.width,
    borderColor: brand.dangerBorder,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  heading: {
    ...typography.label,
    color: brand.danger,
    marginBottom: spacing.xs,
  },
  line: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    color: brand.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  lineText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: brand.text,
  },
});
