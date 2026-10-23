create extension if not exists pgcrypto;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  whatsapp_number text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  legacy_id text,
  name text not null,
  price numeric(12,2) not null default 0 check (price >= 0),
  description text not null default '',
  photo text not null default '',
  category text not null default 'Batik Wanita',
  stock integer not null default 0 check (stock >= 0),
  is_published boolean not null default true,
  motif text not null default '',
  material text not null default '',
  colors jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '["S","M","L","XL"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists products_store_legacy_id_idx on public.products(store_id, legacy_id) where legacy_id is not null;
create index if not exists products_store_published_idx on public.products(store_id, is_published);

alter table public.stores enable row level security;
alter table public.products enable row level security;

drop policy if exists "Store owners manage their store" on public.stores;
create policy "Store owners manage their store" on public.stores for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists "Public reads published products" on public.products;
create policy "Public reads published products" on public.products for select to anon, authenticated using (is_published = true);

drop policy if exists "Owners manage their products" on public.products;
create policy "Owners manage their products" on public.products for all to authenticated using (exists (select 1 from public.stores s where s.id = products.store_id and s.owner_id = (select auth.uid()))) with check (exists (select 1 from public.stores s where s.id = products.store_id and s.owner_id = (select auth.uid())));

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict (id) do nothing;
drop policy if exists "Public product images" on storage.objects;
create policy "Public product images" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
drop policy if exists "Owners upload product images" on storage.objects;
create policy "Owners upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and (storage.foldername(name))[1] in (select id::text from public.stores where owner_id = (select auth.uid())));

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
