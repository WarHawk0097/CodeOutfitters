begin;

revoke update
on table public.ai_conversations
from authenticated;

revoke update, delete
on table public.ai_messages
from authenticated;

commit;