# CareBy Canada — Handover

Next.js 15 (App Router) + Supabase. TypeScript strict, Tailwind v4, shadcn/ui.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the build
```

`npm run dev` and `npm run build` share the `.next` directory — running dev
after a build overwrites it, so rebuild before `npm start`.

Environment (`.env.local`, not committed):

| Key | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon key — safe in the browser |
| `SUPABASE_SECRET_KEY` | Service role — **server/scripts only, never browser** |
| `ADMIN_EMAILS` | Legacy. Superseded by `profiles.role = 'admin'` |
| `ANTHROPIC_API_KEY` | **Not set.** See "The AI layer" below |

## Database

Migrations live in `supabase/` and are run by hand in the Supabase SQL
Editor, in order. All are safe to re-run.

| File | Adds |
| --- | --- |
| `schema.sql` | `submissions`, renovation-photos bucket |
| `schema-02-admin.sql` | `delivered_plans` |
| `schema-03-narrative.sql` | narrative columns |
| `schema-04-profiles.sql` | `profiles` + signup trigger |
| `schema-05-platform.sql` | catalog, orders, projects, packages, requests, storage |
| `schema-06-flows.sql` | submission→project link, premium details, realtime |
| `schema-07-inventory.sql` | derived stock status |

All seven are applied to the current project.

### Authorization

Authorization is enforced **in the database** by RLS, not in React. Hiding
a button changes nothing; every policy is evaluated on the server for every
request. Admin-ness comes from `profiles.role = 'admin'`, checked by the
`is_admin()` SECURITY DEFINER function.

Two things worth knowing before changing anything here:

- **Prices are set by a database trigger, never by the client.** The
  checkout sends product ids and quantities only. `enforce_order_item_price`
  looks up the catalog price for the buyer's role and overwrites whatever
  arrived. Verified: an order line claiming `$0.01` for a `$229` product is
  stored as `$229`.
- **Stock status is derived, not entered.** `derive_stock_status` computes
  `in-stock` / `low-stock` / `out-of-stock` from `stock_quantity` against the
  per-product `low_stock_threshold`. Maintain the number; the status follows.

## Architecture rule (do not break)

Three separate layers, deliberately:

1. **Vision** — Claude returns structured JSON only. Never costs, never verdicts.
2. **Rules** — pure deterministic TypeScript in `lib/rules/`. The **only**
   place a dollar amount, area or verdict is computed.
3. **Narrative** — Claude writes prose *from* the rules output.

If an LLM is ever about to calculate a cost, area or verdict, stop. The
money math is in `lib/rules/order-totals.ts` and
`lib/rules/calculate-cost.ts` precisely so it is testable and cannot drift
between cart, checkout and order history.

## The AI layer — currently inactive

`ANTHROPIC_API_KEY` is **not set**, so `lib/claude/analyze-photos.ts` and
`lib/claude/generate-narrative.ts` return clearly-marked placeholder output
and log that they are doing so. They do not pretend to be real analysis.

**Any estimate produced today is templated, not vision-analysed.** Do not
demo it as AI until a key is configured.

Likewise `services/drawings.ts` writes material takeoffs with
`calculation_source: 'prototype'` and `confidence: 'unverified'` — there is
no takeoff engine yet, and the database records that fact.

## Before public launch

1. **Legal pages are drafts.** `/privacy`, `/terms` and `/refund` carry a
   visible "awaiting legal review" notice. The text has not been reviewed by
   a lawyer. Ontario consumer protection and PIPEDA both apply. Replace the
   copy and remove the notice in the same change.
2. **Set `ANTHROPIC_API_KEY`**, or keep the AI features off.
3. **Replace the seed catalog.** The 12 products are invented placeholders
   with invented brands. They are not real inventory.
4. **Delete the demo accounts** (below).
5. **Payments are not implemented.** Checkout records an order; it does not
   take money. No Stripe, no payment intent.

## Accounts

| Email | Role |
| --- | --- |
| himanshudbg1722@gmail.com | admin |
| demo.homeowner@careby.test | homeowner |
| demo.contractor@careby.test | contractor |

Both demo accounts exist only to walk through the two non-admin
surfaces. Their password is deliberately not recorded here — this
repository is public, and these are real accounts on the live project.
It is in the team password manager; reset it from the Supabase
Dashboard → Authentication → Users if you need it.

**Delete both accounts before launch**, from that same screen.

Login is one form for everyone; the database role decides where you land
(`admin` → `/admin`, `contractor` → `/contractor`, else `/dashboard`).

## Admin panel

`/admin`, grouped into Overview / Inventory / Requests / People.

The dashboard leads with outstanding work — orders to confirm, stock that
has run out, contractors awaiting verification — each row linking to the
screen that clears it. It says "You're all caught up" when there is nothing
outstanding rather than showing a wall of zeroes.

`/admin/products` is the inventory screen: inline `−/+` stock control
(debounced, one write per adjustment), filter chips with live counts, photo
upload, and create/edit/delete. Deleting a product that appears on an order
is refused with an explanation — deactivate instead, which removes it from
the catalog without touching order history.

## Known gaps

- Payments (Stripe) — not started.
- `product_images` table is unused; products carry a single `image_url`.
- No automated test suite. Verification was done with scripts against the
  live database (RLS paths, price enforcement, stock trigger, realtime).
- Email is Supabase's default auth mail only — no transactional email for
  orders or requests.
