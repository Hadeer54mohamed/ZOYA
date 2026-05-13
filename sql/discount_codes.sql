-- Run in Supabase → SQL Editor if `/api/discount-codes` fails with "relation ... does not exist".
-- The app does not require `created_at`; it lists codes ordered by `code`.

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('PERCENT', 'FIXED')),
  value numeric not null check (value >= 0),
  is_active boolean not null default true,
  expires_at timestamptz,
  usage_count integer not null default 0 check (usage_count >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0)
);

create index if not exists discount_codes_code_idx on public.discount_codes (code);

-- Optional: if you want a creation timestamp for reporting only:
-- alter table public.discount_codes add column if not exists created_at timestamptz not null default now();
