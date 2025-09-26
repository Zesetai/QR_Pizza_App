-- (Optional but recommended) gen_random_uuid()
create extension if not exists "pgcrypto";

-- === SETTINGS TABLE ===
create table if not exists settings (
  id int primary key default 1,
  ovens int not null default 1,
  avg_minutes int not null default 6,
  paused boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into settings (id) values (1) on conflict (id) do nothing;

-- === ORDER STATUS ENUM ===
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('NEW','IN_PROGRESS','READY','DONE','CANCELLED');
  end if;
end$$;

-- === ORDERS TABLE ===
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  number bigserial,
  status order_status not null default 'NEW',
  customer jsonb not null,
  subtotal_cents int not null,
  tax_cents int not null default 0,
  total_cents int not null,
  adjustment_note text,
  eta_minutes int,
  -- FIX: use DEFAULT instead of GENERATED ALWAYS AS
  position int not null default (extract(epoch from now()))::int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- === ORDER ITEMS TABLE ===
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  name text not null,
  price_cents int not null,
  meta jsonb
);

-- === MENU ITEMS TABLE ===
create table if not exists menu_items (
  id text primary key,
  name text not null,
  price_cents int not null,
  tags text[]
);

-- === TOPPINGS TABLE ===
create table if not exists toppings (
  id text primary key,
  name text not null,
  price_cents int not null default 0
);

-- === AUDIT LOGS TABLE ===
create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  actor text not null default 'admin',
  entity text not null,
  entity_id text not null,
  action text not null,
  diff jsonb,
  created_at timestamptz not null default now()
);

-- === ENABLE RLS ===
alter table if exists orders enable row level security;
alter table if exists order_items enable row level security;
alter table if exists menu_items enable row level security;
alter table if exists settings enable row level security;
alter table if exists toppings enable row level security;
alter table if exists audit_logs enable row level security;

-- === BASIC POLICIES ===
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'public read menu') then
    create policy "public read menu" on menu_items for select using (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'public read toppings') then
    create policy "public read toppings" on toppings for select using (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'public read settings') then
    create policy "public read settings" on settings for select using (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'public insert orders') then
    create policy "public insert orders" on orders for insert with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'public insert order_items') then
    create policy "public insert order_items" on order_items for insert with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'public select orders') then
    create policy "public select orders" on orders for select using (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'public select order_items') then
    create policy "public select order_items" on order_items for select using (true);
  end if;
end$$;

-- === SEED MENU ITEMS ===
insert into menu_items (id,name,price_cents,tags) values
 ('margh','Margherita',1000, array['veg']),
 ('pep','Pepperoni',1200, array[]::text[])
on conflict (id) do nothing;

-- === SEED TOPPINGS ===
insert into toppings (id,name,price_cents) values
 ('pep','Pepperoni',150),
 ('msh','Mushrooms',150),
 ('olv','Olives',150)
on conflict (id) do nothing;
