-- =============================================================================
-- Scrive lo stesso user_id in TUTTI i record di LinkUtili, colonna Utente
-- Incolla in Supabase: SQL Editor > Run
--
-- Dove trovare lo user_id:
-- 1. Supabase → Authentication → Users
-- 2. Clicca il tuo utente
-- 3. Copia "User UID" (è un codice lungo, non un numero 1, 2, 3)
--
-- Incolla quel codice QUI SOTTO, tra gli apici, al posto di INCOLLA_QUI
-- =============================================================================

do $$
declare
  t text;
  col text;
  uid uuid := 'INCOLLA_QUI';
begin
  select c.table_name into t
  from information_schema.tables as c
  where c.table_schema = 'public'
    and lower(replace(c.table_name, '_', '')) = 'linkutili'
  limit 1;

  if t is null then
    raise exception 'Tabella LinkUtili non trovata.';
  end if;

  select c.column_name into col
  from information_schema.columns as c
  where c.table_schema = 'public'
    and c.table_name = t
    and lower(c.column_name) in ('utente', 'user_id', 'userid')
  order by case lower(c.column_name)
    when 'utente' then 1
    when 'user_id' then 2
    else 3
  end
  limit 1;

  if col is null then
    raise exception 'Colonna Utente non trovata nella tabella LinkUtili.';
  end if;

  execute format('update public.%I set %I = %L', t, col, uid::text);

  raise notice 'Aggiornati tutti i record di %: colonna % = %', t, col, uid;
end $$;
