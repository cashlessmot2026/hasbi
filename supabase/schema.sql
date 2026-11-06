-- =========================================================
-- HASBI · Menú digital  ·  Esquema Supabase
-- Ejecutar en: Dashboard > SQL Editor (idempotente)
-- =========================================================

-- ---------- Categorías ----------
create table if not exists public.categories (
  id          text primary key,
  name        text not null,
  emoji       text,
  sort        int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- Productos ----------
create table if not exists public.products (
  id           text primary key,
  name         text not null,
  description  text,
  price        integer not null check (price >= 0),           -- COP
  categories   text[] not null default '{}',                 -- ids de categories
  images       text[] not null default '{}',                 -- rutas en /images o URLs absolutas
  tags         text[] not null default '{}',
  featured     boolean not null default false,
  upsell       boolean not null default false,               -- se sugiere antes de terminar el pedido
  sort         int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists products_categories_idx on public.products using gin (categories);

-- ---------- Pedidos ----------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_code      text unique not null,
  customer_name   text not null,
  customer_phone  text,
  order_type      text not null default 'domicilio' check (order_type in ('domicilio','recoger','mesa')),
  address         text,
  notes           text,
  items           jsonb not null,          -- [{id,name,price,qty,subtotal}]
  total           integer not null check (total >= 0),
  ticket_url      text,
  status          text not null default 'nuevo' check (status in ('nuevo','confirmado','preparando','enviado','entregado','cancelado')),
  created_at      timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- v2: datos de entrega, GPS, pago e idioma
alter table public.orders add column if not exists latitude          double precision;
alter table public.orders add column if not exists longitude         double precision;
alter table public.orders add column if not exists location_accuracy integer;
alter table public.orders add column if not exists maps_url          text;
alter table public.orders add column if not exists payment_method    text;
alter table public.orders add column if not exists cash_with         integer;
alter table public.orders add column if not exists language          text default 'es';
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method is null or payment_method in ('efectivo','nequi','daviplata','transferencia','tarjeta'));
comment on column public.orders.customer_name is 'Nombre de quien recibe el pedido';

-- v2: traducciones { "en": {"name": "...", "description": "..."}, ... }
alter table public.products   add column if not exists i18n jsonb not null default '{}'::jsonb;
alter table public.categories add column if not exists i18n jsonb not null default '{}'::jsonb;

-- ---------- updated_at automático ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- Seguridad (RLS) ----------
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;

drop policy if exists "categorias publicas" on public.categories;
create policy "categorias publicas" on public.categories for select to anon, authenticated using (active);

drop policy if exists "productos publicos" on public.products;
create policy "productos publicos" on public.products for select to anon, authenticated using (active);

-- Los clientes pueden CREAR pedidos, pero no leerlos ni modificarlos.
drop policy if exists "crear pedidos" on public.orders;
create policy "crear pedidos" on public.orders for insert to anon, authenticated
  with check (total >= 0 and jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0);

-- ---------- Storage: imágenes de tickets ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tickets', 'tickets', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'];

drop policy if exists "subir tickets" on storage.objects;
create policy "subir tickets" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'tickets');

-- Sin política SELECT: el bucket es público (cada ticket se abre por su URL),
-- pero nadie puede listar los tickets de otros clientes.
drop policy if exists "ver tickets" on storage.objects;
