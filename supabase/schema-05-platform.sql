-- ===========================================================================
-- Phase 3 — platform schema.
-- Run once in the Supabase SQL Editor, after schema-04-profiles.sql.
--
-- Extends the EXISTING schema (profiles / submissions / delivered_plans).
-- Nothing here drops or rewrites those tables.
--
-- Safe to re-run: tables/indexes use `if not exists`, functions use
-- `create or replace`, every policy and trigger is preceded by a
-- `drop ... if exists`, and all seed inserts use `on conflict do nothing`.
-- Re-running never touches user data.
--
-- Contents:
--   1. admin role + is_admin() helper
--   2. profile extensions + contractor/homeowner profiles
--   3. catalog (categories, products, images)
--   4. projects (+ type-specific detail tables)
--   5. orders (+ items, server-side price validation)
--   6. packages (+ items, customer access)
--   7. services, service requests, call orders, premium requests
--   8. drawing uploads + material calculations
--   9. storage buckets + policies
--  10. seed data
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Admin role
--
-- Admin was previously an ADMIN_EMAILS env allowlist. RLS can't read env
-- vars, so database-side authorization needs the role in profiles.
-- ---------------------------------------------------------------------------

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('homeowner', 'contractor', 'admin'));

-- SECURITY DEFINER so policies can check admin-ness without re-entering
-- profiles' own RLS (which would recurse).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_role_is(target text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = target
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Profile extensions
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Admins can read and manage every profile.
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

create table if not exists public.contractor_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  company_name text not null default '',
  business_description text not null default '',
  license_number text not null default '',
  address text not null default '',
  city text not null default '',
  province text not null default 'ON',
  postal_code text not null default '',
  website text not null default '',
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contractor_profiles enable row level security;

drop policy if exists "Contractors manage their own contractor profile" on public.contractor_profiles;
create policy "Contractors manage their own contractor profile"
  on public.contractor_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage contractor profiles" on public.contractor_profiles;
create policy "Admins manage contractor profiles"
  on public.contractor_profiles for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.homeowner_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  address text not null default '',
  city text not null default '',
  province text not null default 'ON',
  postal_code text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.homeowner_profiles enable row level security;

drop policy if exists "Homeowners manage their own homeowner profile" on public.homeowner_profiles;
create policy "Homeowners manage their own homeowner profile"
  on public.homeowner_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage homeowner profiles" on public.homeowner_profiles;
create policy "Admins manage homeowner profiles"
  on public.homeowner_profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Catalog
-- ---------------------------------------------------------------------------

create table if not exists public.product_categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  icon text not null default 'Boxes',
  image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_categories enable row level security;

drop policy if exists "Anyone can read active categories" on public.product_categories;
create policy "Anyone can read active categories"
  on public.product_categories for select
  using (is_active or public.is_admin());

