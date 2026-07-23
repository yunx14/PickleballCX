import { createCommentSchema } from '@pickleballcx/shared';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import {
  useCreateEventComment,
  useDeleteEventComment,
  useEventComments,
} from '@/hooks/useEventComments';
import { formatRelativeTime } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';

export function SessionComments({ eventId }: { eventId: string }) {
  const { session } = useAuth();
  const { data: comments, isLoading, error } = useEventComments(eventId);
  const createComment = useCreateEventComment(eventId);
  const deleteComment = useDeleteEventComment(eventId);
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState<string>();

  const handleSubmit = async () => {
    setFormError(undefined);

    const parsed = createCommentSchema.safeParse({ body });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid comment');
      return;
    }

    try {
      await createComment.mutateAsync(parsed.data.body);
      setBody('');
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Could not post comment');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Comments</Text>

      {isLoading ? (
        <ActivityIndicator color={brand.green700} style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>Could not load comments.</Text>
      ) : comments?.length === 0 ? (
        <Text style={styles.emptyText}>No comments yet. Ask a question or share an update.</Text>
      ) : (
        comments?.map((comment) => {
          const isOwn = comment.user_id === session?.user.id;
          const isDeleting =
            deleteComment.isPending && deleteComment.variables === comment.id;

          return (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.authorName}>{comment.display_name}</Text>
                <Text style={styles.timestamp}>{formatRelativeTime(comment.created_at)}</Text>
              </View>
              <Text style={styles.commentBody}>{comment.body}</Text>
              {isOwn && !comment.id.startsWith('optimistic-') ? (
                <Pressable
                  disabled={isDeleting}
                  onPress={() => deleteComment.mutate(comment.id)}
                  style={styles.deleteLink}>
                  <Text style={styles.deleteLinkText}>{isDeleting ? 'Deleting…' : 'Delete'}</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Write a comment…"
          placeholderTextColor={brand.muted}
          multiline
          maxLength={1000}
        />
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        <PrimaryButton
          label={createComment.isPending ? 'Posting…' : 'Post comment'}
          onPress={() => void handleSubmit()}
          disabled={createComment.isPending || !body.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 15,
    color: brand.muted,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: brand.danger,
    marginBottom: 8,
  },
  commentCard: {
    backgroundColor: brand.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 10,
    gap: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.text,
    flexShrink: 1,
  },
  timestamp: {
    fontSize: 12,
    color: brand.muted,
  },
  commentBody: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.text,
  },
  deleteLink: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  deleteLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.danger,
  },
  composer: {
    marginTop: 8,
    gap: 8,
  },
  input: {
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: brand.text,
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
