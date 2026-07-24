import { createClient } from 'npm:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

interface WebhookPayload {
  table: string;
  type: string;
  record: Record<string, unknown>;
}

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

function formatSessionTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function fetchTokensForUsers(
  supabase: ReturnType<typeof createClient>,
  userIds: string[],
): Promise<string[]> {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('push_tokens')
    .select('token')
    .in('user_id', userIds);

  if (error) {
    console.error('Failed to load push tokens', error.message);
    return [];
  }

  return [...new Set((data ?? []).map((row) => row.token))];
}

async function sendExpoPush(messages: PushMessage[]): Promise<number> {
  if (messages.length === 0) return 0;

  let sent = 0;

  for (let index = 0; index < messages.length; index += EXPO_BATCH_SIZE) {
    const batch = messages.slice(index, index + EXPO_BATCH_SIZE);
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      console.error('Expo push request failed', await response.text());
      continue;
    }

    sent += batch.length;
  }

  return sent;
}

async function buildNotifications(
  supabase: ReturnType<typeof createClient>,
  payload: WebhookPayload,
): Promise<PushMessage[]> {
  const { table, record } = payload;

  if (table === 'events') {
    return buildNewSessionNotifications(supabase, record);
  }

  if (table === 'event_comments') {
    return buildCommentNotifications(supabase, record);
  }

  if (table === 'group_announcements') {
    return buildAnnouncementNotifications(supabase, record);
  }

  return [];
}

async function buildNewSessionNotifications(
  supabase: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
): Promise<PushMessage[]> {
  const eventId = String(record.id ?? '');
  const groupId = record.group_id ? String(record.group_id) : null;
  const createdBy = String(record.created_by ?? '');
  const startsAt = String(record.starts_at ?? '');

  if (!eventId || !groupId) {
    // Public/open sessions: skip broadcast push in MVP.
    return [];
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, starts_at, courts ( name ), groups ( name )')
    .eq('id', eventId)
    .maybeSingle();

  if (eventError || !event) {
    console.error('Failed to load event for push', eventError?.message);
    return [];
  }

  const court = event.courts && !Array.isArray(event.courts) ? event.courts : null;
  const group = event.groups && !Array.isArray(event.groups) ? event.groups : null;
  const courtName = court?.name?.trim() || 'Pickleball session';
  const groupName = group?.name?.trim() || 'Your group';

  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .neq('user_id', createdBy);

  if (membersError) {
    console.error('Failed to load group members for push', membersError.message);
    return [];
  }

  const userIds = (members ?? []).map((member) => member.user_id);
  const tokens = await fetchTokensForUsers(supabase, userIds);

  return tokens.map((token) => ({
    to: token,
    title: 'New session posted',
    body: `${groupName} · ${courtName} · ${formatSessionTime(startsAt || event.starts_at)}`,
    data: { eventId, screen: 'session' },
  }));
}

async function buildCommentNotifications(
  supabase: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
): Promise<PushMessage[]> {
  const eventId = String(record.event_id ?? '');
  const authorId = String(record.user_id ?? '');
  const body = String(record.body ?? '').trim();

  if (!eventId || !authorId) return [];

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, created_by, courts ( name )')
    .eq('id', eventId)
    .maybeSingle();

  if (eventError || !event) {
    console.error('Failed to load event for comment push', eventError?.message);
    return [];
  }

  const { data: rsvps, error: rsvpError } = await supabase
    .from('event_rsvps')
    .select('user_id')
    .eq('event_id', eventId)
    .in('status', ['going', 'maybe']);

  if (rsvpError) {
    console.error('Failed to load RSVPs for comment push', rsvpError.message);
    return [];
  }

  const recipientIds = new Set<string>();
  if (event.created_by && event.created_by !== authorId) {
    recipientIds.add(event.created_by);
  }

  for (const rsvp of rsvps ?? []) {
    if (rsvp.user_id !== authorId) {
      recipientIds.add(rsvp.user_id);
    }
  }

  const tokens = await fetchTokensForUsers(supabase, [...recipientIds]);
  const court = event.courts && !Array.isArray(event.courts) ? event.courts : null;
  const courtName = court?.name?.trim() || 'your session';
  const preview = body.length > 80 ? `${body.slice(0, 77)}…` : body;

  return tokens.map((token) => ({
    to: token,
    title: 'New comment',
    body: `${courtName}: ${preview}`,
    data: { eventId, screen: 'session' },
  }));
}

async function buildAnnouncementNotifications(
  supabase: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
): Promise<PushMessage[]> {
  const groupId = String(record.group_id ?? '');
  const authorId = String(record.author_id ?? '');
  const title = String(record.title ?? '').trim();
  const body = String(record.body ?? '').trim();

  if (!groupId || !authorId) return [];

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .maybeSingle();

  if (groupError) {
    console.error('Failed to load group for announcement push', groupError.message);
    return [];
  }

  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .neq('user_id', authorId);

  if (membersError) {
    console.error('Failed to load members for announcement push', membersError.message);
    return [];
  }

  const userIds = (members ?? []).map((member) => member.user_id);
  const tokens = await fetchTokensForUsers(supabase, userIds);
  const groupName = group?.name?.trim() || 'Your group';
  const preview = body.length > 80 ? `${body.slice(0, 77)}…` : body;

  return tokens.map((token) => ({
    to: token,
    title: title || `${groupName} announcement`,
    body: preview || 'New group announcement',
    data: { groupId, screen: 'announcements' },
  }));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const expectedSecret = Deno.env.get('NOTIFICATION_WEBHOOK_SECRET');
  const providedSecret = req.headers.get('x-webhook-secret');

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const messages = await buildNotifications(supabase, payload);
  const sent = await sendExpoPush(messages);

  return new Response(JSON.stringify({ sent, queued: messages.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
