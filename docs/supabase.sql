-- Sessions de vente
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_at timestamptz not null default now(),
  status text not null default 'open',
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Clients
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tiktok_name text unique not null,
  real_name text,
  phone text,
  address text,
  delivery_pref text,
  payment_method text,
  deposit_enabled boolean not null default false,
  deposit_amount numeric(12,2) not null default 0,
  photo_url text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Lignes de commande
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  tiktok_name text not null,
  code text not null default 'JP',
  description text not null,
  unit_price numeric(12,2) not null default 0,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

-- Index utiles
create index if not exists idx_orders_session_created on public.orders(session_id, created_at desc);
create index if not exists idx_orders_session_tiktok on public.orders(session_id, tiktok_name);

-- RLS (développement)
alter table public.sessions enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;

-- En production, restreindre aux utilisateurs authentifiés
drop policy if exists "Allow anon all sessions" on public.sessions;
drop policy if exists "Allow anon all customers" on public.customers;
drop policy if exists "Allow anon all orders" on public.orders;

create policy "Authenticated read sessions" on public.sessions for select using (auth.role() = 'authenticated');
create policy "Authenticated write sessions" on public.sessions for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update sessions" on public.sessions for update using (auth.role() = 'authenticated');

create policy "Authenticated read customers" on public.customers for select using (auth.role() = 'authenticated');
create policy "Authenticated write customers" on public.customers for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update customers" on public.customers for update using (auth.role() = 'authenticated');

create policy "Authenticated read orders" on public.orders for select using (auth.role() = 'authenticated');
create policy "Authenticated write orders" on public.orders for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update orders" on public.orders for update using (auth.role() = 'authenticated');

-- Storage: créer un bucket public 'receipts' via l'interface Supabase


