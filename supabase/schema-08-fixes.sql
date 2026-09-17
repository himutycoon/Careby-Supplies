-- ===========================================================================
-- 08 — Correctness fixes and the tables the site was missing
--
-- Safe to re-run, like every migration before it.
--
-- Contents:
--   1. material_calculations — let a drawing's owner write its takeoff
--   2. recalculate_package_total — match the rules layer's money math
--   3. recalculate_order_totals — honour branch pickup
--   4. projects — record the support package a contractor chose
--   5. contact_messages — the contact form had nowhere to write
--   6. newsletter_subscribers — same for the footer signup
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Material calculations
--
-- The table had SELECT for the drawing's owner and ALL for admins, but
-- services/drawings.ts writes the takeoff as the contractor who uploaded
-- the drawing. Every "Calculate Materials" click failed with 42501 and the
-- drawing sat at "In review" forever.
--
-- Scoped to rows whose parent drawing belongs to the caller, so this grants
-- nothing beyond the drawings a contractor already owns.
-- ---------------------------------------------------------------------------

drop policy if exists "Drawing owners manage their material calculations"
  on public.material_calculations;
create policy "Drawing owners manage their material calculations"
  on public.material_calculations for all
  using (
    exists (
      select 1 from public.drawing_uploads d
      where d.id = drawing_id and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.drawing_uploads d
      where d.id = drawing_id and d.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Package totals
--
-- This trigger computed round(subtotal * 1.13, 2) + 79 — tax on the goods,
-- then delivery added untaxed — while lib/rules/order-totals.ts computes
-- (subtotal + delivery) * 1.13. A two-item package showed $380 in the
-- builder and the customer portal but stored $369, and the contractor's
-- Saved Packages list showed the stored figure.
--
-- The rules layer is the specification; this now matches it exactly. HST
-- applies to delivery in Ontario, so the rules layer was the correct one.
-- ---------------------------------------------------------------------------

create or replace function public.recalculate_package_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_package uuid := coalesce(new.package_id, old.package_id);
  new_subtotal numeric(12, 2);
  new_delivery numeric(12, 2);
begin
  select coalesce(sum(price * quantity), 0) into new_subtotal
  from public.package_items where package_id = target_package;

  -- Packages always carry delivery: the contractor is the buyer.
  new_delivery := case when new_subtotal = 0 then 0 else 79 end;

  update public.packages
  set total_price = round((new_subtotal + new_delivery) * 1.13, 2)
        + new_delivery,
      updated_at = now()
  where id = target_package;

  return null;
end;
$$;

-- Bring existing package rows onto the corrected figure.
update public.packages p
set total_price = sub.corrected
from (
  select
    pk.id,
    round((coalesce(sum(pi.price * pi.quantity), 0)
      + case when coalesce(sum(pi.price * pi.quantity), 0) = 0 then 0 else 79 end
    ) * 1.13, 2)
    + case when coalesce(sum(pi.price * pi.quantity), 0) = 0 then 0 else 79 end
      as corrected
  from public.packages pk
  left join public.package_items pi on pi.package_id = pk.id
  group by pk.id
) as sub
where p.id = sub.id and p.total_price is distinct from sub.corrected;

-- ---------------------------------------------------------------------------
-- 3. Order totals
--
-- Checkout offers "Branch pickup — Free" but delivery was derived from the
-- subtotal alone, so picking it up still cost $79. The order already stores
-- delivery_method, and it is written before the items that fire this
-- trigger, so it can simply be read here.
--
-- ilike rather than = because orders placed before this migration stored
-- the option's label ("Branch pickup") rather than its id ("pickup").
-- ---------------------------------------------------------------------------

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
  order_delivery text;
begin
  select coalesce(sum(total_price), 0) into new_subtotal
  from public.order_items where order_id = target_order;

  select delivery_method into order_delivery
  from public.orders where id = target_order;

  new_shipping := case
    when new_subtotal = 0 then 0
    when coalesce(order_delivery, '') ilike '%pickup%' then 0
    when new_subtotal >= 500 then 0
    else 79
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

-- ---------------------------------------------------------------------------
-- 4. Project support package
--
-- The contractor's Category Order flow offers Basic / Standard / Premium
-- support tiers and then threw the choice away — it was never stored and
-- never charged. Recorded on the project so the team can see what was
-- asked for; the accompanying service_request is what gets actioned.
-- ---------------------------------------------------------------------------

alter table public.projects
  add column if not exists support_package text not null default '';

alter table public.projects
  add column if not exists support_package_price numeric(12, 2);

-- ---------------------------------------------------------------------------
-- 5. Contact messages
--
-- /contact called preventDefault and did nothing else. Sixteen links across
-- the site funnel into it — every "Talk to an Expert", "Request
-- Consultation", "Get a Quote", the contractor sidebar's "Help & Support"
-- and the customer portal's "Send a message".
--
-- Anonymous insert is deliberate: the page is public and the whole point is
-- that someone who is not signed in can reach us. Reading is admin-only.
-- ---------------------------------------------------------------------------

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  -- Null for a signed-out visitor; set when we know who wrote it.
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null default '',
  message text not null,
  -- Which CTA sent them here, so the team can see what was being asked.
  source text not null default 'contact',
  status text not null default 'new'
    check (status in ('new', 'reading', 'replied', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

drop policy if exists "Anyone can send a contact message" on public.contact_messages;
create policy "Anyone can send a contact message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Users read their own contact messages" on public.contact_messages;
create policy "Users read their own contact messages"
  on public.contact_messages for select
  using (user_id is not null and user_id = auth.uid());

drop policy if exists "Admins manage contact messages" on public.contact_messages;
create policy "Admins manage contact messages"
  on public.contact_messages for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Newsletter subscribers
--
-- The footer form was dead in the same way. Insert-only for the public:
-- a subscriber must not be able to read the list or unsubscribe someone
-- else, and a duplicate email is handled in the service as "already
-- subscribed" rather than surfaced as an error.
-- ---------------------------------------------------------------------------

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed')),
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Anyone can subscribe" on public.newsletter_subscribers;
create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins manage subscribers" on public.newsletter_subscribers;
create policy "Admins manage subscribers"
  on public.newsletter_subscribers for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Realtime
--
-- So the admin inbox behaves like the other admin queues.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.contact_messages;
    exception when duplicate_object then null;
    end;
  end if;
end;
$$;
