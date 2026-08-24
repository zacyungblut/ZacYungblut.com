import "server-only";
import { supabaseAdmin } from "./supabase-admin";
import type { LyricLine } from "./supabase";

// Same bucket (and audio/covers folder split) the ZacYungblut app itself
// uploads into — confirmed against a live row's cover_url/audio_url rather
// than assumed, so admin uploads land in the same place fans' streams
// already resolve from instead of fragmenting storage across two buckets.
const BUCKET = "song-media";

export type UploadTarget = { signedUrl: string; publicUrl: string };

/** Mints a signed upload URL scoped to one new file path in the `song-media`
 * bucket. The browser PUTs the file bytes straight to that URL — never
 * through this site's own server — so a full-length song upload never has
 * to fit inside Vercel's request body limit. Minted with the service-role
 * client, which bypasses storage RLS entirely, so no bucket policy changes
 * are needed for this to work. */
export async function createUploadTarget(kind: "audio" | "cover", extension: string): Promise<UploadTarget> {
  const folder = kind === "audio" ? "audio" : "covers";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "Could not create an upload URL.");

  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
  return { signedUrl: data.signedUrl, publicUrl: pub.publicUrl };
}

/** One past the highest track_number in the catalog (active or retired) —
 * the natural next slot in the release queue for a freshly uploaded song. */
export async function nextTrackNumber(): Promise<number> {
  const { data } = await supabaseAdmin
    .from("songs")
    .select("track_number")
    .order("track_number", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return (data?.track_number ?? 0) + 1;
}

export type NewSongInput = {
  title: string;
  artist: string;
  description: string | null;
  trackNumber: number | null;
  durationSeconds: number | null;
  coverUrl: string | null;
  audioUrl: string;
  lyrics: LyricLine[] | null;
  featured: boolean;
};

/** Inserts directly into `songs` with the service-role client — this is the
 * same table songs_feed_public views, so a successful insert shows up on
 * the Feed immediately (once /admin's revalidatePath runs). */
export async function insertSong(input: NewSongInput): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("songs")
    .insert({
      title: input.title,
      artist: input.artist,
      description: input.description,
      track_number: input.trackNumber,
      duration_seconds: input.durationSeconds,
      cover_url: input.coverUrl,
      audio_url: input.audioUrl,
      lyrics: input.lyrics,
      featured: input.featured,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not save the song.");
  return data.id as string;
}

/** Flips the homepage-featured flag on an existing song. */
export async function setSongFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await supabaseAdmin.from("songs").update({ featured }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Retires (or un-retires) a song — the same retired_at column
 * getFeedSongs() filters on, so this is the same "off the Feed" state the
 * app's own release flow puts a song into once it's out on Spotify/Apple. */
export async function setSongRetired(id: string, retired: boolean): Promise<void> {
  const { error } = await supabaseAdmin
    .from("songs")
    .update({ retired_at: retired ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
