-- Run in Supabase SQL Editor. All access is through authenticated server routes.
create table if not exists public.everlight_campaigns (
 id uuid primary key default gen_random_uuid(),
 code text unique not null,
 title text not null default 'The Five Days of Everlight',
 chapter int not null default 1 check (chapter between 1 and 5),
 scene text not null default 'The Invitation',
 announcement text not null default 'The kingdom awaits its heroes.',
 combat jsonb not null default '{"active":false,"enemy":"","hp":0,"maxHp":0,"turn":0}'::jsonb,
 created_at timestamptz not null default now()
);
create table if not exists public.everlight_players (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.everlight_campaigns(id) on delete cascade,
 slot text not null check (slot in ('Q','Harmony')),
 hero_name text not null default '',
 hero_class text not null default 'Guardian',
 origin text not null default 'Human',
 trait text not null default 'Courage',
 hp int not null default 16,
 max_hp int not null default 16,
 gold int not null default 0,
 inventory jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 unique(campaign_id,slot)
);
create table if not exists public.everlight_events (
 id bigint generated always as identity primary key,
 campaign_id uuid not null references public.everlight_campaigns(id) on delete cascade,
 player_id uuid references public.everlight_players(id) on delete cascade,
 kind text not null check (kind in ('clue','quest','dice','story','reward','combat','system')),
 title text not null,
 body text not null default '',
 visible_to text not null default 'all' check (visible_to in ('all','Q','Harmony','dm')),
 created_at timestamptz not null default now()
);
create index if not exists everlight_events_campaign_idx on public.everlight_events(campaign_id,id desc);
alter table public.everlight_campaigns enable row level security;
alter table public.everlight_players enable row level security;
alter table public.everlight_events enable row level security;
-- No anon/authenticated table policies: service-role-only access through server API.