drop policy if exists "Admins manage categories" on public.product_categories;
create policy "Admins manage categories"
  on public.product_categories for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.products (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  category_id text references public.product_categories(id) on delete set null,
  brand text not null default '',
  sku text,
  -- homeowner_price is the retail price; price mirrors it for generic reads.
  price numeric(10, 2) not null check (price >= 0),
  homeowner_price numeric(10, 2) not null check (homeowner_price >= 0),
  contractor_price numeric(10, 2) not null check (contractor_price >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  stock_status text not null default 'in-stock'
    check (stock_status in ('in-stock', 'low-stock', 'out-of-stock')),
  unit text not null default 'each',
  image_url text,
  image_tone text not null default 'slate',
  rating numeric(2, 1) not null default 0,
  review_count int not null default 0,
  delivery_estimate text not null default '',
  specifications jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (is_active);
create index if not exists products_created_idx on public.products (created_at desc);

drop policy if exists "Anyone can read active products" on public.products;
create policy "Anyone can read active products"
  on public.products for select
  using (is_active or public.is_admin());

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_images enable row level security;
create index if not exists product_images_product_idx on public.product_images (product_id);

drop policy if exists "Anyone can read product images" on public.product_images;
create policy "Anyone can read product images"
  on public.product_images for select
  using (true);

drop policy if exists "Admins manage product images" on public.product_images;
create policy "Admins manage product images"
  on public.product_images for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Projects
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contractor_id uuid references public.profiles(id) on delete set null,
  project_type text not null
    check (project_type in ('repair', 'renovation', 'new_construction', 'package')),
  subtype text not null default '',
  title text not null,
  description text not null default '',
  location text not null default '',
  status text not null default 'planning'
    check (status in ('planning', 'in_progress', 'materials_ready', 'completed', 'cancelled')),
  budget numeric(12, 2),
  timeline text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create index if not exists projects_owner_idx on public.projects (owner_id);
create index if not exists projects_contractor_idx on public.projects (contractor_id);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_created_idx on public.projects (created_at desc);

drop policy if exists "Owners read their own projects" on public.projects;
create policy "Owners read their own projects"
  on public.projects for select
  using (auth.uid() = owner_id or auth.uid() = contractor_id or public.is_admin());

drop policy if exists "Owners create their own projects" on public.projects;
create policy "Owners create their own projects"
  on public.projects for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owners update their own projects" on public.projects;
create policy "Owners update their own projects"
  on public.projects for update
  using (auth.uid() = owner_id or auth.uid() = contractor_id)
  with check (auth.uid() = owner_id or auth.uid() = contractor_id);

drop policy if exists "Admins manage projects" on public.projects;
create policy "Admins manage projects"
  on public.projects for all
  using (public.is_admin())
  with check (public.is_admin());

-- Type-specific detail, kept out of projects so each flow can evolve.
create table if not exists public.new_construction_details (
  project_id uuid primary key references public.projects(id) on delete cascade,
  tier text not null default 'basic' check (tier in ('basic', 'paid', 'premium')),
  answers jsonb not null default '{}'::jsonb,
  estimate_low numeric(12, 2),
  estimate_high numeric(12, 2),
  estimate_assumptions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.new_construction_details enable row level security;

drop policy if exists "Access construction details through the project" on public.new_construction_details;
create policy "Access construction details through the project"
  on public.new_construction_details for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or p.contractor_id = auth.uid())
    ) or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    ) or public.is_admin()
  );

create table if not exists public.renovation_details (
  project_id uuid primary key references public.projects(id) on delete cascade,
  property_type text not null default 'house' check (property_type in ('condo', 'house')),
  is_owner boolean not null default true,
  renovation_type text not null default '',
  -- Extra questions land here so new ones don't need a migration.
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.renovation_details enable row level security;

drop policy if exists "Access renovation details through the project" on public.renovation_details;
create policy "Access renovation details through the project"
  on public.renovation_details for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or p.contractor_id = auth.uid())
    ) or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    ) or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 5. Orders
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  order_type text not null default 'materials'
    check (order_type in ('materials', 'package', 'service')),
  status text not null default 'processing'
    check (status in ('processing', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  shipping numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  delivery_method text not null default 'standard',
  contact jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_project_idx on public.orders (project_id);

drop policy if exists "Users read their own orders" on public.orders;
create policy "Users read their own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users create their own orders" on public.orders;
create policy "Users create their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  quantity int not null check (quantity > 0),
  unit_price numeric(10, 2) not null default 0,
  total_price numeric(12, 2) not null default 0,
  project_id uuid references public.projects(id) on delete set null
);

alter table public.order_items enable row level security;

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

drop policy if exists "Users read items of their own orders" on public.order_items;
create policy "Users read items of their own orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    ) or public.is_admin()
  );

drop policy if exists "Users add items to their own orders" on public.order_items;
create policy "Users add items to their own orders"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- Server-side price integrity: the client never decides what something
-- costs. unit_price is overwritten from the catalog using the buyer's
-- role, and inactive products are rejected outright.
create or replace function public.enforce_order_item_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  product_row public.products%rowtype;
  buyer_role text;
