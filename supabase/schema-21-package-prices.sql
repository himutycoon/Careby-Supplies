-- ===========================================================================
-- 21 — Let a contractor hide prices from their customer
--
-- Run any time after schema-05. Safe to re-run.
--
-- WHY
-- A contractor quotes their customer a number that includes their own
-- margin. The selection portal showed our trade prices against every
-- line, so sending a customer the link meant showing them what the
-- materials cost us — which is why contractors were not sending it.
--
-- Defaults to true, so every package that already exists behaves exactly
-- as it does today. Hiding is a decision the contractor makes per
-- package, because some of them quote cost-plus and want it shown.
--
-- This only governs what the CUSTOMER sees. The contractor's own review
-- screen always shows the money — it is their package.
-- ===========================================================================

alter table public.packages
  add column if not exists show_prices boolean not null default true;

comment on column public.packages.show_prices is
  'False hides every amount from the customer selection portal. The contractor always sees them.';

select
  count(*) as packages,
  count(*) filter (where show_prices) as showing_prices
  from public.packages;
