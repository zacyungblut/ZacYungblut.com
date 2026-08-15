import type { Metadata } from "next";
import { FeedPlayer } from "@/components/FeedPlayer";
import { getFeedSongs } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Zac Yungblut — Underground",
  description: "Listen to Zac Yungblut's unreleased songs. The most played gets released next.",
};

// The catalog changes over time (new songs added, songs retired once
// released) — never serve a cached snapshot of it.
export const dynamic = "force-dynamic";

export default async function Home() {
  const songs = await getFeedSongs();

  return (
    <main className="min-h-screen bg-[#11130F] pb-28">
      <div className="mx-auto max-w-2xl px-5 pt-14">
        <div className="mb-8">
          <h1
            className="font-display bg-clip-text text-4xl uppercase text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.4)), url('/textures/camo.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            Zac Yungblut
          </h1>
          <p className="mt-1 text-xs font-bold tracking-[0.2em] text-[#FF9100]">UNDERGROUND</p>
          <p className="mt-3 text-sm leading-relaxed text-[#B9B6A6]">
            Unreleased songs, straight from the artist. Listen below — the most played gets released next.
          </p>
        </div>

        {songs.length > 0 ? (
          <FeedPlayer songs={songs} linkToDetail />
        ) : (
          <p className="text-sm text-[#82806F]">Nothing in the queue right now — check back soon.</p>
        )}
      </div>

      <footer className="mx-auto mt-16 flex max-w-2xl items-center justify-center gap-5 px-5 text-xs text-[#82806F]">
        <a href="/support" className="transition-colors hover:text-[#B9B6A6]">
          Support
        </a>
        <a href="/privacy" className="transition-colors hover:text-[#B9B6A6]">
          Privacy Policy
        </a>
        <a href="/app" className="transition-colors hover:text-[#B9B6A6]">
          The App
        </a>
      </footer>
    </main>
  );
}
