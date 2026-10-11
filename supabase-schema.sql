-- =============================================================
-- AhsenDS - Schema database Supabase
-- Costruito da Ahsen Kurtoski
-- Come usarlo:
-- 1. Vai su supabase.com e apri il tuo progetto
-- 2. Menu a sinistra: SQL Editor > New query
-- 3. Incolla TUTTO questo file e premi Run
-- 4. Puoi rilanciarlo quante volte vuoi: e idempotente
-- =============================================================

-- ---------- PRODOTTI (catalogo) ----------
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Colonne aggiuntive (idempotenti: se la tabella esisteva gia vengono aggiunte).
-- external_id serve all'import: upsert in conflitto su external_id invece che su id.
alter table products add column if not exists external_id text;
alter table products add column if not exists updated_at timestamptz default now();

-- Un external_id non puo essere duplicato (solo quando valorizzato).
create unique index if not exists products_external_id_key
  on products (external_id) where external_id is not null;
create index if not exists products_sold_idx on products (sold desc);

-- ---------- ORDINI ----------
create table if not exists orders (
  id text primary key default gen_random_uuid()::text,
  product text,
  customer text,
  total numeric default 0,
  status text default 'pending',
  date date default current_date,
  created_at timestamptz default now()
);
create index if not exists orders_date_idx on orders (date desc);

-- ---------- FORNITORI ----------
-- Nota: la colonna avgShipping e tra virgolette per mantenere le maiuscole
create table if not exists suppliers (
  id text primary key,
  name text not null,
  country text,
  products integer default 0,
  rating numeric default 0,
  "avgShipping" text,
  created_at timestamptz default now()
);

-- ---------- STORICO PREZZI/STOCK (monitoraggio ogni 6 ore) ----------
create table if not exists price_history (
  id bigint generated always as identity primary key,
  product_id text,
  cost numeric,
  stock integer,
  checked_at timestamptz default now()
);
create index if not exists price_history_product_idx on price_history (product_id, checked_at desc);

-- ---------- CODA DI PUBBLICAZIONE ADS ----------
create table if not exists ad_queue (
  id bigint generated always as identity primary key,
  product text,
  platform text default 'tiktok',
  title text,
  caption text,
  hashtags text,
  video_url text,
  status text default 'queued',
  scheduled_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists ad_queue_created_idx on ad_queue (created_at desc);

-- ---------- IMPOSTAZIONI APP (automazioni, preferenze) ----------
create table if not exists settings (
  key text primary key,
  value jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- =============================================================
-- SICUREZZA: Row Level Security
-- L'app e personale: con la RLS attiva, solo gli utenti autenticati
-- (login su /login) possono leggere e scrivere. Gli accessi anonimi
-- (chiave anon senza sessione) vengono bloccati a livello database.
-- Le API che usano la service role key (import, monitor, autopilot)
-- restano autorizzate perche girano solo server-side.
-- =============================================================

alter table products enable row level security;
alter table orders enable row level security;
alter table suppliers enable row level security;
alter table price_history enable row level security;
alter table ad_queue enable row level security;
alter table settings enable row level security;

-- Rimuove eventuali policy precedenti per essere idempotente
drop policy if exists "authenticated all products" on products;
drop policy if exists "authenticated all orders" on orders;
drop policy if exists "authenticated all suppliers" on suppliers;
drop policy if exists "authenticated all price_history" on price_history;
drop policy if exists "authenticated all ad_queue" on ad_queue;
drop policy if exists "authenticated all settings" on settings;

-- Policy: accesso completo al ruolo authenticated (utenti loggati)
create policy "authenticated all products" on products
  for all to authenticated using (true) with check (true);
create policy "authenticated all orders" on orders
  for all to authenticated using (true) with check (true);
create policy "authenticated all suppliers" on suppliers
  for all to authenticated using (true) with check (true);
create policy "authenticated all price_history" on price_history
  for all to authenticated using (true) with check (true);
create policy "authenticated all ad_queue" on ad_queue
  for all to authenticated using (true) with check (true);
create policy "authenticated all settings" on settings
  for all to authenticated using (true) with check (true);

-- Se vuoi che l'app funzioni anche SENZA login (es. in locale senza Supabase Auth),
-- commenta le righe "alter table ... enable row level security" qui sopra.
