import { createClient } from "@supabase/supabase-js";
import { slugify } from "./slug";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Falls back to a harmless placeholder so importing this module never
// throws — createClient() validates its arguments synchronously, and
// without this a missing env var on the host would fail the whole build,
// not just this page.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

export type LyricLine = { t: number; text: string };

export type FeedSong = {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  audio_url: string;
  duration_seconds: number | null;
  track_number: number | null;
  retired_at: string | null;
  created_at: string;
  description: string | null;
  lyrics: LyricLine[] | null;
};

/** Reads from `songs_feed_public`, a view that (unlike `songs_public`)
 * includes `audio_url` — this is what lets the website stream the catalog
 * directly, no app install required. */
export async function getSong(id: string): Promise<FeedSong | null> {
  const { data } = await supabase.from("songs_feed_public").select("*").eq("id", id).maybeSingle();
  return data;
}

/** Every song regardless of release status — used to look up titles for
 * historical plays on the /stats page, including songs that have since been
 * released and dropped off the active Feed. */
export async function getAllSongsForLookup(): Promise<FeedSong[]> {
  const { data, error } = await supabase.from("songs_feed_public").select("*");
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

/** Resolves a URL slug (e.g. "big-sky") back to a song — computed from the
 * title on the fly rather than stored, so it can't drift out of sync with a
 * title edit. Also accepts a raw song id, so a link shared before slugs
 * existed keeps working. */
export async function getSongBySlug(slug: string): Promise<FeedSong | null> {
  const songs = await getAllSongsForLookup();
  return songs.find((s) => slugify(s.title) === slug || s.id === slug) ?? null;
}

/** The active (not-yet-released) catalog, in release-queue order — the
 * website's Feed. Retired songs are already out on Spotify/Apple, so they're
 * left off this list the same way they're left off the app's Feed tab. */
export async function getFeedSongs(): Promise<FeedSong[]> {
  const { data, error } = await supabase
    .from("songs_feed_public")
    .select("*")
    .is("retired_at", null)
    .order("track_number", { ascending: true });
  // Fails soft (empty feed) rather than 500ing the homepage — same reasoning
  // as the placeholder client above.
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}
