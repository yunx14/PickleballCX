import { createPlayerMessageSchema } from '@pickleballcx/shared';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { border, radius, spacing } from '@/constants/theme';
import { useMatchRequests } from '@/hooks/useMatchRequests';
import {
  usePlayerConversation,
  usePlayerMessages,
  useSendPlayerMessage,
} from '@/hooks/usePlayerMessages';
import { formatRelativeTime } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';

export default function PlayerMessageScreen() {
  const { matchRequestId } = useLocalSearchParams<{ matchRequestId: string }>();
  const { session } = useAuth();
  const { data: matchRequests } = useMatchRequests();
  const { data: conversationId, isLoading: conversationLoading, error: conversationError } =
    usePlayerConversation(matchRequestId ?? '');
  const { data: messages, isLoading: messagesLoading, error: messagesError } =
    usePlayerMessages(conversationId);
  const sendMessage = useSendPlayerMessage(conversationId ?? '');
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState<string>();

  const otherName = useMemo(() => {
    const request = (matchRequests ?? []).find((item) => item.id === matchRequestId);
    return request?.other_display_name ?? 'Player';
  }, [matchRequestId, matchRequests]);

  const handleSubmit = async () => {
    if (!conversationId) return;
    setFormError(undefined);

    const parsed = createPlayerMessageSchema.safeParse({ body });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid message');
      return;
    }

    try {
      await sendMessage.mutateAsync(parsed.data.body);
      setBody('');
    } catch (submitError) {
      setFormError(
        submitError instanceof Error ? submitError.message : 'Could not send message',
      );
    }
  };

  if (!matchRequestId || !session?.user.id) {
    return (
      <View style={styles.container}>
        <EmptyState title="Conversation unavailable" body="Open this thread from a connected player." />
      </View>
    );
  }

  const matchRequest = (matchRequests ?? []).find((item) => item.id === matchRequestId);
  if (matchRequests && !matchRequest) {
    return (
      <View style={styles.container}>
        <EmptyState title="Conversation unavailable" body="This match connection could not be found." />
      </View>
    );
  }

  if (matchRequest && matchRequest.status !== 'accepted') {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Not connected yet"
          body="Accept the match request before messaging this player."
        />
      </View>
    );
  }

  if (conversationLoading || messagesLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  if (conversationError || messagesError) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Could not load messages"
          body={conversationError?.message ?? messagesError?.message ?? 'Try again later.'}
        />
      </View>
    );
  }

  if (!conversationId) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Setting up conversation"
          body="Your message thread is still being created. Pull back and try again in a moment."
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Chat with {otherName}</Text>

        {messages?.length === 0 ? (
          <Text style={styles.emptyText}>
            Say hello and coordinate your next game.
          </Text>
        ) : (
          messages?.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.is_own ? styles.messageRowOwn : styles.messageRowOther,
              ]}>
              <Card style={message.is_own ? styles.messageBubbleOwn : undefined}>
                {!message.is_own ? (
                  <Text style={styles.senderName}>{message.sender_display_name}</Text>
                ) : null}
                <Text style={styles.messageBody}>{message.body}</Text>
                <Text style={styles.messageTime}>{formatRelativeTime(message.created_at)}</Text>
              </Card>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder={`Message ${otherName}…`}
          placeholderTextColor={brand.muted}
          multiline
          maxLength={2000}
        />
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        <PrimaryButton
          label={sendMessage.isPending ? 'Sending…' : 'Send'}
          onPress={() => void handleSubmit()}
          disabled={sendMessage.isPending || !body.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: brand.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.background,
  },
  container: {
    flex: 1,
    backgroundColor: brand.background,
    padding: spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: brand.muted,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: brand.muted,
    lineHeight: 22,
  },
  messageRow: {
    maxWidth: '88%',
  },
  messageRowOwn: {
    alignSelf: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
  },
  messageBubbleOwn: {
    backgroundColor: brand.accentSurface,
    borderColor: brand.accent,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.muted,
    marginBottom: 4,
  },
  messageBody: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.text,
  },
  messageTime: {
    fontSize: 11,
    color: brand.muted,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  composer: {
    borderTopWidth: border.width,
    borderTopColor: brand.border,
    backgroundColor: brand.background,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: brand.surface,
    borderWidth: border.width,
    borderColor: brand.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: brand.text,
    minHeight: 44,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: brand.danger,
  },
});
