-- =============================================================================
-- Permessi per la tabella LinkUtili (qualsiasi maiuscole/minuscole del nome)
-- Incolla in Supabase: SQL Editor > Run
-- =============================================================================

do $$
declare
  t text;
begin
  select c.table_name into t
  from information_schema.tables as c
  where c.table_schema = 'public'
    and lower(replace(c.table_name, '_', '')) = 'linkutili'
  limit 1;

  if t is null then
    raise exception 'Tabella LinkUtili non trovata. In Table Editor il nome deve essere LinkUtili.';
  end if;

  execute format('grant usage on schema public to authenticated');
  execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
  execute format('alter table public.%I enable row level security', t);

  execute format('drop policy if exists "app_leggi_link_utili" on public.%I', t);
  execute format(
    'create policy "app_leggi_link_utili" on public.%I for select to authenticated using (true)',
    t
  );

  execute format('drop policy if exists "app_inserisci_link_utili" on public.%I', t);
  execute format(
    'create policy "app_inserisci_link_utili" on public.%I for insert to authenticated with check (true)',
    t
  );

  execute format('drop policy if exists "app_modifica_link_utili" on public.%I', t);
  execute format(
    'create policy "app_modifica_link_utili" on public.%I for update to authenticated using (true) with check (true)',
    t
  );

  execute format('drop policy if exists "app_cancella_link_utili" on public.%I', t);
  execute format(
    'create policy "app_cancella_link_utili" on public.%I for delete to authenticated using (true)',
    t
  );
end $$;

notify pgrst, 'reload schema';
