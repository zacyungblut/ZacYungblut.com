"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { FeedSong } from "@/lib/supabase";

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function FeedPlayer({
  songs,
  queue,
  autoPlaySongId,
  linkToDetail,
}: {
  /** Tiles rendered in the grid. */
  songs: FeedSong[];
  /** What the skip button advances through — defaults to `songs`. Lets a
   * song's detail page show just that one tile while still skipping forward
   * into the rest of the catalog, same as the app's "song plus whatever
   * comes after it" queue. */
  queue?: FeedSong[];
  autoPlaySongId?: string;
  /** Tapping a tile opens its detail page instead of playing inline — used
   * by the homepage grid. */
  linkToDetail?: boolean;
}) {
  const playQueue = queue ?? songs;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(autoPlaySongId ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentIndex = useMemo(() => playQueue.findIndex((s) => s.id === currentId), [playQueue, currentId]);
  const currentSong = currentIndex >= 0 ? playQueue[currentIndex] : null;
  const hasNext = currentIndex >= 0 && currentIndex < playQueue.length - 1;

  // Swap the <audio> source whenever a different song is selected, and try
  // to autoplay it — browsers allow this because it's the direct result of
  // a user click (or, for a shared song link, page load is treated as
  // intentional enough by most browsers; if it's blocked the play button
  // just shows a paused state instead of erroring).
  useEffect(() => {
    if (!currentSong || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src = currentSong.audio_url;
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id]);

  function handleSelect(song: FeedSong) {
    if (song.id === currentId) {
      togglePlayPause();
      return;
    }
    setCurrentId(song.id);
  }

  function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(
        () => setIsPlaying(true),
        () => {}
      );
    }
  }

  function handleRestart() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  }

  function handleSkip() {
    const next = playQueue[currentIndex + 1];
    if (next) setCurrentId(next.id);
  }

  function handleEnded() {
    const next = playQueue[currentIndex + 1];
    if (next) {
      setCurrentId(next.id);
    } else {
      setIsPlaying(false);
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = fraction * duration;
    setCurrentTime(audio.currentTime);
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div>
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {songs.map((song) => {
          const isActive = song.id === currentId;
          const tileContent = (
            <>
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
                  <PlayPauseIcon playing={isActive && isPlaying} className="h-9 w-9 text-[#F3ECDD]" />
                </div>
              </div>
              <p
                className={`mt-2 truncate text-sm font-semibold ${isActive ? "text-[#FF9100]" : "text-[#F3ECDD]"}`}
                style={{ maxWidth: "100%" }}
              >
                {song.title}
              </p>
              <p className="truncate text-xs text-[#B9B6A6]">{song.artist}</p>
            </>
          );

          return linkToDetail ? (
            <Link key={song.id} href={`/song/${song.id}`} className="group flex flex-col items-start text-left">
              {tileContent}
            </Link>
          ) : (
            <button
              key={song.id}
              onClick={() => handleSelect(song)}
              className="group flex flex-col items-start text-left"
            >
              {tileContent}
            </button>
          );
        })}
      </div>

      {currentSong ? (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[#191C15]/95 backdrop-blur">
          <div onClick={handleSeek} className="h-1 w-full cursor-pointer bg-white/10">
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
              <p className="truncate text-xs text-[#B9B6A6]">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={handleRestart}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#B9B6A6]"
                aria-label="Restart"
              >
                <SkipIcon direction="back" className="h-4 w-4" />
              </button>
              <button
                onClick={togglePlayPause}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#F3ECDD]"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                <PlayPauseIcon playing={isPlaying} className="h-5 w-5" />
              </button>
              <button
                onClick={handleSkip}
                disabled={!hasNext}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#B9B6A6] disabled:opacity-30"
                aria-label="Skip"
              >
                <SkipIcon direction="forward" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlayPauseIcon({ playing, className }: { playing: boolean; className?: string }) {
  if (playing) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function SkipIcon({ direction, className }: { direction: "back" | "forward"; className?: string }) {
  if (direction === "back") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <rect x="5" y="5" width="2.2" height="14" rx="1" />
        <path d="M18 5v14l-10-7z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6 5v14l10-7z" />
      <rect x="16.8" y="5" width="2.2" height="14" rx="1" />
    </svg>
  );
}
