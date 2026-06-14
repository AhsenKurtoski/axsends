-- =============================================================
-- AxsenDS - Schema database Supabase
-- Come usarlo:
-- 1. Vai su supabase.com e apri il tuo progetto
-- 2. Menu a sinistra: SQL Editor > New query
-- 3. Incolla TUTTO questo file e premi Run
-- =============================================================

-- PRODOTTI (catalogo)
create table if not exists products (
  id text primary key,
  name text not null,
  image text,
  supplier text,
  cost numeric default 0,
  price numeric default 0,
  stock integer default 0,
  sold integer default 0,
  status text default 'active',
  created_at timestamptz default now()
);

-- ORDINI
create table if not exists orders (
  id text primary key,
  product text,
  customer text,
  total numeric default 0,
  status text default 'pending',
  date date default current_date,
  created_at timestamptz default now()
);

-- FORNITORI
-- Nota: la colonna avgShipping e' tra virgolette per mantenere le maiuscole
create table if not exists suppliers (
  id text primary key,
  name text not null,
  country text,
  products integer default 0,
  rating numeric default 0,
  "avgShipping" text,
  created_at timestamptz default now()
);

-- STORICO PREZZI/STOCK (usato dal monitoraggio automatico ogni 6 ore)
create table if not exists price_history (
  id bigint generated always as identity primary key,
  product_id text,
  cost numeric,
  stock integer,
  checked_at timestamptz default now()
);

-- =============================================================
-- Accesso: app personale a uso singolo.
-- Per semplicita' lasciamo le tabelle accessibili con la anon key.
-- Se Supabase ti chiede di attivare la RLS, puoi attivarla e poi
-- aggiungere queste policy permissive (eseguile solo se hai attivato la RLS):
-- =============================================================

-- alter table products enable row level security;
-- alter table orders enable row level security;
-- alter table suppliers enable row level security;
-- alter table price_history enable row level security;

-- create policy "allow all products" on products for all using (true) with check (true);
-- create policy "allow all orders" on orders for all using (true) with check (true);
-- create policy "allow all suppliers" on suppliers for all using (true) with check (true);
-- create policy "allow all price_history" on price_history for all using (true) with check (true);
