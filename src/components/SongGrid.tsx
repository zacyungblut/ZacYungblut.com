import Image from "next/image";
import Link from "next/link";
import type { FeedSong } from "@/lib/supabase";

/** The homepage's catalog grid — every tile just opens that song's detail
 * page, where the actual player lives. */
export function SongGrid({ songs }: { songs: FeedSong[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {songs.map((song) => (
        <Link key={song.id} href={`/song/${song.id}`} className="group flex flex-col items-start text-left">
          <div className="relative w-full overflow-hidden rounded-lg bg-[#3A4A32]">
            {song.cover_url ? (
              <Image
                src={song.cover_url}
                alt={`"${song.title}" cover art`}
                width={400}
                height={400}
                className="aspect-square w-full object-cover transition-opacity group-hover:opacity-90"
              />
            ) : (
              <div className="aspect-square w-full" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9 text-[#F3ECDD]">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-[#F3ECDD]" style={{ maxWidth: "100%" }}>
            {song.title}
          </p>
          <p className="truncate text-xs text-[#B9B6A6]">{song.artist}</p>
        </Link>
      ))}
    </div>
  );
}
