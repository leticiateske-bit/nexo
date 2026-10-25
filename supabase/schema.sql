-- NEXO — esquema inicial para Supabase (Etapa 2). Não aplicado automaticamente.
-- Cada tabela guarda o registro como JSONB + colunas de controle, com RLS por usuário.
-- Isso permite migrar do localStorage sem perder campos; normalizar depois por demanda.

create table if not exists profiles (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['ssi','metrics','posts','references_lib','contacts','jobs','companies','roles','courses','plan','tasks','imports'] loop
    execute format('create table if not exists %I (
      id text primary key,
      user_id uuid not null references auth.users on delete cascade,
      origin text not null check (origin in (''demo'',''nexo'',''user'',''import'',''api'')),
      data jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )', t);
    execute format('alter table %I enable row level security', t);
    execute format('create policy "%s_owner" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
  end loop;
end $$;

alter table profiles enable row level security;
create policy "profiles_owner" on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
