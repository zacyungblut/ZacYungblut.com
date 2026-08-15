-- Run this against the same Supabase project as the app (SQL Editor, or
-- `supabase db push` from the ZacYungblut app repo after copying this block
-- into supabase/schema.sql next to the existing `songs_public` view).
--
-- Public playback for the website's Feed (zacyungblut.com): the site now
-- lets anyone stream the catalog, including unreleased songs, without
-- installing the app — that's what drives the "plays decide what releases
-- next" mechanic (e.g. an Instagram Story poll linking here). Unlike
-- songs_public, this deliberately includes audio_url. Runs as the view
-- owner, so it bypasses the authenticated-only policy on `songs` the same
-- way songs_public does.
--
-- description/lyrics were added after the view's first release, appended at
-- the end — `create or replace view` can't reorder or drop existing
-- columns, only add trailing ones, so this stays a safe re-run.
create or replace view public.songs_feed_public as
  select id, title, artist, cover_url, audio_url, duration_seconds, track_number, retired_at, created_at,
    description, lyrics
  from public.songs;

grant select on public.songs_feed_public to anon, authenticated;
