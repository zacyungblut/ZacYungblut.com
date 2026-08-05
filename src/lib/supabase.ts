import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

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
