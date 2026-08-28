-- Reminders need their own notification type so the client and the push payload can
-- tell "your game starts soon" apart from "the host changed something".
--
-- Kept in its own migration because a new enum value cannot be used in the same
-- transaction that adds it, and each migration file is applied in its own transaction.
alter type public.user_notification_type add value if not exists 'reminder';
