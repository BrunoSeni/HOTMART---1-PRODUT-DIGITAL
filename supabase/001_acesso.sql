-- Lash Empresária: tabelas do acesso pago.
-- Rodar uma vez no Supabase: SQL Editor > New query > colar > Run.

-- Quem comprou. Escrita só pelo webhook da Hotmart (api/hotmart.ts, com a chave service_role).
create table if not exists public.acessos (
  email         text primary key,             -- sempre em minúsculas
  nome          text,
  plano         text not null check (plano in ('anual', 'vitalicio')),
  status        text not null check (status in ('ativo', 'reembolsado', 'cancelado')),
  vence_em      timestamptz,                  -- null no vitalício
  transacao     text not null,                -- código da compra na Hotmart (HP...)
  atualizado_em timestamptz not null default now()
);

alter table public.acessos enable row level security;

drop policy if exists "compradora lê o próprio acesso" on public.acessos;
create policy "compradora lê o próprio acesso" on public.acessos
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));

-- Os números da calculadora de cada compradora, para não perder ao trocar de celular.
create table if not exists public.calculadoras (
  user_id       uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  estado        jsonb not null,
  atualizado_em timestamptz not null default now()
);

alter table public.calculadoras enable row level security;

drop policy if exists "compradora mexe só na própria calculadora" on public.calculadoras;
create policy "compradora mexe só na própria calculadora" on public.calculadoras
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
