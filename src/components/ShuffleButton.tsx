"use client";

import { useRouter } from "next/navigation";
import { usePlayer } from "@/lib/player-context";
import { shuffleArray } from "@/lib/shuffle";
import type { FeedSong } from "@/lib/supabase";

export function ShuffleButton({ songs }: { songs: FeedSong[] }) {
  const router = useRouter();
  const { playSong } = usePlayer();

  function handleShuffle() {
    if (songs.length === 0) return;
    const shuffled = shuffleArray(songs);
    playSong(shuffled, shuffled[0].id);
    router.push(`/song/${shuffled[0].id}`);
  }

  return (
    <button
      onClick={handleShuffle}
      className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full border border-[#FF9100] px-3.5 py-1.5 text-xs font-bold text-[#FF9100] transition-colors hover:bg-[#FF9100]/10"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
      </svg>
      Shuffle
    </button>
  );
}
