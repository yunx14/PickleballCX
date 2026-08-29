-- The prompt that closes the loop after a session: the host confirms who showed up,
-- players rate how it went. Separate from 'reminder' so the client can route the tap
-- to the right action.
--
-- Own migration because a new enum value cannot be used in the transaction that adds it.
alter type public.user_notification_type add value if not exists 'post_session';
