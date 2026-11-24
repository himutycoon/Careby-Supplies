-- schema-30: the chatbot's PayPal subscription (one row).
--
-- Written by /api/chatbot/subscription when the admin subscribes on
-- Admin > Chatbot; read by lib/chatbot/billing.ts, which asks PayPal for the
-- live status before switching the assistant on. Service-role only: RLS is
-- on with no policies, so the public and admin keys can't read or write it.

create table if not exists public.chatbot_subscription (
  id int primary key default 1 check (id = 1),
  subscription_id text not null,
  plan_id text,
  status text,
  subscriber_email text,
  updated_at timestamptz not null default now()
);

alter table public.chatbot_subscription enable row level security;
