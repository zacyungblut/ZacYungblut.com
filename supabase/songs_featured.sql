-- Run this against the same Supabase project as the app (SQL Editor, or
-- `supabase db push` from the ZacYungblut app repo).
--
-- Adds a `featured` flag so the website's homepage can pin a handful of
-- songs above the rest of the catalog, set from /admin and read via
-- songs_feed_public below. Defaults to false so every existing row keeps
-- today's plain track_number ordering.
alter table public.songs
  add column if not exists featured boolean not null default false;

-- Appended as a trailing column, same reasoning as description/lyrics
-- before it — `create or replace view` can only add trailing columns,
-- never reorder or drop existing ones, so this stays a safe re-run.
create or replace view public.songs_feed_public as
  select id, title, artist, cover_url, audio_url, duration_seconds, track_number, retired_at, created_at,
    description, lyrics, featured
  from public.songs;

grant select on public.songs_feed_public to anon, authenticated;
