-- =============================================================================
-- Collega ogni appuntamento all'evento su Google Calendar.
-- Supabase: SQL Editor > New query > incolla > Run
-- Si può eseguire più di una volta: se la colonna c'è già, non fa nulla.
-- =============================================================================

alter table public.appuntamenti
  add column if not exists google_event_id text;

notify pgrst, 'reload schema';
