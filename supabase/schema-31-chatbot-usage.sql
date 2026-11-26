-- schema-31: chatbot usage, recently deleted, and quote request tracking.
-- Safe to run more than once.

-- 1. One row each time a quick answer replies on the website.
--    Written by /api/chat/hit (service role); read by admins for the
--    "used N times" counts in Admin > Chatbot > Library.
create table if not exists public.chatbot_rule_hits (
  id bigserial primary key,
  rule_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists chatbot_rule_hits_created_idx on public.chatbot_rule_hits (created_at desc);
alter table public.chatbot_rule_hits enable row level security;
drop policy if exists "admins read rule hits" on public.chatbot_rule_hits;
create policy "admins read rule hits" on public.chatbot_rule_hits
  for select using (public.is_admin());

-- 2. Recently deleted quick answers and knowledge, so a delete can be undone.
create table if not exists public.chatbot_trash (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('rule', 'knowledge')),
  label text not null,
  data jsonb not null,
  deleted_at timestamptz not null default now()
);
alter table public.chatbot_trash enable row level security;
drop policy if exists "admins manage chatbot trash" on public.chatbot_trash;
create policy "admins manage chatbot trash" on public.chatbot_trash
  for all using (public.is_admin()) with check (public.is_admin());

-- 3. Quote requests from the chat: status + note, managed by admins.
alter table public.chat_leads add column if not exists status text not null default 'new';
alter table public.chat_leads add column if not exists note text;
alter table public.chat_leads enable row level security;
drop policy if exists "admins read chat leads" on public.chat_leads;
create policy "admins read chat leads" on public.chat_leads
  for select using (public.is_admin());
drop policy if exists "admins update chat leads" on public.chat_leads;
create policy "admins update chat leads" on public.chat_leads
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete chat leads" on public.chat_leads;
create policy "admins delete chat leads" on public.chat_leads
  for delete using (public.is_admin());
