import type { Metadata } from "next";
import { CamoText } from "@/components/CamoText";
import { SongGrid } from "@/components/SongGrid";
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
          <CamoText as="h1" className="font-display text-4xl uppercase">
            Zac Yungblut
          </CamoText>
          <p className="mt-1 text-xs font-bold tracking-[0.2em] text-[#FF9100]">UNDERGROUND</p>
          <p className="mt-3 text-sm leading-relaxed text-[#B9B6A6]">
            Some of Zac&apos;s unreleased songs
          </p>
        </div>

        {songs.length > 0 ? (
          <SongGrid songs={songs} />
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
