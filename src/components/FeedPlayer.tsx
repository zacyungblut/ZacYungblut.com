"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { FeedSong } from "@/lib/supabase";

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function FeedPlayer({ songs, autoPlaySongId }: { songs: FeedSong[]; autoPlaySongId?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(autoPlaySongId ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentIndex = useMemo(() => songs.findIndex((s) => s.id === currentId), [songs, currentId]);
  const currentSong = currentIndex >= 0 ? songs[currentIndex] : null;

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

  function handleEnded() {
    const next = songs[currentIndex + 1];
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
          return (
            <button
              key={song.id}
              onClick={() => handleSelect(song)}
              className="group flex flex-col items-start text-left"
            >
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
            <button
              onClick={togglePlayPause}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#F3ECDD]"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              <PlayPauseIcon playing={isPlaying} className="h-5 w-5" />
            </button>
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