begin
  select * into product_row from public.products where id = new.product_id;

  if not found then
    raise exception 'Unknown product %', new.product_id;
  end if;

  if not product_row.is_active then
    raise exception 'Product % is not available for ordering', new.product_id;
  end if;

  if new.quantity is null or new.quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select p.role into buyer_role
  from public.orders o
  join public.profiles p on p.id = o.user_id
  where o.id = new.order_id;

  new.unit_price := case
    when buyer_role = 'contractor' then product_row.contractor_price
    else product_row.homeowner_price
  end;
  new.total_price := round(new.unit_price * new.quantity, 2);

  return new;
end;
$$;

drop trigger if exists order_items_enforce_price on public.order_items;
create trigger order_items_enforce_price
  before insert or update on public.order_items
  for each row execute function public.enforce_order_item_price();

-- Recalculate order money from its items, never from client input.
create or replace function public.recalculate_order_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order uuid := coalesce(new.order_id, old.order_id);
  new_subtotal numeric(12, 2);
  new_shipping numeric(12, 2);
  new_tax numeric(12, 2);
begin
  select coalesce(sum(total_price), 0) into new_subtotal
  from public.order_items where order_id = target_order;

  new_shipping := case
    when new_subtotal = 0 or new_subtotal >= 500 then 0 else 79
  end;
  new_tax := round((new_subtotal + new_shipping) * 0.13, 2);

  update public.orders
  set subtotal = new_subtotal,
      shipping = new_shipping,
      tax = new_tax,
      total = round(new_subtotal + new_shipping + new_tax, 2),
      updated_at = now()
  where id = target_order;

  return null;
end;
$$;

drop trigger if exists order_items_recalc on public.order_items;
create trigger order_items_recalc
  after insert or update or delete on public.order_items
  for each row execute function public.recalculate_order_totals();

-- ---------------------------------------------------------------------------
-- 6. Packages
-- ---------------------------------------------------------------------------

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  contractor_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  description text not null default '',
  project_type text not null default 'renovation',
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text not null default '',
  status text not null default 'sent'
    check (status in ('draft', 'sent', 'approved', 'ordered', 'cancelled')),
  total_price numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.packages enable row level security;

create index if not exists packages_contractor_idx on public.packages (contractor_id);
create index if not exists packages_customer_idx on public.packages (customer_id);
create index if not exists packages_status_idx on public.packages (status);

-- A customer sees a package when they're linked by id, or when their
-- account email matches the address the contractor addressed it to.
drop policy if exists "Package visible to contractor, customer or admin" on public.packages;
create policy "Package visible to contractor, customer or admin"
  on public.packages for select
  using (
    auth.uid() = contractor_id
    or auth.uid() = customer_id
    or lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or public.is_admin()
  );

drop policy if exists "Contractors create their own packages" on public.packages;
create policy "Contractors create their own packages"
  on public.packages for insert
  with check (auth.uid() = contractor_id);

drop policy if exists "Contractors update their own packages" on public.packages;
create policy "Contractors update their own packages"
  on public.packages for update
  using (auth.uid() = contractor_id)
  with check (auth.uid() = contractor_id);

drop policy if exists "Admins manage packages" on public.packages;
create policy "Admins manage packages"
  on public.packages for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  product_id text not null references public.products(id),
  quantity int not null check (quantity > 0),
  price numeric(10, 2) not null default 0
);

alter table public.package_items enable row level security;
create index if not exists package_items_package_idx on public.package_items (package_id);

