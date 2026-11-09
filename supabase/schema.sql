-- MoneyWise — Supabase (PostgreSQL) схема / schema
-- Изпълнете целия файл в Supabase → SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key         text,
  kind        text not null check (kind in ('expense','income')),
  name_bg     text not null,
  name_en     text not null,
  icon        text not null default '🏷️',
  color       text not null default '#7c5cff',
  keywords    text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type        text not null check (type in ('expense','income')),
  amount      numeric(12,2) not null check (amount > 0),
  note        text not null default '',
  tx_date     date not null default current_date,
  created_at  timestamptz not null default now()
);

create table if not exists public.budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete cascade,
  limit_amount numeric(12,2) not null check (limit_amount > 0),
  created_at   timestamptz not null default now(),
  unique (user_id, category_id)
);

create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name          text not null,
  icon          text not null default '🎯',
  target_amount numeric(12,2) not null check (target_amount > 0),
  saved_amount  numeric(12,2) not null default 0 check (saved_amount >= 0),
  deadline      date,
  priority      smallint not null default 2 check (priority between 1 and 3),
  created_at    timestamptz not null default now()
);

create table if not exists public.goal_contributions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id        uuid not null references public.goals(id) on delete cascade,
  amount         numeric(12,2) not null check (amount > 0),
  contributed_at date not null default current_date
);

create index if not exists idx_tx_user_date on public.transactions(user_id, tx_date desc);
create index if not exists idx_tx_category  on public.transactions(category_id);

-- Row Level Security: всеки потребител вижда и променя само своите редове
do $$
declare t text;
begin
  foreach t in array array['categories','transactions','budgets','goals','goal_contributions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- Изглед: месечно обобщение (ползва се за проверка на данните и в SQL защита)
create or replace view public.monthly_summary with (security_invoker = true) as
select user_id,
       to_char(tx_date, 'YYYY-MM') as month,
       sum(amount) filter (where type = 'income')  as income,
       sum(amount) filter (where type = 'expense') as expense,
       sum(case when type = 'income' then amount else -amount end) as net
from public.transactions
group by user_id, to_char(tx_date, 'YYYY-MM');
