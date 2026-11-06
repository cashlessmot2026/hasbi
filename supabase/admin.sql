-- =========================================================
-- HASBI · Panel de administración (v3)
-- Ejecutar DESPUÉS de schema.sql. Idempotente.
-- Toda escritura pasa por funciones RPC que validan la clave en el servidor.
-- =========================================================

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

-- ---------- Configuración del negocio (una sola fila) ----------
create table if not exists public.settings (
  id             int primary key default 1 check (id = 1),
  business_name  text not null default 'Hasbi',
  tagline        text not null default 'Cocina rápida libanesa',
  whatsapp       text not null default '573232252945',     -- número que recibe los pedidos (con indicativo, solo dígitos)
  phone_label    text not null default '+57 323 225 2945',  -- cómo se muestra
  hours          text,
  instagram      text,
  updated_at     timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------- Banners de la portada ----------
create table if not exists public.banners (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  subtitle    text,
  image_url   text not null,
  product_id  text,                         -- producto que se abre al tocar el banner (opcional)
  active      boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- Sedes / ubicaciones del negocio ----------
create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  city        text,
  latitude    double precision,
  longitude   double precision,
  phone       text,
  hours       text,
  active      boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.settings  enable row level security;
alter table public.banners   enable row level security;
alter table public.locations enable row level security;

drop policy if exists "settings publicos" on public.settings;
create policy "settings publicos" on public.settings for select to anon, authenticated using (true);
drop policy if exists "banners publicos" on public.banners;
create policy "banners publicos" on public.banners for select to anon, authenticated using (active);
drop policy if exists "sedes publicas" on public.locations;
create policy "sedes publicas" on public.locations for select to anon, authenticated using (active);

-- ---------- Clave del administrador (hash bcrypt, nunca legible por el público) ----------
create table if not exists private.admin_auth (
  id            int primary key default 1 check (id = 1),
  pass_hash     text not null,
  failed        int not null default 0,
  locked_until  timestamptz
);
insert into private.admin_auth (id, pass_hash)
values (1, extensions.crypt('1234', extensions.gen_salt('bf')))
on conflict (id) do nothing;
revoke all on schema private from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;

-- Devuelve null si la clave es correcta, o el mensaje de error.
-- Tras 5 intentos fallidos bloquea el acceso 15 minutos.
create or replace function private.admin_check(pass text) returns text
language plpgsql security definer set search_path = '' as $$
declare r private.admin_auth;
begin
  select * into r from private.admin_auth where id = 1 for update;
  if r.locked_until is not null and r.locked_until > now() then
    return 'Demasiados intentos. Intenta de nuevo en ' || ceil(extract(epoch from r.locked_until - now()) / 60) || ' min.';
  end if;
  if coalesce(pass, '') <> '' and r.pass_hash = extensions.crypt(pass, r.pass_hash) then
    update private.admin_auth set failed = 0, locked_until = null where id = 1;
    return null;
  end if;
  update private.admin_auth
     set failed = case when r.failed + 1 >= 5 then 0 else r.failed + 1 end,
         locked_until = case when r.failed + 1 >= 5 then now() + interval '15 minutes' else null end
   where id = 1;
  return 'Clave incorrecta';
end $$;
revoke all on function private.admin_check(text) from public, anon, authenticated;

-- ---------- RPC: login ----------
create or replace function public.admin_login(pass text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e text := private.admin_check(pass);
begin
  if e is not null then return jsonb_build_object('error', e); end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- RPC: todos los datos (incluye inactivos) ----------
create or replace function public.admin_data(pass text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e text := private.admin_check(pass);
begin
  if e is not null then return jsonb_build_object('error', e); end if;
  return jsonb_build_object(
    'products',   coalesce((select jsonb_agg(to_jsonb(p) order by p.sort, p.name) from public.products p), '[]'),
    'categories', coalesce((select jsonb_agg(to_jsonb(c) order by c.sort) from public.categories c), '[]'),
    'banners',    coalesce((select jsonb_agg(to_jsonb(b) order by b.sort, b.created_at) from public.banners b), '[]'),
    'locations',  coalesce((select jsonb_agg(to_jsonb(l) order by l.sort, l.created_at) from public.locations l), '[]'),
    'settings',   (select to_jsonb(s) from public.settings s where id = 1),
    'orders',     coalesce((select jsonb_agg(to_jsonb(o) order by o.created_at desc)
                            from (select * from public.orders order by created_at desc limit 100) o), '[]')
  );
end $$;

-- ---------- RPC: guardar (crear o editar) ----------
create or replace function public.admin_save(pass text, entity text, rec jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e text := private.admin_check(pass);
begin
  if e is not null then return jsonb_build_object('error', e); end if;

  if entity = 'products' then
    if coalesce(rec->>'id', '') = '' or coalesce(rec->>'name', '') = '' then return jsonb_build_object('error', 'Falta id o nombre'); end if;
    rec := jsonb_build_object('categories', '[]'::jsonb, 'images', '[]'::jsonb, 'tags', '[]'::jsonb, 'i18n', '{}'::jsonb,
             'featured', false, 'upsell', false, 'sort', 0, 'active', true, 'price', 0,
             'created_at', coalesce((select created_at from public.products where id = rec->>'id'), now()))
           || (rec - 'updated_at') || jsonb_build_object('updated_at', now());
    delete from public.products where id = rec->>'id';
    insert into public.products select * from jsonb_populate_record(null::public.products, rec);

  elsif entity = 'categories' then
    if coalesce(rec->>'id', '') = '' or coalesce(rec->>'name', '') = '' then return jsonb_build_object('error', 'Falta id o nombre'); end if;
    rec := jsonb_build_object('sort', 0, 'active', true, 'i18n', '{}'::jsonb,
             'created_at', coalesce((select created_at from public.categories where id = rec->>'id'), now())) || rec;
    delete from public.categories where id = rec->>'id';
    insert into public.categories select * from jsonb_populate_record(null::public.categories, rec);

  elsif entity = 'banners' then
    if coalesce(rec->>'image_url', '') = '' then return jsonb_build_object('error', 'El banner necesita una imagen'); end if;
    rec := jsonb_build_object('id', gen_random_uuid(), 'active', true, 'sort', 0, 'created_at', now()) || rec;
    delete from public.banners where id = (rec->>'id')::uuid;
    insert into public.banners select * from jsonb_populate_record(null::public.banners, rec);

  elsif entity = 'locations' then
    if coalesce(rec->>'name', '') = '' then return jsonb_build_object('error', 'La sede necesita un nombre'); end if;
    rec := jsonb_build_object('id', gen_random_uuid(), 'active', true, 'sort', 0, 'created_at', now()) || rec;
    delete from public.locations where id = (rec->>'id')::uuid;
    insert into public.locations select * from jsonb_populate_record(null::public.locations, rec);

  elsif entity = 'settings' then
    if coalesce(rec->>'whatsapp', '') !~ '^[0-9]{8,15}$' then
      return jsonb_build_object('error', 'WhatsApp: solo dígitos con indicativo de país, ej. 573232252945');
    end if;
    update public.settings set
      business_name = coalesce(nullif(rec->>'business_name', ''), business_name),
      tagline       = coalesce(rec->>'tagline', tagline),
      whatsapp      = rec->>'whatsapp',
      phone_label   = coalesce(nullif(rec->>'phone_label', ''), rec->>'whatsapp'),
      hours         = rec->>'hours',
      instagram     = rec->>'instagram',
      updated_at    = now()
    where id = 1;

  else
    return jsonb_build_object('error', 'Entidad no válida');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- RPC: eliminar ----------
create or replace function public.admin_delete(pass text, entity text, rec_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e text := private.admin_check(pass);
begin
  if e is not null then return jsonb_build_object('error', e); end if;
  if entity = 'products' then delete from public.products where id = rec_id;
  elsif entity = 'categories' then
    if exists (select 1 from public.products where rec_id = any(categories)) then
      return jsonb_build_object('error', 'Hay productos en esta categoría. Muévelos antes de eliminarla.');
    end if;
    delete from public.categories where id = rec_id;
  elsif entity = 'banners' then delete from public.banners where id = rec_id::uuid;
  elsif entity = 'locations' then delete from public.locations where id = rec_id::uuid;
  else return jsonb_build_object('error', 'Entidad no válida');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- RPC: cambiar clave ----------
create or replace function public.admin_change_password(pass text, new_pass text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e text := private.admin_check(pass);
begin
  if e is not null then return jsonb_build_object('error', e); end if;
  if length(coalesce(new_pass, '')) < 4 then return jsonb_build_object('error', 'La clave debe tener al menos 4 caracteres'); end if;
  update private.admin_auth set pass_hash = extensions.crypt(new_pass, extensions.gen_salt('bf')) where id = 1;
  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.admin_login(text), public.admin_data(text), public.admin_save(text, text, jsonb),
  public.admin_delete(text, text, text), public.admin_change_password(text, text) to anon, authenticated;

-- ---------- Storage: imágenes del menú y banners ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu', 'menu', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'];

drop policy if exists "subir imagenes menu" on storage.objects;
create policy "subir imagenes menu" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'menu');

select 'ok' as admin_v3,
  (select count(*) from public.settings) as settings,
  (select count(*) from private.admin_auth) as clave;
