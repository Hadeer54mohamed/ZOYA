-- Profit periods: manual close from Admin → Profit Analytics ("Start new period").
-- Run once in Supabase SQL Editor.

create table if not exists public.profit_periods (
  id uuid primary key default gen_random_uuid(),
  period_start timestamptz not null,
  period_end timestamptz,
  status text not null default 'active' check (status in ('active', 'closed')),
  closed_at timestamptz,
  label text,
  revenue numeric not null default 0,
  profit numeric not null default 0,
  discounts numeric not null default 0,
  order_count integer not null default 0,
  incomplete_count integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists profit_periods_one_active
  on public.profit_periods (status)
  where status = 'active';

create index if not exists profit_periods_closed_at
  on public.profit_periods (closed_at desc)
  where status = 'closed';

alter table public.profit_periods enable row level security;
