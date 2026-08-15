import type { Metadata } from "next";
import { FeedPlayer } from "@/components/FeedPlayer";
import { getSong } from "@/lib/supabase";
import { APPLE_MUSIC_URL, SPOTIFY_URL } from "@/lib/links";

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
  const song = await getSong(id);

  if (!song) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#11130F] px-6 text-center">
        <p className="text-[#B9B6A6]">This song couldn&apos;t be found.</p>
      </main>
    );
  }

  const isReleased = Boolean(song.retired_at);

  return (
    <main className="min-h-screen bg-[#11130F] pb-28">
      <div className="mx-auto max-w-2xl px-5 pt-14 text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-[#FF9100]">{isReleased ? "OUT NOW" : "UNRELEASED"}</p>
        <h1 className="font-display mt-1 text-4xl uppercase text-[#F3ECDD]">{song.title}</h1>
        <p className="mt-2 text-sm text-[#B9B6A6]">{song.artist}</p>

        <div className="mx-auto mt-8 max-w-xs">
          <FeedPlayer songs={[song]} autoPlaySongId={song.id} />
        </div>

        {isReleased ? (
          <div className="mt-10">
            <p className="text-xs tracking-wide text-[#82806F]">Stream it everywhere</p>
            <div className="mt-3 flex items-center justify-center gap-6 text-[13px] text-[#B9B6A6]">
              <a href={SPOTIFY_URL} target="_blank" rel="noopener" className="transition-colors hover:text-[#F3ECDD]">
                Spotify
              </a>
              <a href={APPLE_MUSIC_URL} target="_blank" rel="noopener" className="transition-colors hover:text-[#F3ECDD]">
                Apple Music
              </a>
            </div>
          </div>
        ) : (
          <p className="mt-10 text-xs text-[#82806F]">Vote with your plays — the most played song releases next.</p>
        )}
      </div>
    </main>
  );
}