drop policy if exists "Package items follow package visibility" on public.package_items;
create policy "Package items follow package visibility"
  on public.package_items for select
  using (
    exists (
      select 1 from public.packages p
      where p.id = package_id
        and (
          p.contractor_id = auth.uid()
          or p.customer_id = auth.uid()
          or lower(p.customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    ) or public.is_admin()
  );

drop policy if exists "Contractors manage their package items" on public.package_items;
create policy "Contractors manage their package items"
  on public.package_items for all
  using (
    exists (
      select 1 from public.packages p
      where p.id = package_id and p.contractor_id = auth.uid()
    ) or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.packages p
      where p.id = package_id and p.contractor_id = auth.uid()
    ) or public.is_admin()
  );

-- Package line prices always come from the catalog's contractor price.
create or replace function public.enforce_package_item_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  product_row public.products%rowtype;
begin
  select * into product_row from public.products where id = new.product_id;
  if not found then
    raise exception 'Unknown product %', new.product_id;
  end if;
  if not product_row.is_active then
    raise exception 'Product % is not available', new.product_id;
  end if;

  new.price := product_row.contractor_price;
  return new;
end;
$$;

drop trigger if exists package_items_enforce_price on public.package_items;
create trigger package_items_enforce_price
  before insert or update on public.package_items
  for each row execute function public.enforce_package_item_price();

create or replace function public.recalculate_package_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_package uuid := coalesce(new.package_id, old.package_id);
  new_subtotal numeric(12, 2);
begin
  select coalesce(sum(price * quantity), 0) into new_subtotal
  from public.package_items where package_id = target_package;

  update public.packages
  set total_price = round(new_subtotal * 1.13, 2) +
        case when new_subtotal = 0 then 0 else 79 end,
      updated_at = now()
  where id = target_package;

  return null;
end;
$$;

drop trigger if exists package_items_recalc on public.package_items;
create trigger package_items_recalc
  after insert or update or delete on public.package_items
  for each row execute function public.recalculate_package_total();

-- ---------------------------------------------------------------------------
-- 7. Services, service requests, call orders, premium requests
-- ---------------------------------------------------------------------------

create table if not exists public.services (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  icon text not null default 'Wrench',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;

drop policy if exists "Anyone can read active services" on public.services;
create policy "Anyone can read active services"
  on public.services for select
  using (is_active or public.is_admin());

drop policy if exists "Admins manage services" on public.services;
create policy "Admins manage services"
  on public.services for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  service_type text not null,
  category text not null default '',
  subcategory text not null default '',
  status text not null default 'requested'
    check (status in ('requested', 'reviewing', 'contacted', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  details jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  notes text not null default '',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_requests enable row level security;

create index if not exists service_requests_user_idx on public.service_requests (user_id);
create index if not exists service_requests_status_idx on public.service_requests (status);
create index if not exists service_requests_type_idx on public.service_requests (service_type);
create index if not exists service_requests_created_idx on public.service_requests (created_at desc);

drop policy if exists "Users read their own service requests" on public.service_requests;
create policy "Users read their own service requests"
  on public.service_requests for select
  using (auth.uid() = user_id or auth.uid() = assigned_to or public.is_admin());

drop policy if exists "Users create their own service requests" on public.service_requests;
create policy "Users create their own service requests"
  on public.service_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage service requests" on public.service_requests;
create policy "Admins manage service requests"
  on public.service_requests for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.call_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  category text not null,
  preferred_date date not null,
  preferred_time text not null,
  phone text not null default '',
  notes text not null default '',
  status text not null default 'scheduled'
    check (status in ('scheduled', 'confirmed', 'completed', 'cancelled')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.call_orders enable row level security;

create index if not exists call_orders_user_idx on public.call_orders (user_id);
create index if not exists call_orders_status_idx on public.call_orders (status);
create index if not exists call_orders_date_idx on public.call_orders (preferred_date);

drop policy if exists "Users read their own call orders" on public.call_orders;
create policy "Users read their own call orders"
  on public.call_orders for select
  using (auth.uid() = user_id or auth.uid() = assigned_to or public.is_admin());

drop policy if exists "Users create their own call orders" on public.call_orders;
create policy "Users create their own call orders"
  on public.call_orders for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users cancel their own call orders" on public.call_orders;
create policy "Users cancel their own call orders"
  on public.call_orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage call orders" on public.call_orders;
create policy "Admins manage call orders"
  on public.call_orders for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.premium_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  selected_services text[] not null default '{}',
  status text not null default 'requested'
    check (status in ('requested', 'reviewing', 'contacted', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  budget_range text not null default '',
  notes text not null default '',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.premium_requests enable row level security;

create index if not exists premium_requests_user_idx on public.premium_requests (user_id);
create index if not exists premium_requests_status_idx on public.premium_requests (status);

drop policy if exists "Users read their own premium requests" on public.premium_requests;
create policy "Users read their own premium requests"
  on public.premium_requests for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users create their own premium requests" on public.premium_requests;
create policy "Users create their own premium requests"
  on public.premium_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage premium requests" on public.premium_requests;
create policy "Admins manage premium requests"
  on public.premium_requests for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 8. Drawings + material calculations
-- ---------------------------------------------------------------------------

create table if not exists public.drawing_uploads (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  project_name text not null default '',
  location text not null default '',
  drawing_type text not null default '',
  comments text not null default '',
  file_path text not null,
  file_name text not null,
  file_type text not null,
  file_size int not null default 0,
  processing_status text not null default 'uploaded'
    check (processing_status in ('uploaded', 'analyzing', 'ready', 'failed')),
  material_calculation_status text not null default 'pending'
    check (material_calculation_status in ('pending', 'in_progress', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drawing_uploads enable row level security;

create index if not exists drawing_uploads_user_idx on public.drawing_uploads (user_id);
create index if not exists drawing_uploads_status_idx on public.drawing_uploads (processing_status);
create index if not exists drawing_uploads_created_idx on public.drawing_uploads (created_at desc);

drop policy if exists "Users read their own drawings" on public.drawing_uploads;
create policy "Users read their own drawings"
  on public.drawing_uploads for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users upload their own drawings" on public.drawing_uploads;
create policy "Users upload their own drawings"
  on public.drawing_uploads for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage drawings" on public.drawing_uploads;
create policy "Admins manage drawings"
  on public.drawing_uploads for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.material_calculations (
  id uuid primary key default gen_random_uuid(),
  drawing_id uuid not null references public.drawing_uploads(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  material_name text not null,
  category text not null default '',
  quantity numeric(12, 2) not null default 0,
  unit text not null default '',
  estimated_price numeric(12, 2) not null default 0,
  -- 'estimated' until a real takeoff engine exists; never implies AI.
  calculation_source text not null default 'manual'
    check (calculation_source in ('manual', 'prototype', 'automated')),
  confidence text not null default 'unverified'
    check (confidence in ('unverified', 'low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

alter table public.material_calculations enable row level security;
create index if not exists material_calculations_drawing_idx on public.material_calculations (drawing_id);

drop policy if exists "Material calcs follow drawing visibility" on public.material_calculations;
create policy "Material calcs follow drawing visibility"
  on public.material_calculations for select
  using (
    exists (
      select 1 from public.drawing_uploads d
      where d.id = drawing_id and d.user_id = auth.uid()
    ) or public.is_admin()
  );

drop policy if exists "Admins manage material calculations" on public.material_calculations;
create policy "Admins manage material calculations"
  on public.material_calculations for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 9. Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('avatars', 'avatars', true),
  ('drawings', 'drawings', false),
  ('project-files', 'project-files', false)
on conflict (id) do nothing;

-- Public read for presentational buckets; admin-only writes for products.
drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Admins write product images" on storage.objects;
create policy "Admins write product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users write their own avatar" on storage.objects;
create policy "Users write their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Drawings and project files are private, one folder per user.
drop policy if exists "Users read their own drawings" on storage.objects;
create policy "Users read their own drawings"
  on storage.objects for select
  using (
    bucket_id = 'drawings'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "Users upload their own drawings" on storage.objects;
create policy "Users upload their own drawings"
  on storage.objects for insert
  with check (
    bucket_id = 'drawings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users read their own project files" on storage.objects;
create policy "Users read their own project files"
  on storage.objects for select
  using (
    bucket_id = 'project-files'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "Users upload their own project files" on storage.objects;
create policy "Users upload their own project files"
  on storage.objects for insert
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 10. Seed: categories, products, services
-- ---------------------------------------------------------------------------

insert into public.product_categories (id, name, slug, icon, sort_order) values
  ('lumber', 'Lumber & Wood', 'lumber-wood', 'Boxes', 1),
  ('flooring', 'Flooring', 'flooring', 'Ruler', 2),
  ('plumbing', 'Plumbing', 'plumbing', 'Wrench', 3),
  ('electrical', 'Electrical', 'electrical', 'AlertTriangle', 4),
  ('doors-windows', 'Doors & Windows', 'doors-windows', 'Home', 5),
  ('roofing', 'Roofing', 'roofing', 'Building2', 6),
  ('hardware', 'Hardware', 'hardware', 'Package', 7),
  ('paint', 'Paint & Finishes', 'paint-finishes', 'Palette', 8),
  ('tools', 'Tools & Equipment', 'tools-equipment', 'Wrench', 9)
on conflict (id) do nothing;

insert into public.products
  (id, name, slug, description, category_id, brand, price, homeowner_price,
   contractor_price, unit, stock_status, stock_quantity, rating, review_count,
   delivery_estimate, image_tone, specifications)
values
  ('lum-2x4-8', 'Pressure Treated Lumber 2x4x8', 'pressure-treated-lumber-2x4x8',
   'Kiln-dried pressure treated spruce, rated for ground contact.', 'lumber', 'Timberline',
   9.45, 9.45, 8.45, 'piece', 'in-stock', 420, 4.6, 214, 'Delivers in 2–3 business days', 'sand',
   '[{"label":"Dimensions","value":"1.5 in x 3.5 in x 8 ft"},{"label":"Treatment","value":"Ground contact rated"}]'::jsonb),
  ('lum-ply-4x8', 'Plywood Sheet 4x8 (¾ in)', 'plywood-sheet-4x8',
   'Sanded structural plywood for subfloors, sheathing and cabinetry.', 'lumber', 'Northcore',
   46.00, 46.00, 42.00, 'sheet', 'in-stock', 180, 4.4, 138, 'Delivers in 2–3 business days', 'sand',
   '[{"label":"Thickness","value":"¾ in (19 mm)"},{"label":"Sheet size","value":"4 ft x 8 ft"}]'::jsonb),
  ('plm-pvc-2', 'PVC Pipe 2"', 'pvc-pipe-2in',
   'Schedule 40 PVC drain pipe for waste and vent applications.', 'plumbing', 'Charlotte Pipe',
   14.25, 14.25, 12.50, 'piece', 'in-stock', 260, 4.7, 96, 'Delivers in 2–3 business days', 'slate',
   '[{"label":"Diameter","value":"2 in"},{"label":"Length","value":"10 ft"}]'::jsonb),
  ('con-mix-50', 'Concrete Mix 50 lb', 'concrete-mix-50lb',
   'General purpose concrete mix for footings, posts and slabs.', 'hardware', 'Quinlite',
   6.75, 6.75, 5.95, 'bag', 'in-stock', 800, 4.5, 302, 'Delivers in 2–3 business days', 'slate',
   '[{"label":"Weight","value":"50 lb (22.7 kg)"},{"label":"Yield","value":"0.375 cu ft per bag"}]'::jsonb),
  ('flr-tile-12', 'Ceramic Tile (12x12)', 'ceramic-tile-12x12',
   'Glazed ceramic floor tile with a matte finish.', 'flooring', 'Daltile',
   1.55, 1.55, 1.25, 'sq ft', 'in-stock', 5000, 4.3, 187, 'Delivers in 3–5 business days', 'sand',
   '[{"label":"Size","value":"12 in x 12 in"},{"label":"PEI rating","value":"PEI 3"}]'::jsonb),
  ('plm-faucet-br', 'Brass Bathroom Faucet', 'brass-bathroom-faucet',
   'Single-handle brass lavatory faucet with ceramic disc valve.', 'plumbing', 'Moen',
   104.99, 104.99, 89.99, 'each', 'low-stock', 12, 4.8, 421, 'Delivers in 3–5 business days', 'sand',
   '[{"label":"Finish","value":"Brushed brass"},{"label":"Warranty","value":"Limited lifetime"}]'::jsonb),
  ('elc-wire-12', 'Electrical Wire 12/2 NMD90', 'electrical-wire-12-2',
   'Copper NMD90 building wire for branch circuits in dry indoor locations.', 'electrical', 'Southwire',
   1.05, 1.05, 0.85, 'ft', 'in-stock', 3000, 4.6, 158, 'Delivers in 2–3 business days', 'slate',
   '[{"label":"Gauge","value":"12 AWG, 2 conductor + ground"},{"label":"Rating","value":"90°C dry"}]'::jsonb),
  ('rof-shingle', 'Architectural Roof Shingles', 'architectural-roof-shingles',
   'Laminated asphalt shingles with algae resistance.', 'roofing', 'CertainTeed',
   32.50, 32.50, 28.50, 'bundle', 'in-stock', 340, 4.7, 264, 'Delivers in 5–7 business days', 'slate',
   '[{"label":"Coverage","value":"33.3 sq ft per bundle"},{"label":"Wind rating","value":"Up to 175 km/h"}]'::jsonb),
  ('pnt-interior', 'Interior Latex Paint — Eggshell', 'interior-latex-paint-eggshell',
   'Low-VOC interior latex with washable eggshell sheen.', 'paint', 'Benjamin Moore',
   68.00, 68.00, 58.00, 'gallon', 'in-stock', 150, 4.9, 512, 'Delivers in 2–3 business days', 'forest',
   '[{"label":"Sheen","value":"Eggshell"},{"label":"Coverage","value":"350–400 sq ft per gallon"}]'::jsonb),
  ('drw-sheet', 'Drywall Sheet 4x8 (½ in)', 'drywall-sheet-4x8',
   'Standard gypsum wallboard with tapered edges.', 'hardware', 'CGC',
   18.50, 18.50, 15.75, 'sheet', 'in-stock', 600, 4.2, 143, 'Delivers in 2–3 business days', 'slate',
   '[{"label":"Thickness","value":"½ in (12.7 mm)"},{"label":"Edge","value":"Tapered"}]'::jsonb),
  ('dw-entry-door', 'Fiberglass Entry Door 36 in', 'fiberglass-entry-door-36',
   'Insulated fiberglass entry door slab, paint-ready.', 'doors-windows', 'Masonite',
   689.00, 689.00, 615.00, 'each', 'low-stock', 6, 4.5, 78, 'Delivers in 7–10 business days', 'sand',
   '[{"label":"Width","value":"36 in"},{"label":"Core","value":"Polyurethane foam"}]'::jsonb),
  ('tls-circ-saw', 'Circular Saw 7¼ in', 'circular-saw-7-25',
   '15-amp corded circular saw with electric brake.', 'tools', 'DeWalt',
   229.00, 229.00, 199.00, 'each', 'in-stock', 45, 4.8, 634, 'Delivers in 2–3 business days', 'navy',
   '[{"label":"Blade","value":"7¼ in"},{"label":"Motor","value":"15 amp"}]'::jsonb)
on conflict (id) do nothing;

insert into public.services (id, name, slug, description, icon, sort_order) values
  ('repair', 'Repair', 'repair', 'Fix an existing problem.', 'Wrench', 1),
  ('renovation', 'Renovation', 'renovation', 'Upgrade an existing space.', 'Ruler', 2),
  ('new_construction', 'New Construction', 'new-construction', 'Build from the ground up.', 'Building2', 3),
  ('premium_package', 'Premium Package', 'premium-package', 'Full project management with expert support.', 'Crown', 4),
  ('expert_consultation', 'Expert Consultation', 'expert-consultation', 'Talk to a project advisor.', 'Headset', 5),
  ('architect', 'Architect Support', 'architect', 'Design and drawings from a licensed architect.', 'PencilRuler', 6),
  ('permit_assistance', 'Permit Assistance', 'permit-assistance', 'Help preparing and tracking permits.', 'FileCheck', 7),
  ('call_ordering', 'Call Ordering', 'call-ordering', 'Place an order over the phone.', 'Phone', 8)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 11. Keep profiles.email in sync + promote the first admin
-- ---------------------------------------------------------------------------

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and (p.email is null or p.email = '');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'homeowner'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Promote the existing operator account to admin so the admin panel is
-- reachable. Change this address if a different account should own it.
update public.profiles
set role = 'admin'
where email = 'himanshudbg1722@gmail.com';
