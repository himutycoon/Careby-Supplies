-- ===========================================================================
-- 13 — Paid expert consultation
--
-- Safe to re-run, like every migration before it.
--
-- The Expert Session tier is a fixed-price one-to-one consult, taken up
-- front. Payment state lives on premium_requests alongside the request it
-- pays for, and is written only by the Stripe webhook — the same shape as
-- the order payment columns in schema-09.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Payment columns
--
-- Kept separate from `status`, which tracks the advisor's work
-- (requested → contacted → scheduled → completed). A consultation can be
-- paid and not yet scheduled, or scheduled and refunded.
--
-- amount_paid_cents records what Stripe actually captured, so a mismatch
-- against the quoted fee is visible rather than assumed.
-- ---------------------------------------------------------------------------

alter table public.premium_requests
  add column if not exists payment_status text not null default 'not_required';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'premium_requests_payment_status_check'
  ) then
    alter table public.premium_requests
      add constraint premium_requests_payment_status_check
      check (payment_status in
        ('not_required', 'unpaid', 'pending', 'paid', 'failed', 'refunded'));
  end if;
end;
$$;

alter table public.premium_requests
  add column if not exists fee_cad numeric(10, 2) not null default 0;

alter table public.premium_requests
  add column if not exists stripe_checkout_session_id text;

alter table public.premium_requests
  add column if not exists stripe_payment_intent_id text;

alter table public.premium_requests
  add column if not exists amount_paid_cents bigint;

alter table public.premium_requests
  add column if not exists paid_at timestamptz;

-- Unique, so a retried webhook delivery cannot produce a second paid row.
create unique index if not exists premium_requests_stripe_intent_idx
  on public.premium_requests (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index if not exists premium_requests_payment_status_idx
  on public.premium_requests (payment_status);

-- ---------------------------------------------------------------------------
-- 2. The requester must not be able to mark their own consult paid
--
-- Same reasoning and same shape as guard_order_payment_columns: RLS is
-- row level, the owner-update policy would otherwise allow a PATCH
-- straight to 'paid' through PostgREST, and SECURITY INVOKER is
-- load-bearing so current_user is the role PostgREST switched to rather
-- than the function owner.
-- ---------------------------------------------------------------------------

create or replace function public.guard_premium_payment_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.payment_status is distinct from old.payment_status
     or new.fee_cad is distinct from old.fee_cad
     or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
     or new.stripe_checkout_session_id is distinct from old.stripe_checkout_session_id
     or new.amount_paid_cents is distinct from old.amount_paid_cents
     or new.paid_at is distinct from old.paid_at then
    raise exception 'Payment fields are set by the payment processor, not by the client.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_premium_payment_columns on public.premium_requests;
create trigger guard_premium_payment_columns
  before update on public.premium_requests
  for each row execute function public.guard_premium_payment_columns();
