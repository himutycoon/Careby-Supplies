-- ===========================================================================
-- 29 — Chatbot knowledge base and question log
--
-- Run after schema-28. Safe to re-run (seed only inserts missing entries).
--
-- WHY
-- Keyword rules answer the common questions, and one "facts" text box fed
-- the AI. That box couldn't hold what the site actually offers: services,
-- package tiers, pricing, policies, how each flow works. This adds:
--
--   chatbot_knowledge  — one entry per topic, edited at /admin/chatbot.
--                        The AI reads these to answer anything the rules
--                        don't. Products and SKUs are NOT copied here: the
--                        bot searches public.products live, so a price or
--                        stock change in Admin > Products is what it sees.
--
--   chatbot_questions  — what visitors asked the AI and what it answered,
--                        so the admin can spot gaps and add knowledge.
--                        Written by the server with the service-role key
--                        only; visitors can't read or write it.
-- ===========================================================================

create table if not exists public.chatbot_knowledge (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'General',
  content text not null,
  keywords text[] not null default '{}',
  enabled boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  constraint chatbot_knowledge_title_key unique (title)
);

comment on table public.chatbot_knowledge is
  'What the website AI assistant knows. Edited at /admin/chatbot.';

alter table public.chatbot_knowledge enable row level security;

-- Customer-facing facts, so enabled entries are public like the rules.
drop policy if exists "Enabled chatbot knowledge is public" on public.chatbot_knowledge;
create policy "Enabled chatbot knowledge is public"
  on public.chatbot_knowledge for select
  using (enabled or public.is_admin());

drop policy if exists "Admins manage chatbot knowledge" on public.chatbot_knowledge;
create policy "Admins manage chatbot knowledge"
  on public.chatbot_knowledge for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.chatbot_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  reply text not null default '',
  -- false when the AI said it didn't know, or the call failed
  answered boolean not null default true,
  products_shown text[] not null default '{}',
  page text not null default '',
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chatbot_questions_created_idx on public.chatbot_questions (created_at desc);

alter table public.chatbot_questions enable row level security;

-- No insert policy: only the service-role key (server) writes here.
drop policy if exists "Admins read chatbot questions" on public.chatbot_questions;
create policy "Admins read chatbot questions"
  on public.chatbot_questions for select
  using (public.is_admin());

drop policy if exists "Admins update chatbot questions" on public.chatbot_questions;
create policy "Admins update chatbot questions"
  on public.chatbot_questions for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins delete chatbot questions" on public.chatbot_questions;
