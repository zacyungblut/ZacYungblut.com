-- Run this against the same Supabase project as the app (SQL Editor, or
-- `supabase db push` from the ZacYungblut app repo after copying this block
-- into supabase/schema.sql).
--
-- Playback analytics for the website (zacyungblut.com) — separate from the
-- app's own `plays` table, which is scoped to real `auth.users` accounts
-- that the website's anonymous visitors don't have. `visitor_id` is a random
-- id the browser generates once and keeps in localStorage — enough to group
-- a repeat visitor's plays together without any real identity or login.
--
-- One row per concluded listen (logged when playback switches songs, ends,
-- or the tab closes) — not one row per second of playback.
create table if not exists public.web_plays (
  id bigint generated always as identity primary key,
  song_id uuid not null references public.songs (id) on delete cascade,
  visitor_id uuid not null,
  started_at timestamptz not null default now(),
  listened_seconds numeric not null default 0,
  song_duration_seconds integer,
  -- Coarse geo only (country/region/city), derived server-side from Vercel's
  -- edge geo headers — never the raw IP itself, which this table doesn't
  -- store at all.
  country text,
  region text,
  city text,
  referrer text,
  user_agent text
);

alter table public.web_plays enable row level security;

-- Any website visitor can log their own play — there's no account to scope
-- this to, so "anyone can insert" is the whole policy. There is deliberately
-- no select policy: this table holds visitor location/behavior data, so
-- reads only ever happen server-side via the service-role key on the
-- password-gated /stats page, never through the public anon client.
drop policy if exists "Anyone can log a web play" on public.web_plays;
create policy "Anyone can log a web play"
  on public.web_plays for insert
  to anon, authenticated
  with check (true);

create index if not exists web_plays_song_id_idx on public.web_plays (song_id);
create index if not exists web_plays_visitor_id_idx on public.web_plays (visitor_id);
create index if not exists web_plays_started_at_idx on public.web_plays (started_at desc);
