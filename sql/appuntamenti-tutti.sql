-- =============================================================================
-- Appuntamenti visibili a tutti gli utenti loggati (colonna Tutti)
-- Incolla in Supabase: SQL Editor > New query > Run
-- =============================================================================
-- Se Tutti = true  → ogni utente autenticato può VEDERE l'appuntamento
-- Se Tutti = false → lo vede solo chi l'ha creato
-- Modifica e cancellazione restano solo del proprietario.
-- =============================================================================

do $$
declare
  col text;
begin
  select c.column_name into col
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'appuntamenti'
    and lower(c.column_name) = 'tutti'
  limit 1;

  if col is null then
    execute 'alter table public.appuntamenti add column "Tutti" boolean not null default false';
    col := 'Tutti';
  else
    execute format(
      'alter table public.appuntamenti alter column %I set default false',
      col
    );
    execute format(
      'update public.appuntamenti set %I = false where %I is null',
      col,
      col
    );
  end if;

  execute 'drop policy if exists "leggi_solo_i_miei" on public.appuntamenti';
  execute 'drop policy if exists "leggi_miei_o_tutti" on public.appuntamenti';
  execute format(
    'create policy "leggi_miei_o_tutti" on public.appuntamenti
       for select to authenticated
       using (auth.uid() = user_id or %I is true)',
    col
  );
end $$;

notify pgrst, 'reload schema';