create policy "Admins delete chatbot questions"
  on public.chatbot_questions for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed: what the site says today (data/mock.ts, data/platform.ts,
-- data/new-construction.ts, lib/rules/*). Edit these in the admin panel.
-- ---------------------------------------------------------------------------
insert into public.chatbot_knowledge (title, category, content, keywords, sort_order) values
  ('About CareBy Supplies', 'Company',
   'CareBy Supplies is a building-materials supplier based in Mississauga, Ontario. We sell and deliver materials for repairs, renovations and new builds, and help people work out exactly what a job needs. We do NOT install, employ trades or manage the work; that stays with the customer''s own contractor.',
   array['about','who are you','company','install','installation'], 10),
  ('Contact details', 'Company',
   'Phone / WhatsApp: +1 437 522 4606. Email: carebysupplies@gmail.com. Location: Mississauga, ON, Canada. Contact page: /contact.',
   array['contact','phone','email','whatsapp','address'], 20),
  ('Service area', 'Delivery',
   'Based in Mississauga, Ontario. We deliver across Mississauga and the surrounding GTA, with more areas coming soon.',
   array['area','serve','location','city','mississauga','gta','toronto','brampton'], 30),
  ('Delivery and pickup', 'Delivery',
   'Delivery is free on orders of $500 or more (before tax). Under $500 standard delivery is a flat $79. Branch pickup is always free. Scheduled delivery to site is available; the exact day is confirmed with the order. Contractor packages always include the $79 delivery. Prices are before 13% HST.',
   array['delivery','shipping','fee','free delivery','pickup','pick up','cost of delivery','when'], 35),
  ('Who the site is for', 'Company',
   'Two paths. Homeowners: material lists from photos, instant material estimates, and someone to ask when unsure (sign up at /signup?role=homeowner). Contractors: trade pricing on materials, building customer packages, and uploading drawings for takeoffs (sign up at /signup?role=contractor).',
   array['homeowner','contractor','account','sign up','signup','trade'], 40),
  ('Services overview', 'Services',
   'Shop building materials (/products). Repair parts: work out what failed and get the right part (/repair). Renovation material list: tick the parts of the job and get every material it needs, priced (/materials). New construction supply: budget the material for a build stage by stage (/new-construction). Contractor packages: bundle materials and share with a customer. Expert consultation with an advisor who knows local codes and pricing (/premium). Overview: /services.',
   array['services','what do you do','offer','solutions'], 50),
  ('How it works', 'Services',
   '1) Tell us about your project: photos, drawings or a few details. 2) Get an itemised material list priced from our catalogue. 3) Adjust it: swap a grade, change a brand, cut a line; we re-price it. 4) Order and take delivery to site on the day you want, with returns on anything unused. Details: /how-it-works.',
   array['how it works','process','steps'], 60),
  ('Renovation estimate pricing', 'Pricing',
   'Starter: free, instant material estimate for one room (AI photo analysis, itemised material list, what we supply vs what you arrange, email summary). Full Plan: $149 CAD per room, adds a material plan checked by hand, concept after-image, material palette, delivered within 48 hours. Full Home: $399 CAD for up to 4 rooms, priority 48-hour delivery and one round of revisions (contact us). One-time fee per submission, no subscriptions. Start at /materials, pricing at /pricing.',
   array['pricing','price','full plan','starter','full home','149','399','estimate'], 70),
  ('Is the estimate final', 'Pricing',
   'No. The instant estimate is an indicative material list from your photos and dimensions. An advisor checks it by hand and quantities are confirmed against your own measurements before you order. Nothing can see behind a wall, so confirm on site before ordering anything cut to size.',
   array['accurate','accuracy','final','estimate'], 80),
  ('What you get in 48 hours', 'Pricing',
   'With a paid plan: a material plan checked by hand, a concept "after" image and a full itemised material list, emailed and available in your dashboard.',
   array['48 hours','full plan','deliverable'], 90),
  ('New build packages', 'New construction',
   'New construction tiers (/new-construction): Basic (free) – ballpark material cost range, emailed summary, typical lead times. Plan Check ($10 CAD) – an advisor reviews your build plan and prices the material, itemised, with a straight answer on whether the plan holds up. Architect Review ($70 CAD) – a licensed architect reviews your drawings; you can hire them directly for permits (their fees are paid to them). Full Team ($150 CAD) – architect, designer and materials advisor on one thread. Whatever you pay for a package comes back as a discount code for the same amount on your material order, and if you are not happy we refund the package fee.',
   array['new build','new construction','plan check','architect','full team','drawings','permit'], 100),
  ('Expert consultation', 'Services',
   'A one-to-one session with a project advisor plus a curated materials list, $20 CAD. Book at /premium. Other premium tiers are scoped on a call and quoted by the advisor.',
   array['consultation','expert','advisor','call','book'], 110),
  ('Premium supply / DIY support', 'Services',
   'Premium supply / DIY support includes material selection, quantity takeoffs, trade pricing, scheduled delivery, ordering by phone and a named contact. Stages: tell us the job, material list, quantity check, priced and approved, delivered to site, top-ups and returns. Details at /premium.',
   array['premium','diy','takeoff','named contact'], 120),
  ('Contractor tools', 'Contractors',
   'Contractors get trade pricing (a separate contractor price on every product), can build customer packages and share them with the homeowner to approve, upload drawings for material takeoffs, order by category or by phone, and manage projects and orders from /contractor.',
   array['contractor','trade price','package','drawings','takeoff','builder'], 130),
  ('Returns', 'Policies',
   'Anything left over can come back within 30 days. Full terms: /refund.',
   array['return','refund','unused','leftover'], 140),
  ('Pricing transparency', 'Policies',
   'Material lists are itemised with waste allowance, delivery and tax shown separately. Prices are in CAD.',
   array['tax','waste','transparent','cad'], 150)
on conflict (title) do nothing;

-- Databases that ran an earlier copy of this file seeded "Mississauga only",
-- which contradicts the site (GTA delivery). Only rewrites the untouched seed.
update public.chatbot_knowledge
   set content = 'Based in Mississauga, Ontario. We deliver across Mississauga and the surrounding GTA, with more areas coming soon.',
       updated_at = now()
 where title = 'Service area'
   and content = 'We currently serve Mississauga, Ontario, with more municipalities coming soon.';

-- The schema-28 delivery rule left out the fee and pickup. Same guard:
-- only the original seed text is replaced, never an admin's edit.
update public.chatbot_rules
   set answer = 'We deliver across Mississauga and the GTA. Delivery is free on orders of $500+, otherwise $79, and branch pickup is free. The team confirms the delivery day with your order.',
       updated_at = now()
 where id = 'delivery'
   and answer = 'Yes, we deliver across the GTA, and free delivery applies on orders over $500. Timing depends on your items and site, and the team confirms it with your quote.';

update public.chatbot_rules
   set answer = 'Branch pickup is free. Pickup details are confirmed with your order.',
       updated_at = now()
 where id = 'pickup'
   and answer = 'Pickup details are confirmed with your order.';

select
  (select count(*) from public.chatbot_knowledge) as knowledge_entries,
  (select count(*) from public.chatbot_questions) as logged_questions;
