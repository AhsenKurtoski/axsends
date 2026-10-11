-- AhsenDS — Schema database (Supabase / PostgreSQL)
-- Costruito da Ahsen Kurtoski
-- Incolla questo file nell'SQL Editor di Supabase ed esegui.

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  rating numeric default 0,
  avg_shipping text,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  image text default '📦',
  supplier text,
  cost numeric not null default 0,
  price numeric not null default 0,
  stock integer not null default 0,
  sold integer not null default 0,
  status text not null default 'active',
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  product text not null,
  customer text not null,
  total numeric not null default 0,
  status text not null default 'pending',
  date date not null default current_date,
  created_at timestamptz default now()
);

create table if not exists price_history (
  id bigint generated always as identity primary key,
  product_id uuid references products(id) on delete cascade,
  cost numeric,
  stock integer,
  recorded_at timestamptz default now()
);

-- Seed dimostrativo
insert into suppliers (name, country, rating, avg_shipping) values
  ('CJ Dropshipping', 'CN/EU', 4.7, '6-10 gg'),
  ('Temu Supply', 'CN', 4.3, '8-14 gg'),
  ('EU Local Warehouse', 'DE', 4.8, '2-4 gg'),
  ('AliExpress Choice', 'CN', 4.5, '7-12 gg')
on conflict do nothing;

insert into products (external_id, name, image, supplier, cost, price, stock, sold, status) values
  ('p1', 'Mini proiettore portatile HD', '🎥', 'CJ Dropshipping', 18.40, 49.90, 132, 412, 'active'),
  ('p2', 'Cuffie wireless ANC', '🎧', 'EU Local Warehouse', 12.10, 39.90, 64, 286, 'active'),
  ('p3', 'Smartwatch fitness', '⌚', 'AliExpress Choice', 9.80, 34.90, 21, 530, 'active'),
  ('p4', 'Lampada LED da scrivania', '💡', 'Temu Supply', 6.50, 24.90, 0, 198, 'out_of_stock'),
  ('p5', 'Borraccia termica acciaio', '🍶', 'EU Local Warehouse', 5.20, 19.90, 240, 95, 'active'),
  ('p6', 'Supporto telefono auto', '📱', 'CJ Dropshipping', 3.10, 14.90, 48, 142, 'paused')
on conflict (external_id) do nothing;

-- Row Level Security
alter table products enable row level security;
alter table orders enable row level security;
alter table suppliers enable row level security;
alter table price_history enable row level security;

-- Lettura consentita agli utenti autenticati
create policy "read_products" on products for select to authenticated using (true);
create policy "read_orders" on orders for select to authenticated using (true);
create policy "read_suppliers" on suppliers for select to authenticated using (true);
create policy "read_price_history" on price_history for select to authenticated using (true);

-- Scrittura ordini per utenti autenticati
create policy "write_orders" on orders for insert to authenticated with check (true);
