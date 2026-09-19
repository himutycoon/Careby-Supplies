-- ===========================================================================
-- 09 — Stripe payments
--
-- Safe to re-run, like every migration before it.
--
-- Contents:
--   1. orders — payment columns, kept separate from fulfilment status
--   2. RLS — a buyer may never write their own payment state
--   3. Realtime — so the order page flips to "Paid" without a refresh
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Payment columns
--
-- orders.status tracks FULFILMENT (processing → confirmed → shipped →
-- delivered → cancelled). Payment is a separate axis: an order can be paid
-- and not yet shipped, or shipped on account and not yet paid. Folding the
-- two into one column would make "confirmed" mean two different things and
-- would break every existing admin queue that filters on it.
--
-- stripe_payment_intent_id is unique, which is what makes the webhook
-- idempotent: Stripe retries on any non-2xx, and a duplicate delivery then
-- cannot produce a second paid row.
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists payment_status text not null default 'unpaid';

-- Added separately from the column so re-running against a table that
-- already has the column still installs the constraint.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_status_check'
  ) then
    alter table public.orders
      add constraint orders_payment_status_check
      check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded'));
  end if;
end;
$$;

alter table public.orders
  add column if not exists stripe_checkout_session_id text;

alter table public.orders
  add column if not exists stripe_payment_intent_id text;

alter table public.orders
  add column if not exists paid_at timestamptz;

-- The amount Stripe actually captured, in cents, as reported back by the
-- webhook. Stored so a mismatch against total is visible rather than
-- silently trusted.
alter table public.orders
  add column if not exists amount_paid_cents bigint;

create unique index if not exists orders_stripe_payment_intent_idx
  on public.orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index if not exists orders_payment_status_idx
  on public.orders (payment_status);

-- ---------------------------------------------------------------------------
-- 2. A buyer must not be able to mark their own order paid
--
-- The existing owner-update policy on orders lets a user edit their row.
-- That is fine for a contact address; it is not fine for payment_status —
-- a buyer could PATCH themselves to 'paid' straight through PostgREST.
--
-- Postgres RLS has no per-column write control, so this is enforced with a
-- trigger instead: the payment columns may only change when the statement
-- is running as the service role, which is the webhook and nothing else.
-- ---------------------------------------------------------------------------

-- SECURITY INVOKER (the default) is load-bearing here. Under SECURITY
-- DEFINER, current_user returns the function's owner — postgres — rather
-- than the role PostgREST switched to, so a service_role check could never
-- match and this would reject the webhook's own write, leaving every order
-- permanently unpaid.
--
-- Stated as a denylist rather than an allowlist for the same reason: the
-- roles that must be stopped are the two a browser can hold. PostgREST
-- runs as `anon` for a signed-out caller and `authenticated` for a signed-in
-- one; the webhook is `service_role` and the SQL editor is `postgres`, and
-- neither should be locked out of correcting a row.
create or replace function public.guard_order_payment_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.payment_status is distinct from old.payment_status
     or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
     or new.stripe_checkout_session_id is distinct from old.stripe_checkout_session_id
     or new.paid_at is distinct from old.paid_at
     or new.amount_paid_cents is distinct from old.amount_paid_cents then
    raise exception 'Payment fields are set by the payment processor, not by the client.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_order_payment_columns on public.orders;
create trigger guard_order_payment_columns
  before update on public.orders
  for each row execute function public.guard_order_payment_columns();

-- ---------------------------------------------------------------------------
-- 3. Realtime
--
-- The order detail page subscribes so it flips from "Awaiting payment" to
-- "Paid" when the webhook lands, without the customer refreshing.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.orders;
    exception when duplicate_object then null;
    end;
  end if;
end;
$$;
