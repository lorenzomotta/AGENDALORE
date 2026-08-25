-- =============================================================================
-- Permessi per vedere e modificare la tabella "Password" dall'app
-- Incolla in Supabase: SQL Editor > Run
-- =============================================================================
-- Senza queste regole l'app vede la tabella vuota, anche se in Table Editor
-- ci sono delle righe (il cruscotto usa un permesso più alto).
-- Tutti gli utenti loggati possono leggere e modificare TUTTE le righe.
-- Va bene se l'app la usi solo tu.
-- =============================================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public."Password" to authenticated;

alter table public."Password" enable row level security;

drop policy if exists "app_leggi_password" on public."Password";
create policy "app_leggi_password"
  on public."Password"
  for select
  to authenticated
  using (true);

drop policy if exists "app_inserisci_password" on public."Password";
create policy "app_inserisci_password"
  on public."Password"
  for insert
  to authenticated
  with check (true);

drop policy if exists "app_modifica_password" on public."Password";
create policy "app_modifica_password"
  on public."Password"
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "app_cancella_password" on public."Password";
create policy "app_cancella_password"
  on public."Password"
  for delete
  to authenticated
  using (true);

notify pgrst, 'reload schema';
