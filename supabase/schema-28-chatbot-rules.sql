-- ===========================================================================
-- 28 — Chatbot rules and settings move out of code
--
-- Run any time. Safe to re-run (seed only inserts rules that are missing).
--
-- WHY
-- Every answer the chat widget gave lived in lib/chatbot/config.ts, so
-- changing "free delivery over $500" meant a code edit and a deploy. The
-- client edits these often, so they now live here and are edited at
-- /admin/chatbot. The code copy stays as a fallback: if this table is
-- empty or unreachable, the bot still answers with the built-in rules.
-- ===========================================================================

create table if not exists public.chatbot_rules (
  id text primary key,
  keywords text[] not null default '{}',
  answer text not null,
  chips text[] not null default '{}',
  link_label text,
  link_href text,
  action text check (action is null or action in ('quote')),
  enabled boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.chatbot_rules is
  'Keyword rules for the website chat widget. Edited at /admin/chatbot.';

create table if not exists public.chatbot_settings (
  id int primary key default 1 check (id = 1),
  greeting text not null default 'Hi! I''m the CareBy assistant. I can help with products, delivery and quotes. What do you need?',
  welcome_chips text[] not null default array['Get a quote','Delivery','Products','Talk to expert'],
  whatsapp text not null default '',
  ai_instructions text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.chatbot_settings (id) values (1) on conflict (id) do nothing;

alter table public.chatbot_rules enable row level security;
alter table public.chatbot_settings enable row level security;

-- The widget runs for signed-out visitors, so enabled rules are public.
drop policy if exists "Enabled chatbot rules are public" on public.chatbot_rules;
create policy "Enabled chatbot rules are public"
  on public.chatbot_rules for select
  using (enabled or public.is_admin());

drop policy if exists "Admins manage chatbot rules" on public.chatbot_rules;
create policy "Admins manage chatbot rules"
  on public.chatbot_rules for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Chatbot settings are public" on public.chatbot_settings;
create policy "Chatbot settings are public"
  on public.chatbot_settings for select
  using (true);

drop policy if exists "Admins update chatbot settings" on public.chatbot_settings;
create policy "Admins update chatbot settings"
  on public.chatbot_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- Seed with the rules that were in config.ts.
insert into public.chatbot_rules (id, keywords, answer, chips, link_label, link_href, action, sort_order) values
  ('greeting', array['hi','hello','hey','good morning','good evening','good afternoon'],
    'Hello! How can I help you today?', array['Get a quote','Delivery','Products','Talk to expert'], null, null, null, 10),
  ('thanks', array['thanks','thank you','thx','appreciate'],
    'You''re welcome! Anything else I can help with?', array['Get a quote','Talk to expert'], null, null, null, 20),
  ('quote', array['quote','get a quote','estimate','price','pricing','cost','how much','order','buy','rate'],
    'Happy to help. I''ll ask you 4 quick questions and our team will follow up with a quote.', '{}', null, null, 'quote', 30),
  ('delivery', array['delivery','deliver','shipping','ship','courier','drop off'],
    'Yes, we deliver across the GTA, and free delivery applies on orders over $500. Timing depends on your items and site, and the team confirms it with your quote.',
    array['Get a quote','Pickup'], null, null, null, 40),
  ('pickup', array['pickup','pick up','collect','location','address','where are you','visit','store'],
    'Pickup details are confirmed with your order.', array['Get a quote','Hours'], null, null, null, 50),
  ('hours', array['hours','open','opening','closing','close','timing'],
    'Our hours: Mon-Sat, 9am-6pm. You can leave a request here any time and we''ll reply.', array['Get a quote','Talk to expert'], null, null, null, 60),
  ('payment', array['payment','pay','etransfer','e-transfer','credit card','debit','cash','invoice'],
    'Payment options are confirmed with your quote.', array['Get a quote'], null, null, null, 70),
  ('returns', array['return','refund','exchange','warranty','damaged','wrong item'],
    'Return and warranty terms depend on the product. Tell the team the item and they''ll confirm the policy.', array['Talk to expert'], null, null, null, 80),
  ('bulk', array['bulk','wholesale','contractor','large order','discount','builder','project'],
    'Yes, we handle bulk and contractor orders. Send us your item list and quantities for a custom quote.', array['Get a quote'], null, null, null, 90),
  ('stock', array['stock','available','availability','in stock'],
    'Stock changes often, so the team confirms availability with your quote.', array['Get a quote'], null, null, null, 100),
  ('contact', array['contact','phone','call','email','support'],
    'You can reach our team through Get a quote and they will contact you.', array['Get a quote','Talk to expert'], null, null, null, 110),
  ('products', array['products','product','catalog','catalogue','what do you sell','categories','category','items'],
    'We supply building materials across: Lumber & Wood, Flooring, Plumbing, Electrical, Doors & Windows, Roofing, Hardware, Paint & Finishes. Tap one or browse the site.',
    array['Lumber & Wood','Flooring','Plumbing','Electrical','Doors & Windows','Roofing','Hardware','Paint & Finishes'], 'Browse products', '/products', null, 120),
  ('cat-lumber', array['lumber','wood','2x4','2x6','plywood','timber','osb','stud','spruce'],
    'Yes, we supply lumber & wood. Tell me what you need and the quantity, and I''ll get you a quote.', array['Get a quote','Delivery'], 'Browse Lumber & Wood', '/products', null, 200),
  ('cat-flooring', array['flooring','floor','laminate','vinyl','hardwood','tile'],
    'Yes, we supply flooring. Tell me what you need and the quantity, and I''ll get you a quote.', array['Get a quote','Delivery'], 'Browse Flooring', '/products', null, 210),
  ('cat-plumbing', array['plumbing','pipe','faucet','valve','pvc','toilet','sink'],
    'Yes, we supply plumbing. Tell me what you need and the quantity, and I''ll get you a quote.', array['Get a quote','Delivery'], 'Browse Plumbing', '/products', null, 220),
  ('cat-electrical', array['electrical','wire','wiring','outlet','breaker','switch','cable'],
    'Yes, we supply electrical. Tell me what you need and the quantity, and I''ll get you a quote.', array['Get a quote','Delivery'], 'Browse Electrical', '/products', null, 230),
  ('cat-doors-windows', array['door','doors','window','windows'],
    'Yes, we supply doors & windows. Tell me what you need and the quantity, and I''ll get you a quote.', array['Get a quote','Delivery'], 'Browse Doors & Windows', '/products', null, 240),
  ('cat-roofing', array['roofing','roof','shingle','shingles','eavestrough'],
    'Yes, we supply roofing. Tell me what you need and the quantity, and I''ll get you a quote.', array['Get a quote','Delivery'], 'Browse Roofing', '/products', null, 250),
  ('cat-hardware', array['hardware','screw','nail','bolt','fastener','hinge','tool','tools'],
    'Yes, we supply hardware. Tell me what you need and the quantity, and I''ll get you a quote.', array['Get a quote','Delivery'], 'Browse Hardware', '/products', null, 260),
  ('cat-paint', array['paint','primer','stain','coating','finish','finishes'],
    'Yes, we supply paint & finishes. Tell me what you need and the quantity, and I''ll get you a quote.', array['Get a quote','Delivery'], 'Browse Paint & Finishes', '/products', null, 270)
on conflict (id) do nothing;

select count(*) as chatbot_rules from public.chatbot_rules;
