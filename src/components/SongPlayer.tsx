"use client";

import Image from "next/image";
import Link from "next/link";
import { CamoText } from "@/components/CamoText";
import { CamoPlayPauseIcon, CamoSkipIcon } from "@/components/icons";
import { activeLyricIndex } from "@/lib/lyrics";
import { APPLE_MUSIC_URL, SPOTIFY_URL } from "@/lib/links";
import { usePlayer } from "@/lib/player-context";
import type { FeedSong } from "@/lib/supabase";

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** The song detail page's "Now Playing" view — cover, title, artist,
 * transport controls, and time-synced lyrics. Reads/drives the *global*
 * player (not local state) so playback survives navigating away — e.g. the
 * back chevron to the feed. Landing on this page never changes what's
 * playing on its own; it only shows this song, ready to go, until the fan
 * presses play (or a lyric), same as the app never interrupts playback just
 * because a different song's screen was opened. */
export function SongPlayer({ queue, initialSongId }: { queue: FeedSong[]; initialSongId: string }) {
  const { currentSong, isPlaying, currentTime, duration, hasNext, playSong, togglePlayPause, restart, skip, seekTo } =
    usePlayer();

  // Always this page's own song — not whatever else happens to be playing
  // globally. The mini player elsewhere reflects that; this page reflects
  // what it was navigated to.
  const song = queue.find((s) => s.id === initialSongId) ?? queue[0];
  const isCurrent = currentSong?.id === song.id;

  function handlePlayPause() {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playSong(queue, song.id);
    }
  }

  function handleLyricClick(t: number) {
    if (isCurrent) {
      seekTo(t);
    } else {
      // Not already playing this song — start it (same queue-from-here
      // behavior as pressing play), then jump straight to this line.
      playSong(queue, song.id, t);
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!isCurrent || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    seekTo(fraction * duration);
  }

  const displayTime = isCurrent ? currentTime : 0;
  const displayDuration = isCurrent ? duration : 0;
  const progress = displayDuration > 0 ? displayTime / displayDuration : 0;
  const isReleased = Boolean(song.retired_at);
  const activeLine = isCurrent && song.lyrics ? activeLyricIndex(song.lyrics, currentTime) : -1;

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto w-56 text-left sm:w-64">
        <Link
          href="/"
          aria-label="Back to Feed"
          className="-ml-2 mb-4 inline-flex h-9 w-9 items-center justify-center text-[#B9B6A6] transition-colors hover:text-[#F3ECDD]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
      </div>

      <button
        onClick={handlePlayPause}
        aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
        className="group relative mx-auto block w-56 overflow-hidden rounded-3xl bg-[#3A4A32] shadow-[0_8px_30px_rgba(0,0,0,0.5)] sm:w-64"
      >
        {song.cover_url ? (
          <Image
            src={song.cover_url}
            alt={`"${song.title}" cover art`}
            width={512}
            height={512}
            priority
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="aspect-square w-full" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <CamoPlayPauseIcon playing={isCurrent && isPlaying} size={44} />
        </div>
      </button>

      <CamoText as="h1" className="font-display mt-6 text-3xl sm:text-4xl">
        {song.title}
      </CamoText>
      <p className="mt-1 text-sm text-[#B9B6A6]">{song.artist}</p>

      <div className="mx-auto mt-7 max-w-xs">
        <div onClick={handleSeek} className="h-1 cursor-pointer rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#FF9100]" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-[#82806F]">
          <span>{formatDuration(displayTime)}</span>
          <span>{formatDuration(displayDuration)}</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-8">
        <button onClick={restart} disabled={!isCurrent} aria-label="Restart" className="disabled:opacity-30">
          <CamoSkipIcon direction="back" size={26} />
        </button>
        <button onClick={handlePlayPause} aria-label={isCurrent && isPlaying ? "Pause" : "Play"}>
          <CamoPlayPauseIcon playing={isCurrent && isPlaying} size={64} />
        </button>
        <button onClick={skip} disabled={!isCurrent || !hasNext} aria-label="Skip" className="disabled:opacity-30">
          <CamoSkipIcon direction="forward" size={26} />
        </button>
      </div>

      {song.description ? <p className="mt-8 text-sm leading-relaxed text-[#B9B6A6]">{song.description}</p> : null}

      {isReleased ? (
        <div className="mt-8">
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
      ) : null}

      {song.lyrics && song.lyrics.length > 0 ? (
        <div className="mt-10 pb-4 text-left">
          {song.lyrics.map((line, i) => (
            <button
              key={i}
              onClick={() => handleLyricClick(line.t)}
              className={`block w-full py-1.5 text-left text-lg font-extrabold transition-colors ${
                i === activeLine ? "text-[#FF9100]" : "text-[#82806F] hover:text-[#B9B6A6]"
              }`}
            >
              {line.text}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
