-- ---------------------------------------------------------------------------
-- schema-14 — the new-build package ladder
--
-- The tiers changed from three (basic / paid / premium) to four, with
-- names that say what they are: basic, plan-check, architect-review,
-- full-team. new_construction_details.tier has a CHECK constraint on the
-- old three, so an insert carrying 'plan-check' fails the whole project
-- save. This widens it.
--
-- The legacy values stay allowed. Rows written before today hold 'paid'
-- and 'premium', and a constraint that rejects existing data cannot be
-- added at all — every one of those rows would have to be rewritten
-- first, and there is no reason to touch a customer's saved project to
-- rename a plan they already bought.
--
-- Safe to run twice.
-- ---------------------------------------------------------------------------

alter table public.new_construction_details
  drop constraint if exists new_construction_details_tier_check;

alter table public.new_construction_details
  add constraint new_construction_details_tier_check
  check (
    tier in (
      -- current
      'basic',
      'plan-check',
      'architect-review',
      'full-team',
      -- pre-schema-14, kept so existing rows stay valid
      'paid',
      'premium'
    )
  );
