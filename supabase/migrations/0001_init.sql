-- ─────────────────────────────────────────────────────────────────────────────
-- MAITRI RESIDENCY — SUPABASE SCHEMA (Mode B: persistent orders + admin)
--
-- Safe to run on a fresh project. Nothing here contains credentials, and no
-- demo rows are inserted: the concept build keeps serving its sample menu until
-- Maitri's approved menu is imported.
--
-- Row Level Security is enabled on every table:
--   • Customers (anon) can read published menu content only.
--   • Orders, order items, staff profiles and settings are staff-only, enforced
--     in the database — not only in the dashboard UI.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── Staff ───────────────────────────────────────────────────────────────────
create table if not exists public.staff_profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        text not null default 'viewer' check (role in ('owner', 'manager', 'viewer')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_profiles
    where user_id = auth.uid() and is_active
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_profiles
    where user_id = auth.uid() and is_active and role in ('owner', 'manager')
  );
$$;

-- ── Menu ────────────────────────────────────────────────────────────────────
create table if not exists public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  blurb       text,
  sort_order  integer not null default 0,
  is_published boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.menu_items (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  category_id      uuid references public.menu_categories (id) on delete set null,
  name             text not null,
  summary          text,
  description      text,
  price_paise      integer not null check (price_paise >= 0),
  image_path       text,
  image_alt        text,
  -- Dietary classification is only meaningful once Maitri confirms it.
  dietary_kind     text check (dietary_kind in ('veg', 'non-veg', 'egg', 'vegan', 'jain')),
  dietary_verified boolean not null default false,
  spice_level      text check (spice_level in ('mild', 'medium', 'hot')),
  is_available     boolean not null default true,
  unavailable_note text,
  option_groups    jsonb not null default '[]'::jsonb,
  is_featured      boolean not null default false,
  is_published     boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists menu_items_category_idx on public.menu_items (category_id);

-- ── Orders ──────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'pending', 'accepted', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled', 'rejected'
    );
  end if;
end$$;

create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  reference             text not null unique,
  status                public.order_status not null default 'pending',
  customer_name         text not null,
  customer_phone        text not null,
  delivery_address      text not null,
  delivery_area         text not null,
  delivery_instructions text,
  fulfilment            text not null default 'delivery' check (fulfilment in ('delivery', 'pickup')),
  subtotal_paise        integer not null check (subtotal_paise >= 0),
  delivery_paise        integer,
  taxes_paise           integer,
  total_paise           integer not null check (total_paise >= 0),
  item_count            integer not null default 0,
  order_summary         text,
  source                text not null default 'website',
  staff_note            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_phone_idx on public.orders (customer_phone);

create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  item_id          text not null,
  item_name        text not null,
  quantity         integer not null check (quantity > 0),
  unit_price_paise integer not null check (unit_price_paise >= 0),
  line_total_paise integer not null check (line_total_paise >= 0),
  options          jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  status     public.order_status not null,
  note       text,
  actor      uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at desc);

-- ── Delivery + service configuration ────────────────────────────────────────
create table if not exists public.delivery_zones (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  pincodes          text[] not null default '{}',
  delivery_paise    integer,
  minimum_paise     integer,
  eta_minutes       integer,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create table if not exists public.service_settings (
  id                 integer primary key default 1 check (id = 1),
  delivery_charge_paise integer,
  minimum_order_paise   integer,
  free_delivery_over_paise integer,
  taxes_enabled      boolean not null default false,
  tax_percent        numeric(5, 2),
  accepts_cash       boolean not null default true,
  accepts_upi        boolean not null default false,
  accepts_online     boolean not null default false,
  announcement       text,
  updated_at         timestamptz not null default now()
);

insert into public.service_settings (id) values (1) on conflict (id) do nothing;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.staff_profiles   enable row level security;
alter table public.menu_categories  enable row level security;
alter table public.menu_items       enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.order_events     enable row level security;
alter table public.delivery_zones   enable row level security;
alter table public.service_settings enable row level security;

-- Customers: read published menu only (never draft or unpublished rows).
drop policy if exists "menu_categories public read" on public.menu_categories;
create policy "menu_categories public read" on public.menu_categories
  for select using (is_published or public.is_staff());

drop policy if exists "menu_items public read" on public.menu_items;
create policy "menu_items public read" on public.menu_items
  for select using (is_published or public.is_staff());

drop policy if exists "menu_categories staff write" on public.menu_categories;
create policy "menu_categories staff write" on public.menu_categories
  for all using (public.is_manager()) with check (public.is_manager());

drop policy if exists "menu_items staff write" on public.menu_items;
create policy "menu_items staff write" on public.menu_items
  for all using (public.is_manager()) with check (public.is_manager());

-- Staff: no customer-facing access path exists for orders. Only staff sessions
-- (or the server's service role) can read or write them.
drop policy if exists "orders staff read" on public.orders;
create policy "orders staff read" on public.orders
  for select using (public.is_staff());

drop policy if exists "orders staff update" on public.orders;
create policy "orders staff update" on public.orders
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "order_items staff read" on public.order_items;
create policy "order_items staff read" on public.order_items
  for select using (public.is_staff());

drop policy if exists "order_events staff read" on public.order_events;
create policy "order_events staff read" on public.order_events
  for select using (public.is_staff());

drop policy if exists "order_events staff insert" on public.order_events;
create policy "order_events staff insert" on public.order_events
  for insert with check (public.is_staff());

drop policy if exists "staff_profiles self read" on public.staff_profiles;
create policy "staff_profiles self read" on public.staff_profiles
  for select using (user_id = auth.uid() or public.is_manager());

drop policy if exists "zones staff write" on public.delivery_zones;
create policy "zones staff write" on public.delivery_zones
  for all using (public.is_manager()) with check (public.is_manager());

drop policy if exists "settings staff read" on public.service_settings;
create policy "settings staff read" on public.service_settings
  for select using (public.is_staff());

drop policy if exists "settings staff write" on public.service_settings;
create policy "settings staff write" on public.service_settings
  for all using (public.is_manager()) with check (public.is_manager());

-- ── Timestamp maintenance ───────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists menu_items_touch on public.menu_items;
create trigger menu_items_touch before update on public.menu_items
  for each row execute function public.touch_updated_at();

drop trigger if exists menu_categories_touch on public.menu_categories;
create trigger menu_categories_touch before update on public.menu_categories
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
