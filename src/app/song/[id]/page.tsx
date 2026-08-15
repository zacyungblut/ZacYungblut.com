import type { Metadata } from "next";
import { SongPlayer } from "@/components/SongPlayer";
import { getFeedSongs, getSong } from "@/lib/supabase";

const FALLBACK_TITLE = "A song from Zac Yungblut";
const FALLBACK_DESCRIPTION = "Someone shared a song with you from Zac Yungblut's Underground feed.";

// retired_at flips (and songs get added) over time — never serve a cached
// snapshot of a song's page.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const song = await getSong(id);

  if (!song) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }

  const title = `"${song.title}" — Zac Yungblut`;
  const description = song.retired_at
    ? `${song.artist} — out now. Stream it, or listen here and help decide what's next.`
    : `${song.artist} — unreleased. Listen here first.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: song.cover_url ? [song.cover_url] : undefined,
    },
  };
}

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [song, activeFeed] = await Promise.all([getSong(id), getFeedSongs()]);

  if (!song) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#11130F] px-6 text-center">
        <p className="text-[#B9B6A6]">This song couldn&apos;t be found.</p>
      </main>
    );
  }

  // This song plus whatever comes after it in the release queue — so
  // skipping forward from a shared song link keeps going through the rest
  // of the catalog, same as picking it up mid-browse would. Falls back to
  // just this song alone if it's not part of the active queue (e.g. it's
  // already released).
  const feedIndex = activeFeed.findIndex((s) => s.id === song.id);
  const queue = feedIndex === -1 ? [song] : activeFeed.slice(feedIndex);

  return (
    <main className="min-h-screen bg-[#11130F] px-5 pb-20 pt-10">
      <SongPlayer queue={queue} initialSongId={song.id} />
    </main>
  );
}
