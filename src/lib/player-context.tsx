"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { FeedSong } from "./supabase";

type PlayerState = {
  queue: FeedSong[];
  currentSong: FeedSong | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasNext: boolean;
  /** Starts playing `songId` from `queue` — a no-op on the queue's own
   * playback position if that song is already the one playing (so
   * revisiting its page doesn't restart it from 0). */
  playSong: (queue: FeedSong[], songId: string) => void;
  togglePlayPause: () => void;
  restart: () => void;
  skip: () => void;
  seekTo: (seconds: number) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

// Mounted once in the root layout so the <audio> element — and playback —
// survives client-side navigation between pages, instead of being torn down
// and recreated by whichever page happened to render it.
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<FeedSong[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentIndex = useMemo(() => queue.findIndex((s) => s.id === currentId), [queue, currentId]);
  const currentSong = currentIndex >= 0 ? queue[currentIndex] : null;
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;

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

  function playSong(newQueue: FeedSong[], songId: string) {
    setQueue(newQueue);
    if (songId !== currentId) setCurrentId(songId);
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

  function restart() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  }

  function skip() {
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

  const value: PlayerState = {
    queue,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    hasNext,
    playSong,
    togglePlayPause,
    restart,
    skip,
    seekTo,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}
