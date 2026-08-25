-- =============================================================================
-- AgendaLore: tabella appuntamenti + regole di sicurezza
-- Incolla questo file in Supabase: SQL Editor > New query > Run
-- =============================================================================
-- IMPORTANTE sul login:
-- Le password NON vanno in una tabella "utenti" creata a mano.
-- Supabase Auth ha già una tabella interna (auth.users) per email e password.
-- Questa tabella serve solo per gli appuntamenti di ogni persona loggata.
-- =============================================================================

create table if not exists public.appuntamenti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titolo text not null,
  note text not null default '',
  data date not null,
  ora time,
  created_at timestamptz not null default now()
);

alter table public.appuntamenti enable row level security;

drop policy if exists "leggi_solo_i_miei" on public.appuntamenti;
create policy "leggi_solo_i_miei"
  on public.appuntamenti
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "inserisci_solo_i_miei" on public.appuntamenti;
create policy "inserisci_solo_i_miei"
  on public.appuntamenti
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "modifica_solo_i_miei" on public.appuntamenti;
create policy "modifica_solo_i_miei"
  on public.appuntamenti
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cancella_solo_i_miei" on public.appuntamenti;
create policy "cancella_solo_i_miei"
  on public.appuntamenti
  for delete
  to authenticated
  using (auth.uid() = user_id);
