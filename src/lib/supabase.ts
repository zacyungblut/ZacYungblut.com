import { createClient } from "@supabase/supabase-js";

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

export type SongPublic = {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  description: string | null;
  retired_at: string | null;
  created_at: string;
};

/** Reads from `songs_public`, a view that deliberately excludes `audio_url`
 * and `lyrics` — shared song links get a real title/artist/cover for their
 * link preview without letting anyone listen outside the app. */
export async function getPublicSong(id: string): Promise<SongPublic | null> {
  const { data } = await supabase.from("songs_public").select("*").eq("id", id).maybeSingle();
  return data;
}
