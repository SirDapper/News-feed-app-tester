-- Initial schema for the combatant-command news app.
-- Run with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

create extension if not exists postgis;
create extension if not exists vector;

create table commands (
  id text primary key,            -- INDOPACOM, EUCOM, ... GLOBAL
  name text not null,
  short_name text not null
);

insert into commands (id, name, short_name) values
  ('INDOPACOM', 'US Indo-Pacific Command', 'Indo-Pacific'),
  ('EUCOM', 'US European Command', 'Europe'),
  ('CENTCOM', 'US Central Command', 'Middle East'),
  ('AFRICOM', 'US Africa Command', 'Africa'),
  ('SOUTHCOM', 'US Southern Command', 'Latin America'),
  ('NORTHCOM', 'US Northern Command', 'North America'),
  ('GLOBAL', 'Global and functional', 'Global');

create table sources (
  id text primary key,
  name text not null,
  url text not null,
  trust text not null check (trust in ('official', 'outlet', 'analysis', 'social'))
);

create table stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  ai_summary boolean not null default false,
  primary_command text not null references commands(id),
  countries text[] not null default '{}',
  location geography(point),      -- map pin, filled once geocoding is added
  severity smallint not null default 1 check (severity between 1 and 5),
  embedding vector(1024),         -- for clustering; dimension depends on the embedding model chosen
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table items (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories(id) on delete cascade,
  source_id text not null,
  url text not null unique,
  title text not null,
  excerpt text not null default '',
  published_at timestamptz not null
);

create table story_commands (
  story_id uuid not null references stories(id) on delete cascade,
  command_id text not null references commands(id),
  is_primary boolean not null default false,
  primary key (story_id, command_id)
);

create table alert_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  command_id text references commands(id),
  keyword text,
  min_severity smallint not null default 4,
  created_at timestamptz not null default now()
);

create index stories_updated_at on stories (updated_at desc);
create index story_commands_command on story_commands (command_id);
create index items_story on items (story_id);

-- Stories are public to read; only the worker (service role) writes them.
alter table commands enable row level security;
alter table sources enable row level security;
alter table stories enable row level security;
alter table items enable row level security;
alter table story_commands enable row level security;
alter table alert_rules enable row level security;

create policy "public read" on commands for select using (true);
create policy "public read" on sources for select using (true);
create policy "public read" on stories for select using (true);
create policy "public read" on items for select using (true);
create policy "public read" on story_commands for select using (true);
create policy "own alert rules" on alert_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
