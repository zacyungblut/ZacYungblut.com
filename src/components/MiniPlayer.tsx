"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CamoPlayPauseIcon, CamoSkipIcon } from "@/components/icons";
import { usePlayer } from "@/lib/player-context";
import { slugify } from "@/lib/slug";

/** Persists across navigation so playback keeps going (and stays visible)
 * when the fan leaves the currently-playing song's own page — e.g. presses
 * the back chevron to browse the rest of the feed. Hidden on that song's own
 * page since its full "Now Playing" controls are already on screen there. */
export function MiniPlayer() {
  const pathname = usePathname();
  const { currentSong, isPlaying, currentTime, duration, hasNext, togglePlayPause, restart, skip } = usePlayer();

  if (!currentSong) return null;
  const slug = slugify(currentSong.title);
  if (pathname === `/song/${slug}`) return null;

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <Link
      href={`/song/${slug}`}
      className="fixed inset-x-0 bottom-0 z-20 block border-t border-white/10 bg-[#191C15]/95 backdrop-blur"
    >
      <div className="h-1 w-full bg-white/10">
        <div className="h-full bg-[#FF9100]" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[#3A4A32]">
          {currentSong.cover_url ? (
            <Image src={currentSong.cover_url} alt="" width={88} height={88} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#F3ECDD]">{currentSong.title}</p>
          <p className="truncate text-xs text-[#B9B6A6]">{currentSong.artist}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              restart();
            }}
            aria-label="Restart"
            className="flex h-8 w-8 items-center justify-center"
          >
            <CamoSkipIcon direction="back" size={20} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              togglePlayPause();
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-10 w-10 items-center justify-center"
          >
            <CamoPlayPauseIcon playing={isPlaying} size={32} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              skip();
            }}
            disabled={!hasNext}
            aria-label="Skip"
            className="flex h-8 w-8 items-center justify-center disabled:opacity-30"
          >
            <CamoSkipIcon direction="forward" size={20} />
          </button>
        </div>
      </div>
    </Link>
  );
}
