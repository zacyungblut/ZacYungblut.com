"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CamoText } from "@/components/CamoText";
import { activeLyricIndex } from "@/lib/lyrics";
import { APPLE_MUSIC_URL, SPOTIFY_URL } from "@/lib/links";
import type { FeedSong } from "@/lib/supabase";

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** The song detail page's "Now Playing" view — cover, title, artist,
 * transport controls, and time-synced lyrics, all driven by whichever song
 * in `queue` is currently active. Skipping forward moves the whole page to
 * the next song (not just the audio), same as the app's detail screen. */
export function SongPlayer({ queue, initialSongId }: { queue: FeedSong[]; initialSongId: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentId, setCurrentId] = useState(initialSongId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentIndex = useMemo(() => queue.findIndex((s) => s.id === currentId), [queue, currentId]);
  const song = currentIndex >= 0 ? queue[currentIndex] : queue[0];
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    audio.src = song.audio_url;
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.id]);

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
    const next = queue[currentIndex + 1];
    if (next) setCurrentId(next.id);
  }

  function handleEnded() {
    const next = queue[currentIndex + 1];
    if (next) {
      setCurrentId(next.id);
    } else {
      setIsPlaying(false);
    }
  }

  function seekTo(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
    if (!isPlaying) {
      audio.play().then(
        () => setIsPlaying(true),
        () => {}
      );
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    seekTo(fraction * duration);
  }

  const progress = duration > 0 ? currentTime / duration : 0;
  const isReleased = Boolean(song.retired_at);
  const activeLine = song.lyrics ? activeLyricIndex(song.lyrics, currentTime) : -1;

  return (
    <div className="mx-auto max-w-md text-center">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
      />

      <button
        onClick={togglePlayPause}
        aria-label={isPlaying ? "Pause" : "Play"}
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
        <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
          <span className="text-[10px] font-bold tracking-widest text-[#FF9100]">
            {isReleased ? "OUT NOW" : "UNRELEASED"}
          </span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <PlayPauseIcon playing={isPlaying} className="h-12 w-12 text-[#F3ECDD]" />
        </div>
      </button>

      <CamoText as="h1" className="font-display mt-6 text-3xl uppercase sm:text-4xl">
        {song.title}
      </CamoText>
      <p className="mt-1 text-sm text-[#B9B6A6]">{song.artist}</p>

      <div className="mx-auto mt-7 max-w-xs">
        <div onClick={handleSeek} className="h-1 cursor-pointer rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#FF9100]" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-[#82806F]">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-7">
        <button onClick={handleRestart} aria-label="Restart" className="text-[#B9B6A6] transition-colors hover:text-[#F3ECDD]">
          <SkipIcon direction="back" className="h-6 w-6" />
        </button>
        <button
          onClick={togglePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#F3ECDD] text-[#F3ECDD]"
        >
          <PlayPauseIcon playing={isPlaying} className="h-7 w-7" />
        </button>
        <button
          onClick={handleSkip}
          disabled={!hasNext}
          aria-label="Skip"
          className="text-[#B9B6A6] transition-colors hover:text-[#F3ECDD] disabled:opacity-30 disabled:hover:text-[#B9B6A6]"
        >
          <SkipIcon direction="forward" className="h-6 w-6" />
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
              onClick={() => seekTo(line.t)}
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
