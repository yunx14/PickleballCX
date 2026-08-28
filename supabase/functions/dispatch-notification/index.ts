import { createClient } from 'npm:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

interface WebhookPayload {
  table: string;
  type: string;
  record: Record<string, unknown>;
  recipient_ids?: unknown;
  message?: unknown;
  minutes_until_start?: unknown;
}

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

function parseRecipientIds(payload: WebhookPayload): string[] {
  const raw = payload.recipient_ids;
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((id) => String(id)).filter((id) => id.length > 0))];
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
    if (payload.type === 'UPDATE') {
      return buildEventUpdatedNotifications(supabase, payload, record);
    }
    // CANCEL comes from cancel_event, which soft cancels rather than deleting.
    if (payload.type === 'DELETE' || payload.type === 'CANCEL') {
      return buildEventCancelledNotifications(supabase, payload, record);
    }
    if (payload.type === 'REMINDER') {
      return buildReminderNotifications(supabase, payload, record);
    }
    if (payload.type === 'BROADCAST') {
      return buildBroadcastNotifications(supabase, payload, record);
    }
    return [];
  }

  if (table === 'event_comments') {
    return buildCommentNotifications(supabase, payload, record);
  }

  if (table === 'event_rsvps') {
    return buildRsvpNotifications(supabase, payload, record);
  }

  return [];
}

async function buildCommentNotifications(
  supabase: ReturnType<typeof createClient>,
  payload: WebhookPayload,
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

  let recipientIds = parseRecipientIds(payload);

  if (recipientIds.length === 0) {
    const { data: rsvps, error: rsvpError } = await supabase
      .from('event_rsvps')
      .select('user_id')
      .eq('event_id', eventId)
      .in('status', ['going', 'maybe', 'waitlist']);

    if (rsvpError) {
      console.error('Failed to load RSVPs for comment push', rsvpError.message);
      return [];
    }

    const ids = new Set<string>();
    if (event.created_by && event.created_by !== authorId) {
      ids.add(event.created_by);
    }

    for (const rsvp of rsvps ?? []) {
      if (rsvp.user_id !== authorId) {
        ids.add(rsvp.user_id);
      }
    }
    recipientIds = [...ids];
  }

  const tokens = await fetchTokensForUsers(supabase, recipientIds);
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

async function courtNameForEvent(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  courtId?: string,
): Promise<string> {
  if (eventId) {
    const { data: event } = await supabase
      .from('events')
      .select('courts ( name )')
      .eq('id', eventId)
      .maybeSingle();
    const court = event?.courts && !Array.isArray(event.courts) ? event.courts : null;
    if (court?.name?.trim()) return court.name.trim();
  }

  if (courtId) {
    const { data: court } = await supabase.from('courts').select('name').eq('id', courtId).maybeSingle();
    if (court?.name?.trim()) return court.name.trim();
  }

  return 'a session';
}

async function buildRsvpNotifications(
  supabase: ReturnType<typeof createClient>,
  payload: WebhookPayload,
  record: Record<string, unknown>,
): Promise<PushMessage[]> {
  const eventId = String(record.event_id ?? '');
  const actorId = String(record.user_id ?? '');
  const status = String(record.status ?? '');
  const recipientIds = parseRecipientIds(payload);

  if (!eventId || !actorId || recipientIds.length === 0) return [];

  const { data: actor } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', actorId)
    .maybeSingle();

  const actorName = actor?.display_name?.trim() || 'A player';
  const courtName = await courtNameForEvent(supabase, eventId);
  const statusLabel =
    status === 'waitlist' ? 'waitlisted' : status === 'not_going' ? 'not going' : status || 'RSVP';
  const tokens = await fetchTokensForUsers(supabase, recipientIds);

  return tokens.map((token) => ({
    to: token,
    title: 'New RSVP',
    body: `${actorName} marked ${statusLabel} · ${courtName}`,
    data: { eventId, screen: 'session' },
  }));
}

async function buildEventUpdatedNotifications(
  supabase: ReturnType<typeof createClient>,
  payload: WebhookPayload,
  record: Record<string, unknown>,
): Promise<PushMessage[]> {
  const eventId = String(record.id ?? '');
  const recipientIds = parseRecipientIds(payload);
  if (!eventId || recipientIds.length === 0) return [];

  const courtName = await courtNameForEvent(supabase, eventId, String(record.court_id ?? ''));
  const tokens = await fetchTokensForUsers(supabase, recipientIds);

  return tokens.map((token) => ({
    to: token,
    title: 'Session updated',
    body: `${courtName} was updated`,
    data: { eventId, screen: 'session' },
  }));
}

async function buildEventCancelledNotifications(
  supabase: ReturnType<typeof createClient>,
  payload: WebhookPayload,
  record: Record<string, unknown>,
): Promise<PushMessage[]> {
  const eventId = String(record.id ?? '');
  const recipientIds = parseRecipientIds(payload);
  if (recipientIds.length === 0) return [];

  const courtName = await courtNameForEvent(
    supabase,
    eventId,
    record.court_id ? String(record.court_id) : undefined,
  );
  const tokens = await fetchTokensForUsers(supabase, recipientIds);
  const reason = String(record.cancellation_reason ?? '').trim();

  return tokens.map((token) => ({
    to: token,
    title: 'Session cancelled',
    body: reason ? `${courtName} was cancelled · ${reason}` : `${courtName} was cancelled`,
    data: eventId ? { eventId, screen: 'session' } : { screen: 'session' },
  }));
}

async function buildReminderNotifications(
  supabase: ReturnType<typeof createClient>,
  payload: WebhookPayload,
  record: Record<string, unknown>,
): Promise<PushMessage[]> {
  const eventId = String(record.id ?? '');
  const recipientIds = parseRecipientIds(payload);
  if (!eventId || recipientIds.length === 0) return [];

  const courtName = await courtNameForEvent(supabase, eventId, String(record.court_id ?? ''));
  const tokens = await fetchTokensForUsers(supabase, recipientIds);
  const minutes = Number(payload.minutes_until_start);
  // Relative wording, because the sender has no idea what time zone the player is in.
  const when = Number.isFinite(minutes) && minutes > 0 ? `in about ${Math.round(minutes)} minutes` : 'soon';

  return tokens.map((token) => ({
    to: token,
    title: 'Starting soon',
    body: `${courtName} starts ${when}`,
    data: { eventId, screen: 'session' },
  }));
}

async function buildBroadcastNotifications(
  supabase: ReturnType<typeof createClient>,
  payload: WebhookPayload,
  record: Record<string, unknown>,
): Promise<PushMessage[]> {
  const eventId = String(record.id ?? '');
  const recipientIds = parseRecipientIds(payload);
  const message = String(payload.message ?? '').trim();
  if (!eventId || !message || recipientIds.length === 0) return [];

  const courtName = await courtNameForEvent(supabase, eventId, String(record.court_id ?? ''));
  const tokens = await fetchTokensForUsers(supabase, recipientIds);
  const preview = message.length > 120 ? `${message.slice(0, 117)}…` : message;

  return tokens.map((token) => ({
    to: token,
    title: `Host update · ${courtName}`,
    body: preview,
    data: { eventId, screen: 'session' },
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
