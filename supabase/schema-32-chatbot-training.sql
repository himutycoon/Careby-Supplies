-- schema-32: training the free answer engine. Safe to run more than once.

-- Synonym groups the engine and quick answers understand
-- ("furnace: furnance, heater"), edited in Admin > Chatbot > Settings.
alter table public.chatbot_settings add column if not exists synonyms text not null default '';

-- 👍 / 👎 from customers on each logged answer (1 / -1), and what answered
-- it (a knowledge entry id, "rule:<id>", "products", "ai", or empty when
-- the bot had no answer).
alter table public.chatbot_questions add column if not exists feedback smallint;
alter table public.chatbot_questions add column if not exists source text;
create index if not exists chatbot_questions_feedback_idx on public.chatbot_questions (feedback) where feedback is not null;
