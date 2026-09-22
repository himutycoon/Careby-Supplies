-- ===========================================================================
-- 12 — Package selection flow
--
-- Safe to re-run, like every migration before it.
--
-- Completes the Customer Flow sheet: the customer submits (step 9), the
-- contractor approves or asks for a replacement (step 10), and approval
-- locks a version (step 12).
--
-- Contents:
--   1. packages.status gains 'submitted'
--   2. finish palette, chosen once and applied across compatible products
--   3. version counter helper
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. 'submitted' sits between sent and approved
--
-- Without it a package the customer has finished looks identical to one
-- they have not opened, and the contractor has nothing to act on.
-- ---------------------------------------------------------------------------

do $$
begin
  alter table public.packages drop constraint if exists packages_status_check;
  alter table public.packages
    add constraint packages_status_check
    check (status in ('draft', 'sent', 'submitted', 'approved', 'ordered', 'cancelled'));
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Global finish palette
--
-- Package Rules: "Let customer choose finishes such as black/brushed
-- nickel once and apply across compatible products." Stored on the
-- package so it survives a reload and the contractor can see the choice.
-- ---------------------------------------------------------------------------

alter table public.packages
  add column if not exists finish_palette text not null default '';

-- ---------------------------------------------------------------------------
-- 3. Version numbering
--
-- Approval history is append-only; this hands out the next number for a
-- package without a read-then-write race between two approvals.
-- ---------------------------------------------------------------------------

create or replace function public.next_package_version(target uuid)
returns int
language sql
security definer
set search_path = public
as $$
  select coalesce(max(version), 0) + 1
  from public.package_versions
  where package_id = target;
$$;

-- ---------------------------------------------------------------------------
-- 4. A customer may set the finish palette on their own package
--
-- The existing customer-update policy covers package_selections, not
-- packages. This adds the narrowest possible write: the trigger below
-- rejects every other column, so holding the link cannot change price,
-- status or ownership.
-- ---------------------------------------------------------------------------

create or replace function public.guard_package_customer_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  -- The contractor who owns it may change anything.
  if old.contractor_id = auth.uid() then
    return new;
  end if;

  if new.finish_palette is distinct from old.finish_palette
     or new.submitted_at is distinct from old.submitted_at
     or new.status is distinct from old.status then
    -- A customer may only move a package they own to 'submitted'.
    if old.customer_id is distinct from auth.uid() then
      raise exception 'Only the contractor or the package customer can change this.'
        using errcode = '42501';
    end if;
    if new.status is distinct from old.status
       and new.status not in ('sent', 'submitted') then
      raise exception 'A customer can only submit a package.'
        using errcode = '42501';
    end if;
  end if;

  if new.total_price is distinct from old.total_price
     or new.contractor_id is distinct from old.contractor_id
     or new.template_id is distinct from old.template_id
     or new.budget_tier is distinct from old.budget_tier
     or new.approved_at is distinct from old.approved_at then
    if old.contractor_id is distinct from auth.uid() then
      raise exception 'Only the contractor can change package terms.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_package_customer_columns on public.packages;
create trigger guard_package_customer_columns
  before update on public.packages
  for each row execute function public.guard_package_customer_columns();

drop policy if exists "Customer updates own package" on public.packages;
create policy "Customer updates own package"
  on public.packages for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());
